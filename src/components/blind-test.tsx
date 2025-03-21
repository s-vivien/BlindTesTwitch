import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cleanValueLight, sorensenDiceScore } from 'helpers';
import React, { useEffect, useRef, useState } from 'react';
import { Button, Dropdown } from 'react-bootstrap';
import { Client, Options } from 'tmi.js';
import { launchTrack, setRepeatMode } from '../services/spotify-api';
import { useAuthStore } from './store/auth-store';
import { BlindTestTrack, GuessableState, GuessableType, useBTTracksStore } from './store/blind-test-tracks-store';
import { useGlobalStore } from './store/global-store';
import { Answer, Player, usePlayerStore } from './store/player-store';
import { TwitchMode, useSettingsStore } from './store/settings-store';
import Podium from './podium';
import Leaderboard from './leaderboard';
import GuessView, { Guess } from './guessable-view';

let twitchCallback: (nick: string, tid: string, msg: string) => void = () => {};

const DISPLAYED_GUESS_NICK_CHAT_LIMIT = 20;
const SCORE_CMD_DELAY = 2000;

const BlindTest = () => {

  const twitchClient = useRef<Client | null>(null);
  const trackStart = useRef<number>(-1);
  const delayedAnswers = useRef<Answer[][]>([]);
  const playersBackup = useRef<Record<string, Player>>({});
  const guessTimeouts = useRef<(NodeJS.Timeout | undefined)[]>([]);
  const scoreCommandTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const delayedScoreCommands = useRef<string[]>([]);

  const settingsStore = useSettingsStore();
  const btStore = useBTTracksStore();
  const setSubtitle = useGlobalStore((state) => state.setSubtitle);

  const initPlayer = usePlayerStore((state) => state.initPlayer);
  const backupPlayers = usePlayerStore((state) => state.backup);
  const restorePlayers = usePlayerStore((state) => state.restorePlayers);
  const recordAnswers = usePlayerStore((state) => state.recordAnswers);
  const getPlayersFromNick = usePlayerStore((state) => state.getPlayers);
  const getPlayersCopy = usePlayerStore((state) => state.getDeepCopy);

  const twitchNick = useAuthStore((state) => state.twitchNick);
  const twitchToken = useAuthStore((state) => state.twitchOauthToken);

  const [isFinished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentTrack, setCurrentTrack] = useState<BlindTestTrack | null>(null);
  const [podiumDisplayed, setPodiumDisplayed] = useState(false);

  useEffect(() => {
    if (twitchNick) {
      console.log(`Twitch channel changed to ${twitchNick}`);
      twitchConnection(twitchNick, settingsStore.chatNotifications);
      return () => {
        twitchDisconnection();
      };
    }
  }, [twitchNick]);

  useEffect(() => {
    if (playing && !currentTrack?.done) {
      setSubtitle(`Playing song #${btStore.doneTracks + 1} out of ${btStore.tracks.length}`);
    } else if (btStore.tracks.length - btStore.doneTracks > 0) {
      setSubtitle(`${btStore.tracks.length - btStore.doneTracks} tracks left`);
    } else {
      setSubtitle('Blind-test is finished !');
      setFinished(true);
    }
  }, [btStore.tracks.length, playing, btStore.doneTracks]);

  const twitchDisconnection = () => {
    console.log('Disconnecting from Twitch...');
    if (twitchClient.current !== null) {
      twitchClient.current.disconnect();
    }
  };

  const twitchConnection = (chan: string, chatNotifications: boolean) => {
    let opts: Options = {
      options: {
        skipUpdatingEmotesets: true,
      },
      channels: [chan],
    };
    if (chatNotifications) {
      opts.identity = {
        username: 'foo',
        password: twitchToken || '',
      };
    }
    twitchClient.current = new Client(opts);
    twitchClient.current.connect();
    twitchClient.current.on('message', (_channel: any, _tags: any, _message: any, _self: any) => {
      if (_self) return;
      if (_tags['message-type'] !== 'whisper') {
        return twitchCallback(_tags['display-name'], _tags['user-id'], _message);
      }
    });
  };

  const backupState = () => {
    btStore.backup();
    backupPlayers();
  };

  const cancelLastTrackPoints = () => {
    restorePlayers(playersBackup.current);
    backupPlayers();
  };

  const flushScoreCommands = () => {
    const msg = getPlayersFromNick(delayedScoreCommands.current)
      .map((player: Player) => `${player.nick} is #${player.rank} [${player.score} point${player.score > 1 ? 's' : ''}]`)
      .join(', ');

    if (msg && twitchNick) {
      twitchClient.current?.say(twitchNick, msg);
    }

    delayedScoreCommands.current = [];
    scoreCommandTimeout.current = undefined;
  };

  const handleScoreCommand = (nick: string) => {
    if (settingsStore.scoreCommandMode === TwitchMode.Whisper) {
      const player = getPlayersFromNick([nick])[0];
      twitchClient.current?.whisper(nick, `You are #${player.rank} [${player.score} point${player.score > 1 ? 's' : ''}]`);
    } else if (settingsStore.scoreCommandMode === TwitchMode.Channel && twitchNick) {
      if (!scoreCommandTimeout.current) {
        scoreCommandTimeout.current = setTimeout(flushScoreCommands, SCORE_CMD_DELAY);
      }
      if (!delayedScoreCommands.current.includes(nick)) {
        delayedScoreCommands.current.push(nick);
      }
    }
  };

  const onProposition = (nick: string, tid: string, message: string) => {
    // console.log(`${new Date()} : ${nick} said ${message}`);
    if (settingsStore.addEveryUser) {
      initPlayer(nick, tid);
    }
    if (message === '!score') {
      handleScoreCommand(nick);
    } else if (playing && currentTrack !== null) {
      const proposition = cleanValueLight(message);
      for (let i = 0; i < currentTrack.guessables.length; i++) {
        const guess = guesses[i];
        if (guess.guessed) continue; // guess is no longer active
        if (guess.guessedBy.find((g) => g.nick === nick)) continue; // the player already guessed this item
        const guessable = currentTrack.guessables[i];
        let matched = false;
        for (const toGuess of guessable.toGuess) {
          const d = sorensenDiceScore(toGuess, proposition);
          // console.log(`[${toGuess}] [${proposition}] ${d}`);
          if (d >= 0.8) {
            let isCombo = false;
            let isFirst = false;
            if (settingsStore.acceptanceDelay > 0 && guess.guessedBy.length === 0) {
              isFirst = true;
            } // first guess for this item
            for (let g of guesses) {
              if (g.guessedBy.find((gb) => gb.nick === nick)) {
                isCombo = true; // this player already guessed something else on this track
                break;
              }
            }
            initPlayer(nick, tid);
            updateGuessState(i, new Answer(nick, isFirst, isCombo, performance.now() - trackStart.current));
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
    }
  };
  twitchCallback = onProposition;

  const endGuess = (index: number, delayed: boolean) => {
    setGuesses(guesses => {
      let newGuesses = [...guesses];
      newGuesses[index].guessed = true;
      if (settingsStore.chatNotifications && twitchNick) {
        let msg = `✅ [${newGuesses[index].guessable.toGuess[0]}] correctly guessed by ${guesses[index].guessedBy.slice(0, DISPLAYED_GUESS_NICK_CHAT_LIMIT).map((gb) => `${gb.nick} [+${gb.points}]`).join(', ')}`;
        if (guesses[index].guessedBy.length > DISPLAYED_GUESS_NICK_CHAT_LIMIT) msg += `, and ${guesses[index].guessedBy.length - DISPLAYED_GUESS_NICK_CHAT_LIMIT} more`;
        twitchClient.current?.say(twitchNick, msg);
      }
      return newGuesses;
    });
    if (delayed) {
      recordAnswers(delayedAnswers.current[index]);
    }
  };

  const updateGuessState = (index: number, answer: Answer) => {
    setGuesses(guesses => {
      const firstGuess = guesses[index].guessedBy.length === 0;
      let newGuesses = [...guesses];
      newGuesses[index].guessedBy.push({ nick: answer.nick, points: answer.getPoints() });
      if (settingsStore.acceptanceDelay === 0) {
        endGuess(index, false);
        recordAnswers([answer]);
      } else {
        if (firstGuess) {
          const to = setTimeout(() => {
            endGuess(index, true);
            guessTimeouts.current[index] = undefined;
          }, settingsStore.acceptanceDelay * 1000);
          guessTimeouts.current[index] = to;
        }
        delayedAnswers.current[index].push(answer);
      }
      return newGuesses;
    });
  };

  const allGuessed = () => {
    return playing && guesses.reduce((prev, curr) => prev && curr.guessed, true);
  };

  const triggerTimeouts = () => {
    for (let index = 0; index < guessTimeouts.current.length; index++) {
      if (guessTimeouts.current[index]) {
        clearTimeout(guessTimeouts.current[index]);
        endGuess(index, true);
        guessTimeouts.current[index] = undefined;
      }
    }
  };

  useEffect(() => {
    if (currentTrack && !currentTrack.done && allGuessed()) {
      endSong();
    }
  }, [playing, guesses, currentTrack]);

  const endSong = () => {
    if (currentTrack && !currentTrack.done) {
      currentTrack.done = true;
      btStore.incrementDoneTracks();
      backupState();
    }
  };

  const handleReveal = () => {
    if (currentTrack && !currentTrack.done) {
      triggerTimeouts();
      let newGuesses = [...guesses];
      guesses.forEach((g: Guess) => { g.guessed = true; });
      setGuesses(newGuesses);
      endSong();
    }
  };

  const handleNextSong = async () => {
    handleReveal();
    playersBackup.current = getPlayersCopy(); // store a deep copy
    triggerTimeouts();
    const track = btStore.getNextTrack(shuffled);
    setPlaying(false);
    setLoading(true);
    launchTrack(track.track_uri, settingsStore.deviceId).then(() => {
      setRepeatMode(true, settingsStore.deviceId);
      setCurrentTrack(track);
      const newGuesses: Guess[] = [];
      delayedAnswers.current = [];
      guessTimeouts.current = [];
      for (let guessable of track.guessables) {
        newGuesses.push({ guessed: guessable.state !== GuessableState.Enabled, guessedBy: [], guessable: guessable });
        delayedAnswers.current.push([]);
        guessTimeouts.current.push(undefined);
      }
      trackStart.current = performance.now();
      setGuesses(newGuesses);
      setPlaying(true);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  const toggleShuffle = () => {
    setShuffled(!shuffled);
  };

  return (
    <>
      <div id="blindtest">
        <div className="row mb-4">
          <div className="col-md-8">
            <div className="p-3 mb-2 bt-left-panel border rounded-3">
              <div id="cover" className="cover ">
                {allGuessed() &&
                  <img id="cover-image" src={currentTrack?.img} alt="cover" />
                }
                {(playing || loading) && !allGuessed() &&
                  <img src="/BlindTesTwitch/audio-wave.svg" />
                }
                {!playing && !loading &&
                  <FontAwesomeIcon icon={['fas', 'volume-mute']} size="sm" />
                }
              </div>
              {playing && currentTrack !== null &&
                <div style={{ flex: 1 }}>
                  {
                    [GuessableType.Title, GuessableType.Artist, GuessableType.Misc].map(type => {
                      const filteredGuesses = guesses.filter(g => g.guessable.type === type && g.guessable.state !== GuessableState.DisabledHidden) || [];
                      return <GuessView key={`guessview_${type}`} type={type} guesses={filteredGuesses} previewGuessNumber={settingsStore.previewGuessNumber} />;
                    })
                  }
                </div>
              }
              {!playing && !loading &&
                <div style={{ margin: 'auto', color: 'grey' }}><i>Click NEXT to start playing</i></div>
              }
            </div>
          </div>
          <div className="col-md-4">
            <div id="player" className="mb-2 player" style={{ display: 'flex' }}>
              {!isFinished &&
                <>
                  <Button id="shuffleButton" type="submit" size="sm" onClick={toggleShuffle} style={{ width: '35px' }}>
                    <FontAwesomeIcon icon={['fas', 'shuffle']} color={shuffled ? 'var(--spot-color)' : '#242526'} size="lg" />
                  </Button>
                  &nbsp;
                  <Button className="col-sm" id="nextButton" disabled={loading || btStore.doneTracks >= btStore.tracks.length || (playing && !allGuessed())} type="submit" size="sm" onClick={handleNextSong}>
                    <FontAwesomeIcon icon={['fas', 'step-forward']} color="var(--spot-color)" size="lg" /> <b>NEXT</b>
                  </Button>
                  &nbsp;
                  <Button className="col-sm" id="revealButton" disabled={!playing || allGuessed()} type="submit" size="sm" onClick={handleReveal}>
                    <FontAwesomeIcon icon={['fas', 'eye']} color="var(--spot-color)" size="lg" /> <b>REVEAL</b>
                  </Button>
                </>
              }
              {isFinished &&
                <>
                  <Button className="col-sm" id="podiumButton" type="submit" size="sm" onClick={() => setPodiumDisplayed(true)}>
                    <FontAwesomeIcon icon={['fas', 'crown']} color="var(--spot-color)" size="lg" /> <b>SHOW FINAL PODIUM</b>
                  </Button>
                </>
              }
              &nbsp;
              <Dropdown>
                <Dropdown.Toggle size="sm" id="miscButton" className="no-caret-dropdown" variant="primary" style={{ width: '35px' }}>
                  <FontAwesomeIcon icon={['fas', 'ellipsis']} color="var(--spot-color)" size="lg" />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={cancelLastTrackPoints} disabled={!playing || !allGuessed()}>Cancel last track points</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

            </div>
            <Leaderboard />
          </div>
        </div>
      </div>
      {podiumDisplayed && <Podium onClose={() => setPodiumDisplayed(false)} />}
    </>
  );
};

export default BlindTest;
