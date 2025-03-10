import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cleanValueLight, sorensenDiceScore } from 'helpers';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Dropdown } from 'react-bootstrap';
import { Client, Options } from 'tmi.js';
import { launchTrack, setRepeatMode } from '../services/SpotifyAPI';
import { useAuthStore } from './store/AuthStore';
import { BlindTestTrack, getGuessables, Guessable, GuessableState, GuessableType, mapGuessables, useBTTracksStore } from './store/BlindTestTracksStore';
import { useGlobalStore } from './store/GlobalStore';
import { usePlayerStore } from './store/PlayerStore';
import { TwitchMode, useSettingsStore } from './store/SettingsStore';
import Podium from './Podium';
import Leaderboard from './Leaderboard';

type Guesser = {
  nick: string,
  points: number
}

type Guess = {
  guessed: boolean,
  guessedBy: Guesser[]
};

let twitchCallback: (nick: string, tid: string, msg: string) => void = () => {};

const DISPLAYED_GUESS_NICK_LIMIT = 5;
const DISPLAYED_GUESS_NICK_CHAT_LIMIT = 20;

const BlindTest = () => {

  const twitchClient = useRef<Client | null>(null);
  const trackStart = useRef<number>(-1);
  const delayedPoints = useRef<Record<string, number>[]>([]);
  const scoresBackup = useRef<Record<string, number>>({});
  const settings = useSettingsStore();
  const guessTimeouts = useRef<(NodeJS.Timeout | undefined)[]>([]);

  const btStore = useBTTracksStore();
  const playerStore = usePlayerStore();
  const twitchNick = useAuthStore((state) => state.twitchNick);
  const twitchToken = useAuthStore((state) => state.twitchOauthToken);
  const globalStore = useGlobalStore();

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
      twitchConnection(twitchNick, settings.chatNotifications);
      return () => {
        twitchDisconnection();
      };
    }
  }, [twitchNick]);

  useEffect(() => {
    if (playing && !currentTrack?.done) {
      globalStore.setSubtitle(`Playing song #${btStore.doneTracks + 1} out of ${btStore.tracks.length}`);
    } else if (btStore.tracks.length - btStore.doneTracks > 0) {
      globalStore.setSubtitle(`${btStore.tracks.length - btStore.doneTracks} tracks left`);
    } else {
      globalStore.setSubtitle('Blind-test is finished !');
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
    playerStore.backup();
  };

  const cancelLastTrackPoints = () => {
    playerStore.setScores(scoresBackup.current);
    playerStore.backup();
  };

  const onProposition = (nick: string, tid: string, message: string) => {
    // console.log(`${new Date()} : ${nick} said ${message}`);
    if (settings.addEveryUser && !playerStore.players[nick]) {
      playerStore.initPlayer(nick, tid);
    }
    if (message === '!score') {
      if (settings.scoreCommandMode !== TwitchMode.Disabled) {
        const player = playerStore.players[nick];
        if (player !== undefined) {
          if (settings.scoreCommandMode === TwitchMode.Whisper) {
            twitchClient.current?.whisper(nick, `You are #${player.rank} [${player.score} point${player.score > 1 ? 's' : ''}]`);
          } else if (twitchNick) {
            twitchClient.current?.say(twitchNick, `@${nick} is #${player.rank} [${player.score} point${player.score > 1 ? 's' : ''}]`);
          }
        }
      }
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
            if (settings.acceptanceDelay > 0 && guess.guessedBy.length === 0) {
              isFirst = true;
            } // first guess for this item
            for (let g of guesses) {
              if (g.guessedBy.find((gb) => gb.nick === nick)) {
                isCombo = true; // this player already guessed something else on this track
                break;
              }
            }
            if (!playerStore.players[nick]) {
              playerStore.initPlayer(nick, tid);
            }
            playerStore.addAnswerStats(nick, isCombo, isFirst, performance.now() - trackStart.current);
            const points = 1 + (isCombo ? 1 : 0) + (isFirst ? 1 : 0);
            updateGuessState(i, nick, points);
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
      if (settings.chatNotifications && twitchNick) {
        let msg = `✅ [${currentTrack?.guessables[index].toGuess[0]}] correctly guessed by ${guesses[index].guessedBy.slice(0, DISPLAYED_GUESS_NICK_CHAT_LIMIT).map((gb) => `${gb.nick} [+${gb.points}]`).join(', ')}`;
        if (guesses[index].guessedBy.length > DISPLAYED_GUESS_NICK_CHAT_LIMIT) msg += `, and ${guesses[index].guessedBy.length - DISPLAYED_GUESS_NICK_CHAT_LIMIT} more`;
        twitchClient.current?.say(twitchNick, msg);
      }
      return newGuesses;
    });
    if (delayed) {
      playerStore.addMultiplePoints(delayedPoints.current[index]);
    }
  };

  const addPointToPlayer = useCallback((nick: string, points: number) => {
    playerStore.addPoints(nick, points);
  }, []);

  const updateGuessState = (index: number, nick: string, points: number) => {
    setGuesses(guesses => {
      const firstGuess = guesses[index].guessedBy.length === 0;
      let newGuesses = [...guesses];
      newGuesses[index].guessedBy.push({ nick: nick, points: points });
      if (settings.acceptanceDelay === 0) {
        endGuess(index, false);
        addPointToPlayer(nick, points);
      } else {
        if (firstGuess) {
          const to = setTimeout(() => {
            endGuess(index, true);
            guessTimeouts.current[index] = undefined;
          }, settings.acceptanceDelay * 1000);
          guessTimeouts.current[index] = to;
        }
        delayedPoints.current[index][nick] = (delayedPoints.current[index][nick] || 0) + points;
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
    scoresBackup.current = Object.fromEntries(Object.entries(playerStore.players).map(([key, value]) => [key, value.score]));
    triggerTimeouts();
    const track = btStore.getNextTrack(shuffled);
    setPlaying(false);
    setLoading(true);
    launchTrack(track.track_uri, settings.deviceId).then(() => {
      setRepeatMode(true, settings.deviceId);
      setCurrentTrack(track);
      const newGuesses = [];
      delayedPoints.current = [];
      guessTimeouts.current = [];
      for (let guessable of track.guessables) {
        newGuesses.push({ guessed: guessable.state !== GuessableState.Enabled, guessedBy: [] });
        delayedPoints.current.push({});
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

  const CrossEmoji = <FontAwesomeIcon color="#de281b" icon={['fas', 'times']} size="lg" />;
  const BubbleEmoji = <FontAwesomeIcon icon={['far', 'comment']} size="lg" />;
  const CheckEmoji = <FontAwesomeIcon color="var(--icon-green-color)" icon={['fas', 'check']} size="lg" />;
  const LockEmoji = <FontAwesomeIcon color="var(--icon-blue-color)" icon={['fas', 'lock']} size="lg" />;

  const GuessableView = (props: any) => {
    const guessable: Guessable = props.guessable;
    const guess: Guess = props.guess;
    if (guess.guessed) {
      return <div className="mb-3">
        <div className="bt-guess" title={guessable.toGuess[0]}>{guess.guessedBy.length > 0 ? CheckEmoji : (guessable.state != GuessableState.Enabled ? LockEmoji : CrossEmoji)} {guessable.original}</div>
        {guess.guessedBy.length > 0 &&
          <div className="bt-gb">
            {BubbleEmoji}&nbsp;
            {guess.guessedBy.slice(0, DISPLAYED_GUESS_NICK_LIMIT).map((gb, i) => {
              return <span key={'gb_' + i}>
                {i > 0 && <>, </>}
                {gb.nick} <b>[+{gb.points}]</b>
              </span>;
            })}
            {guess.guessedBy.length > DISPLAYED_GUESS_NICK_LIMIT && <span>, and {guess.guessedBy.length - DISPLAYED_GUESS_NICK_LIMIT} more</span>}
          </div>
        }
      </div>;
    } else if (guess.guessedBy.length > 0 && settings.previewGuessNumber) {
      return <div className="mb-3">
        {CheckEmoji}
        <div className="bt-guess">&nbsp;Guessed by <b>{guess.guessedBy.length}</b> player{guess.guessedBy.length > 1 ? 's' : ''}</div>
      </div>;
    } else {
      return <div className="mb-3">
        {CrossEmoji}
        <div className="bt-guess" style={{ fontWeight: 'bold' }}>&nbsp;?</div>
      </div>;
    }
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
                  {getGuessables(currentTrack, GuessableType.Title).length > 0 &&
                    <div className="px-3 pb-3">
                      <div className="bt-h">
                        <h2>TITLE</h2>
                      </div>
                      <div>
                        <GuessableView key="guess_0" guessable={currentTrack.guessables[0]} guess={guesses[0]} />
                      </div>
                    </div>
                  }
                  {getGuessables(currentTrack, GuessableType.Artist).length > 0 &&
                    <div className="px-3 pb-3">
                      <div className="bt-h">
                        <h2>ARTIST(S)</h2>
                      </div>
                      <div>
                        {mapGuessables(currentTrack, GuessableType.Artist, (guessable: Guessable, index: number) => {
                          return <GuessableView key={'guess_' + index} guessable={guessable} guess={guesses[index]} />;
                        })}
                      </div>
                    </div>
                  }
                  {getGuessables(currentTrack, GuessableType.Misc).length > 0 &&
                    <div className="px-3 mb-2">
                      <div className="bt-h">
                        <h2>MISC</h2>
                      </div>
                      <div>
                        {mapGuessables(currentTrack, GuessableType.Misc, (guessable: Guessable, index: number) => {
                          return <GuessableView key={'guess_' + index} guessable={guessable} guess={guesses[index]} />;
                        })}
                      </div>
                    </div>
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
              <Button id="shuffleButton" type="submit" size="sm" onClick={toggleShuffle} style={{ width: '35px' }}>
                <FontAwesomeIcon icon={['fas', 'shuffle']} color={shuffled ? 'var(--spot-color)' : '#242526'} size="lg" />
              </Button>
              &nbsp;
              {!isFinished &&
                <>
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
                    <FontAwesomeIcon icon={['fas', 'crown']} color="var(--spot-color)" size="lg" /> <b>SHOW PODIUM</b>
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
                  <Dropdown.Item onClick={() => setPodiumDisplayed(true)}>Podium</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

            </div>
            <Leaderboard addPointFunction={addPointToPlayer}></Leaderboard>
          </div>
        </div>
      </div>
      {podiumDisplayed && <Podium onClose={() => setPodiumDisplayed(false)} />}
    </>
  );
};

export default BlindTest;
