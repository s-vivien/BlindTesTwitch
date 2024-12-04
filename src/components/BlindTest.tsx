import { getStoredBlindTestTracks, getStoredBlindTestScores, sorensenDiceScore, cleanValueLight, setStoredBlindTestTracks, setStoredBlindTestScores, getStoredTwitchOAuthToken } from "helpers"
import { useContext, useEffect, useRef, useState } from 'react'
import { launchTrack, setRepeatMode } from "../services/SpotifyAPI"
import { Button, Dropdown, FormControl } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { BlindTestTrack, BlindTestTracks, Guessable, GuessableState, GuessableType } from "./data/BlindTestData"
import { Client, Options } from "tmi.js"
import { BlindTestContext } from "App"
import { settingsStore, TwitchMode } from "./data/SettingsStore"
import { AnimatePresence, motion } from "framer-motion"

type DisplayableScore = {
  nick: string,
  rank?: number,
  displayedRank?: number,
  score: number
};

type Guesser = {
  nick: string,
  points: number
}

type Guess = {
  guessed: boolean,
  guessedBy: Guesser[]
};

let twitchCallback: (nick: string, msg: string) => void = () => { };

const DISPLAYED_USER_LIMIT = 150;
const DISPLAYED_GUESS_NICK_LIMIT = 5;
const DISPLAYED_GUESS_NICK_CHAT_LIMIT = 20;

const BlindTest = () => {

  const { setSubtitle, twitchNick } = useContext(BlindTestContext);

  const twitchClient = useRef<Client | null>(null);
  const delayedPoints = useRef<Map<string, number>[]>([]);
  const scoresBackup = useRef<Map<string, number>>(new Map());
  const bt = useRef<BlindTestTracks>(getStoredBlindTestTracks());
  const settings = settingsStore();
  const guessTimeouts = useRef<(NodeJS.Timeout | undefined)[]>([]);

  const [doneTracks, setDoneTracks] = useState(bt.current.doneTracks);
  const [scores, setScores] = useState(() => getStoredBlindTestScores());
  const [leaderboardRows, setLeaderboardRows] = useState<DisplayableScore[]>([]);
  const [nickFilter, setNickFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentTrack, setCurrentTrack] = useState<BlindTestTrack | null>(null);

  useEffect(() => {
    console.log(`Twitch channel changed to ${twitchNick}`);
    twitchConnection(twitchNick, settings.chatNotifications);
    return () => {
      twitchDisconnection();
    }
  }, [twitchNick]);

  useEffect(() => {
    if (playing) {
      setSubtitle(`Playing song #${doneTracks} out of ${bt.current.tracks.length}`)
    } else if (bt.current.tracks.length - doneTracks > 0) {
      setSubtitle(`${bt.current.tracks.length - doneTracks} tracks left`);
    } else {
      setSubtitle('Blind-test is finished !');
    }
  }, [setSubtitle, bt.current.tracks.length, playing, doneTracks]);

  useEffect(() => {
    if (currentTrack && !currentTrack.done && allGuessed()) {
      currentTrack.done = true;
      backupState();
    }
  }, [playing, guesses, currentTrack]);

  useEffect(() => {
    let flat: DisplayableScore[] = []
    scores.forEach((_val: number, _key: string) => {
      flat.push({
        nick: _key,
        score: _val
      })
    })
    flat.sort((a, b) => a.nick.localeCompare(b.nick))
    flat.sort((a, b) => b.score - a.score)
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
  }, [nickFilter, scores]);

  const twitchDisconnection = () => {
    console.log('Disconnecting from Twitch...');
    if (twitchClient.current !== null) {
      twitchClient.current.disconnect();
    }
  }

  const twitchConnection = (chan: string, chatNotifications: boolean) => {
    let opts: Options = {
      options: {
        skipUpdatingEmotesets: true
      },
      channels: [chan]
    };
    if (chatNotifications) {
      opts.identity = {
        username: 'foo',
        password: getStoredTwitchOAuthToken() || ""
      }
    }
    twitchClient.current = new Client(opts);
    twitchClient.current.connect();
    twitchClient.current.on('message', (_channel: any, _tags: any, _message: any, _self: any) => {
      if (_self) return;
      if (_tags['message-type'] !== "whisper") {
        return twitchCallback(_tags['display-name'], _message);
      }
    });
  }

  const backupState = () => {
    bt.current.doneTracks = doneTracks;
    setStoredBlindTestTracks(bt.current);
    setStoredBlindTestScores(scores);
  }

  const pickRandomPlayer = () => {
    const nicks = Array.from(scores)
      .filter(([k, v]) => v > 0)
      .map(([k]) => k);
    if (nicks.length > 0) {
      setNickFilter(nicks[Math.floor(Math.random() * nicks.length)].toLowerCase());
    }
  }

  const cancelLastTrackPoints = () => {
    setScores(scoresBackup.current);
  }

  const onProposition = (nick: string, message: string) => {
    // console.log(`${new Date()} : ${nick} said ${message}`);
    addPlayerIfUnknown(nick);
    if (message === "!score") {
      if (settings.scoreCommandMode !== TwitchMode.Disabled) {
        const rank = leaderboardRows.find(row => row.nick === nick);
        if (rank !== undefined) {
          if (settings.scoreCommandMode === TwitchMode.Whisper) {
            twitchClient.current?.whisper(nick, `You are #${rank.rank} [${rank.score} point${rank.score > 1 ? 's' : ''}]`);
          } else {
            twitchClient.current?.say(twitchNick, `@${nick} is #${rank.rank} [${rank.score} point${rank.score > 1 ? 's' : ''}]`);
          }
        }
      }
    } else if (playing && currentTrack !== null) {
      const proposition = cleanValueLight(message)
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
            updateGuessState(i, nick, points);
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
    }
  }
  twitchCallback = onProposition;

  const endGuess = (index: number, delayed: boolean) => {
    setGuesses(guesses => {
      let newGuesses = [...guesses];
      newGuesses[index].guessed = true;
      if (settings.chatNotifications) {
        let msg = `✅ [${currentTrack?.guessables[index].toGuess[0]}] correctly guessed by ${guesses[index].guessedBy.slice(0, DISPLAYED_GUESS_NICK_CHAT_LIMIT).map((gb) => `${gb.nick} [+${gb.points}]`).join(', ')}`;
        if (guesses[index].guessedBy.length > DISPLAYED_GUESS_NICK_CHAT_LIMIT) msg += `, and ${guesses[index].guessedBy.length - DISPLAYED_GUESS_NICK_CHAT_LIMIT} more`;
        twitchClient.current?.say(twitchNick, msg);
      }
      return newGuesses;
    });
    if (delayed) {
      setScores(scores => {
        const points = delayedPoints.current[index];
        let newScores: Map<string, number> = new Map(scores);
        points.forEach((value: number, nick: string) => {
          newScores.set(nick, (newScores.get(nick) || 0) + value);
        });
        setStoredBlindTestScores(newScores);
        return newScores;
      });
    }
  }

  const addPlayerIfUnknown = (nick: string) => {
    if (settings.addEveryUser && scores.get(nick) === undefined) {
      addPointToPlayer(nick, 0);
    }
  }

  const addPointToPlayer = (nick: string, points: number) => {
    setScores(scores => {
      let newScores: Map<string, number> = new Map(scores);
      newScores.set(nick, (newScores.get(nick) || 0) + points);
      if (points !== 0) setStoredBlindTestScores(newScores);
      return newScores;
    });
  }

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
        delayedPoints.current[index].set(nick, (delayedPoints.current[index].get(nick) || 0) + points);
      }
      return newGuesses;
    });
  }

  const allGuessed = () => {
    return playing && guesses.reduce((prev, curr) => prev && curr.guessed, true);
  }

  const triggerTimeouts = () => {
    for (let index = 0; index < guessTimeouts.current.length; index++) {
      if (guessTimeouts.current[index]) {
        clearTimeout(guessTimeouts.current[index]);
        endGuess(index, true);
        guessTimeouts.current[index] = undefined;
      }
    }
  }

  const handleReveal = () => {
    if (currentTrack) {
      triggerTimeouts();
      let newGuesses = [...guesses];
      guesses.forEach((g: Guess) => { g.guessed = true; });
      currentTrack.done = true;
      backupState();
      setGuesses(newGuesses);
    }
  }

  const handleNextSong = async () => {
    handleReveal();
    scoresBackup.current = scores;
    backupState();
    triggerTimeouts();
    const leftTracks = bt.current.tracks.filter(t => !t.done);
    let track = shuffled ? leftTracks[Math.floor(Math.random() * leftTracks.length)] : leftTracks[0];
    setPlaying(false);
    setLoading(true);
    launchTrack(track.track_uri, settings.deviceId).then(() => {
      setRepeatMode(true, settings.deviceId);
      setDoneTracks(doneTracks + 1);
      setCurrentTrack(track);
      const newGuesses = [];
      delayedPoints.current = [];
      guessTimeouts.current = [];
      for (let guessable of track.guessables) {
        newGuesses.push({ guessed: guessable.state !== GuessableState.Enabled, guessedBy: [] });
        delayedPoints.current.push(new Map<string, number>());
        guessTimeouts.current.push(undefined);
      }
      setGuesses(newGuesses);
      setPlaying(true);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }

  const toggleShuffle = () => {
    setShuffled(!shuffled);
  }

  const CrossEmoji = <FontAwesomeIcon color="#de281b" icon={['fas', 'times']} size="lg" />;
  const BubbleEmoji = <FontAwesomeIcon icon={['far', 'comment']} size="lg" />;
  const CheckEmoji = <FontAwesomeIcon color="#18ad1d" icon={['fas', 'check']} size="lg" />;
  const InfoEmoji = <FontAwesomeIcon color="#367ac2" icon={['fas', 'lock']} size="lg" />;

  const GuessableView = (props: any) => {
    const guessable: Guessable = props.guessable
    const guess: Guess = props.guess
    if (guess.guessed) {
      return <div className="mb-3">
        <div className="bt-guess" title={guessable.toGuess[0]}>{guess.guessedBy.length > 0 ? CheckEmoji : (guessable.state != GuessableState.Enabled ? InfoEmoji : CrossEmoji)} {guessable.original}</div>
        {guess.guessedBy.length > 0 &&
          <div className="bt-gb">
            {BubbleEmoji}&nbsp;
            {guess.guessedBy.slice(0, DISPLAYED_GUESS_NICK_LIMIT).map((gb, i) => {
              return <span key={"gb_" + i}>
                {i > 0 && <>, </>}
                {gb.nick} <b>[+{gb.points}]</b>
              </span>
            })}
            {guess.guessedBy.length > DISPLAYED_GUESS_NICK_LIMIT && <span>, and {guess.guessedBy.length - DISPLAYED_GUESS_NICK_LIMIT} more</span>}
          </div>
        }
      </div>
    } else if (guess.guessedBy.length > 0 && settings.previewGuessNumber) {
      return <div className="mb-3">
        {CheckEmoji}<div className="bt-guess">&nbsp;Guessed by <b>{guess.guessedBy.length}</b> player{guess.guessedBy.length > 1 ? 's' : ''}</div>
      </div>
    } else {
      return <div className="mb-3">
        {CrossEmoji}<div className="bt-guess" style={{ fontWeight: 'bold' }}>&nbsp;?</div>
      </div>
    }
  }

  return (
    <div id="blindtest">
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="p-3 mb-2 bt-left-panel border rounded-3" >
            <div id="cover" className="cover ">
              {allGuessed() &&
                <img id="cover-image" src={currentTrack?.img} alt="cover" />
              }
              {(playing || loading) && !allGuessed() &&
                <img src='/BlindTesTwitch/audio-wave.svg' />
              }
              {!playing && !loading &&
                <FontAwesomeIcon icon={['fas', 'volume-mute']} size="sm" />
              }
            </div>
            {playing && currentTrack !== null &&
              <div style={{ flex: 1 }}>
                {currentTrack.getGuessables(GuessableType.Title).length > 0 &&
                  <div className="px-3 pb-3" >
                    <div className="bt-h">
                      <h2>TITLE</h2>
                    </div>
                    <div>
                      <GuessableView key="guess_0" guessable={currentTrack.guessables[0]} guess={guesses[0]} />
                    </div>
                  </div>
                }
                {currentTrack.getGuessables(GuessableType.Artist).length > 0 &&
                  <div className="px-3 pb-3" >
                    <div className="bt-h">
                      <h2>ARTIST(S)</h2>
                    </div>
                    <div>
                      {currentTrack.mapGuessables(GuessableType.Artist, (guessable: Guessable, index: number) => {
                        return <GuessableView key={"guess_" + index} guessable={guessable} guess={guesses[index]} />
                      })}
                    </div>
                  </div>
                }
                {currentTrack.getGuessables(GuessableType.Misc).length > 0 &&
                  <div className="px-3 mb-2" >
                    <div className="bt-h">
                      <h2>MISC</h2>
                    </div>
                    <div>
                      {currentTrack.mapGuessables(GuessableType.Misc, (guessable: Guessable, index: number) => {
                        return <GuessableView key={"guess_" + index} guessable={guessable} guess={guesses[index]} />
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
            <Button id="shuffleButton" type="submit" size="sm" onClick={toggleShuffle} style={{ width: "35px" }}>
              <FontAwesomeIcon icon={['fas', 'shuffle']} color={shuffled ? '#1ed760' : '#242526'} size="lg" />
            </Button>
            &nbsp;
            <Button className="col-sm" id="nextButton" disabled={loading || doneTracks >= bt.current.tracks.length} type="submit" size="sm" onClick={handleNextSong}>
              <FontAwesomeIcon icon={['fas', 'step-forward']} color="#1ed760" size="lg" /> <b>NEXT</b>
            </Button>
            &nbsp;
            <Button className="col-sm" id="revealButton" disabled={!playing || allGuessed()} type="submit" size="sm" onClick={handleReveal}>
              <FontAwesomeIcon icon={['fas', 'eye']} color="#1ed760" size="lg" /> <b>REVEAL</b>
            </Button>
            &nbsp;
            <Dropdown>
              <Dropdown.Toggle size="sm" id="miscButton" className="no-caret-dropdown" variant="primary" style={{ width: "35px" }}>
                <FontAwesomeIcon icon={['fas', 'ellipsis']} color="#1ed760" size="lg" />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={cancelLastTrackPoints} disabled={!playing || !allGuessed()}>Cancel last track points</Dropdown.Item>
                <Dropdown.Item onClick={pickRandomPlayer}>Pick random player</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

          </div>
          <div id="leaderboard" className="p-3 bt-panel border rounded-3">
            <FormControl value={nickFilter} className={"mb-2"} type="text" role="searchbox" placeholder="Nick filter" size="sm" onChange={(e) => setNickFilter(e.target.value.toLowerCase())} />
            <table className="table-hover bt-t">
              <thead>
                <tr>
                  <th style={{ width: "12%" }}>#</th>
                  <th style={{ width: "70%" }}>Nick</th>
                  <th style={{ width: "18%" }}>Score</th>
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
                      <td>
                        <span>{sc.displayedRank}</span>
                      </td>
                      <td style={{ position: "relative" }}>
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
                      <td>
                        <span>{sc.score}</span>
                      </td>
                    </motion.tr>
                  ))}
                  {leaderboardRows.length > DISPLAYED_USER_LIMIT &&
                    <tr style={{ textAlign: "center" }}>
                      <td colSpan={4}><span><i>...{leaderboardRows.length - DISPLAYED_USER_LIMIT} more players</i></span></td>
                    </tr>
                  }
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div >
  );
}

export default BlindTest
