import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'framer-motion';
import { cleanValueLight, sorensenDiceScore } from 'helpers';
import React, { useEffect, useRef, useState } from 'react';
import { Button, Dropdown, FormControl } from 'react-bootstrap';
import { Client, Options } from 'tmi.js';
import { launchTrack, setRepeatMode } from '../services/SpotifyAPI';
import { useAuthStore } from './store/AuthStore';
import { BlindTestTrack, getGuessables, Guessable, GuessableState, GuessableType, mapGuessables, useBTTracksStore } from './store/BlindTestTracksStore';
import { useGlobalStore } from './store/GlobalStore';
import { usePlayerStore } from './store/PlayerStore';
import { TwitchMode, useSettingsStore } from './store/SettingsStore';
import TwitchAvatar from './TwitchAvatar';

type DisplayableScore = {
  nick: string,
  rank?: number,
  displayedRank?: number,
  score: number,
  tid: string,
  avatar?: string
};

type Guesser = {
  nick: string,
  points: number
}

type Guess = {
  guessed: boolean,
  guessedBy: Guesser[]
};

let twitchCallback: (nick: string, tid: string, msg: string) => void = () => {};

const DISPLAYED_USER_LIMIT = 150;
const DISPLAYED_GUESS_NICK_LIMIT = 5;
const DISPLAYED_GUESS_NICK_CHAT_LIMIT = 20;

const BlindTest = () => {

  const twitchClient = useRef<Client | null>(null);
  const delayedPoints = useRef<Record<string, number>[]>([]);
  const scoresBackup = useRef<Record<string, number>>({});
  const settings = useSettingsStore();
  const guessTimeouts = useRef<(NodeJS.Timeout | undefined)[]>([]);

  const btStore = useBTTracksStore();
  const playerStore = usePlayerStore();
  const twitchNick = useAuthStore((state) => state.twitchNick);
  const twitchToken = useAuthStore((state) => state.twitchOauthToken);
  const globalStore = useGlobalStore();

  const [leaderboardRows, setLeaderboardRows] = useState<DisplayableScore[]>([]);
  const [nickFilter, setNickFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentTrack, setCurrentTrack] = useState<BlindTestTrack | null>(null);

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
    }
  }, [btStore.tracks.length, playing, btStore.doneTracks]);

  useEffect(() => {
    let flat: DisplayableScore[] = [];
    for (const _key of Object.keys(playerStore.players)) {
      const _val = playerStore.players[_key];
      flat.push({
        nick: _key,
        score: _val.score,
        tid: _val.tid,
        avatar: _val.avatar,
      });
    }
    flat.sort((a, b) => a.nick.localeCompare(b.nick));
    flat.sort((a, b) => b.score - a.score);
    if (nickFilter) {
      flat = flat.filter(s => s.nick.toLowerCase().includes(nickFilter));
    }
    // Display rank only for the first of each group
    let lastRankGroup = 1;
    for (let i = 0; i < flat.length; i++) {
      if (i === 0 || flat[i].score !== flat[i - 1].score) {
        lastRankGroup = i + 1;
        flat[i].displayedRank = lastRankGroup;
      }
      flat[i].rank = lastRankGroup;
    }
    setLeaderboardRows(flat);
  }, [nickFilter, playerStore]);

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
        const rank = leaderboardRows.find(row => row.nick === nick);
        if (rank !== undefined) {
          if (settings.scoreCommandMode === TwitchMode.Whisper) {
            twitchClient.current?.whisper(nick, `You are #${rank.rank} [${rank.score} point${rank.score > 1 ? 's' : ''}]`);
          } else if (twitchNick) {
            twitchClient.current?.say(twitchNick, `@${nick} is #${rank.rank} [${rank.score} point${rank.score > 1 ? 's' : ''}]`);
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
        var matched = false;
        for (const toGuess of guessable.toGuess) {
          const d = sorensenDiceScore(toGuess, proposition);
          // console.log(`[${toGuess}] [${proposition}] ${d}`);
          if (d >= 0.8) {
            let points = 1;
            if (settings.acceptanceDelay > 0 && guess.guessedBy.length === 0) points += 1; // first guess for this item
            for (let g of guesses) {
              if (g.guessedBy.find((gb) => gb.nick === nick)) {
                points += 1; // this player already guessed something else on this track
                break;
              }
            }
            if (!playerStore.players[nick]) {
              playerStore.initPlayer(nick, tid);
            }
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

  const addPointToPlayer = (nick: string, points: number) => {
    playerStore.addPoints(nick, points);
  };

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
            <Button className="col-sm" id="nextButton" disabled={loading || btStore.doneTracks >= btStore.tracks.length || (playing && !allGuessed())} type="submit" size="sm" onClick={handleNextSong}>
              <FontAwesomeIcon icon={['fas', 'step-forward']} color="var(--spot-color)" size="lg" /> <b>NEXT</b>
            </Button>
            &nbsp;
            <Button className="col-sm" id="revealButton" disabled={!playing || allGuessed()} type="submit" size="sm" onClick={handleReveal}>
              <FontAwesomeIcon icon={['fas', 'eye']} color="var(--spot-color)" size="lg" /> <b>REVEAL</b>
            </Button>
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
          <div id="leaderboard" className="p-3 bt-panel border rounded-3">
            <FormControl value={nickFilter} className={'mb-2'} type="text" role="searchbox" placeholder="Nick filter" size="sm" onChange={(e) => setNickFilter(e.target.value.toLowerCase())} />
            <table className="table-hover bt-t">
              <thead>
              <tr>
                <th style={{ width: '10%', textAlign: 'center' }}>#</th>
                <th style={{ width: '12%' }}></th>
                <th style={{ width: '61%' }}>Nick</th>
                <th style={{ width: '17%', textAlign: 'center' }}>Score</th>
              </tr>
              </thead>
              <tbody>
              <AnimatePresence>
                {leaderboardRows.slice(0, DISPLAYED_USER_LIMIT).map((sc) => (
                  <motion.tr
                    key={sc.nick}
                    className="leaderboard-row"
                    initial={{ opacity: 0, top: -20 }}
                    animate={{ opacity: 1, top: 0 }}
                    exit={{ opacity: 0, top: 20 }}
                    transition={{ duration: 0.3 }}
                    layout="position"
                  >
                    <td style={{ textAlign: 'center' }}>
                      <span>{sc.displayedRank}</span>
                    </td>
                    <td>
                      <TwitchAvatar tid={sc.tid} avatar={sc.avatar} className="leaderboard-avatar" />
                    </td>
                    <td style={{ position: 'relative' }}>
                      <span className="leaderboard-nick">{sc.nick}</span>
                      <div className="leaderboard-buttons">
                        <Button type="submit" size="sm" onClick={() => addPointToPlayer(sc.nick, -1)}>
                          <FontAwesomeIcon icon={['fas', 'minus']} size="lg" />
                        </Button>
                        <Button type="submit" size="sm" onClick={() => addPointToPlayer(sc.nick, 1)}>
                          <FontAwesomeIcon icon={['fas', 'plus']} size="lg" />
                        </Button>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span>{sc.score}</span>
                    </td>
                  </motion.tr>
                ))}
                {leaderboardRows.length > DISPLAYED_USER_LIMIT &&
                  <tr style={{ textAlign: 'center' }}>
                    <td colSpan={4}><span><i>...{leaderboardRows.length - DISPLAYED_USER_LIMIT} more players</i></span></td>
                  </tr>
                }
              </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlindTest;
