import { getStoredBlindTestTracks, getStoredBlindTestScores, sorensenDiceScore, cleanValueLight, getStoredSettings, setStoredBlindTestTracks, setStoredBlindTestScores, getStoredTwitchOAuthToken } from "helpers"
import { useContext, useEffect, useState } from 'react'
import { launchTrack, pausePlayer, resumePlayer, setRepeatMode } from "../services/SpotifyAPI"
import { Button, FormControl } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { BlindTestTrack, Guessable, GuessableState, GuessableType } from "./data/BlindTestData"
import { Client, Options } from "tmi.js"
import { BlindTestContext } from "App"
import { TwitchMode } from "./data/SettingsData"

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

let twitchClient: Client | null = null;
let twitchCallback: (nick: string, msg: string) => void = () => { };
let endGuess: (index: number, delayed: boolean) => void = () => { };
let delayedPoints: Map<string, number>[] = [];
let guessTimeouts: NodeJS.Timeout[] = [];

const DISPLAYED_USER_LIMIT = 150;
const DISPLAYED_GUESS_NICK_LIMIT = 5;
const DISPLAYED_GUESS_NICK_CHAT_LIMIT = 20;

const BlindTest = () => {

  const { setSubtitle, twitchNick } = useContext(BlindTestContext);

  const [bt] = useState(() => getStoredBlindTestTracks());
  const [settings] = useState(() => getStoredSettings());
  const [doneTracks, setDoneTracks] = useState(bt.doneTracks);
  const [scores, setScores] = useState(() => getStoredBlindTestScores());
  const [leaderboardRows, setLeaderboardRows] = useState<DisplayableScore[]>([]);
  const [nickFilter, setNickFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
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
      setSubtitle(`Playing song #${doneTracks} out of ${bt.tracks.length}`)
    } else if (bt.tracks.length - doneTracks > 0) {
      setSubtitle(`${bt.tracks.length - doneTracks} tracks left`);
    } else {
      setSubtitle('Blind-test is finished !');
    }
  }, [setSubtitle, bt.tracks.length, playing, doneTracks]);

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
    for (let i = 0; i < flat.length; i++) {
      const rank = 1 + i;
      if (i === 0 || flat[i].score !== flat[i - 1].score) {
        flat[i].displayedRank = rank;
      }
      flat[i].rank = rank;
    }
    setLeaderboardRows(flat);
  }, [nickFilter, scores]);

  const twitchDisconnection = () => {
    console.log('Disconnecting from Twitch...');
    if (twitchClient !== null) {
      twitchClient.disconnect();
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
    twitchClient = new Client(opts);
    twitchClient.connect();
    twitchClient.on('message', (_channel: any, _tags: any, _message: any, _self: any) => {
      if (_self) return;
      if (_tags['message-type'] !== "whisper") {
        return twitchCallback(_tags['display-name'], _message);
      }
    });
  }

  const backupState = () => {
    bt.doneTracks = doneTracks;
    setStoredBlindTestTracks(bt);
    setStoredBlindTestScores(scores);
  }

  const onProposition = (nick: string, message: string) => {
    // console.log(`${new Date()} : ${nick} said ${message}`);
    addPlayerIfUnknown(nick);
    if (message === "!score") {
      if (settings.scoreCommandMode !== TwitchMode.Disabled) {
        const rank = leaderboardRows.find(row => row.nick === nick);
        if (rank !== undefined) {
          if (settings.scoreCommandMode === TwitchMode.Whisper) {
            twitchClient?.whisper(nick, `You are #${rank.rank} [${rank.score} point${rank.score > 1 ? 's' : ''}]`);
          } else {
            twitchClient?.say(twitchNick, `@${nick} is #${rank.rank} [${rank.score} point${rank.score > 1 ? 's' : ''}]`);
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
        const d = sorensenDiceScore(guessable.toGuess, proposition);
        // console.log(`${guessable.toGuess} ${proposition} ${d}`);
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
          break;
        }
      }
    }
  }
  twitchCallback = onProposition;

  endGuess = (index: number, delayed: boolean) => {
    let newGuesses = [...guesses];
    newGuesses[index].guessed = true;
    if (settings.chatNotifications) {
      let msg = `✅ [${currentTrack?.guessables[index].toGuess}] correctly guessed by ${guesses[index].guessedBy.slice(0, DISPLAYED_GUESS_NICK_CHAT_LIMIT).map((gb) => `${gb.nick} [+${gb.points}]`).join(', ')}`;
      if (guesses[index].guessedBy.length > DISPLAYED_GUESS_NICK_CHAT_LIMIT) msg += `, and ${guesses[index].guessedBy.length - DISPLAYED_GUESS_NICK_CHAT_LIMIT} more`;
      twitchClient?.say(twitchNick, msg);
    }
    setGuesses(newGuesses);
    if (delayed) {
      const points = delayedPoints[index];
      let newScores: Map<string, number> = new Map(scores);
      points.forEach((value: number, nick: string) => {
        newScores.set(nick, (newScores.get(nick) || 0) + value);
      });
      setStoredBlindTestScores(newScores);
      setScores(newScores);
    }
  }

  const addPlayerIfUnknown = (nick: string) => {
    if (settings.addEveryUser && scores.get(nick) === undefined) {
      addPointToPlayer(nick, 0);
    }
  }

  const addPointToPlayer = (nick: string, points: number) => {
    let newScores: Map<string, number> = new Map(scores);
    newScores.set(nick, (newScores.get(nick) || 0) + points);
    if (points !== 0) setStoredBlindTestScores(newScores);
    setScores(newScores);
  }

  const updateGuessState = (index: number, nick: string, points: number) => {
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
        }, settings.acceptanceDelay * 1000);
        guessTimeouts.push(to);
      }
      delayedPoints[index].set(nick, (delayedPoints[index].get(nick) || 0) + points);
    }
    setGuesses(newGuesses);
  }

  const allGuessed = () => {
    return playing && guesses.reduce((prev, curr) => prev && curr.guessed, true);
  }

  const handleReveal = () => {
    backupState();
    for (let to of guessTimeouts) { clearTimeout(to); }
    let newGuesses = [...guesses];
    guesses.forEach((g: Guess) => { g.guessed = true; });
    setGuesses(newGuesses);
  }

  const handlePause = () => {
    pausePlayer(settings.deviceId);
    setPaused(true);
  }

  const handleResume = () => {
    resumePlayer(settings.deviceId);
    setPaused(false);
  }

  const handleNextSong = async () => {
    backupState();
    for (let to of guessTimeouts) { clearTimeout(to); }
    guessTimeouts = [];
    let track = bt.tracks[doneTracks]
    setPlaying(false);
    setLoading(true);
    launchTrack(track.track_uri, settings.deviceId).then(() => {
      setRepeatMode(true, settings.deviceId);
      setDoneTracks(doneTracks + 1);
      setCurrentTrack(track);
      const newGuesses = [];
      delayedPoints = [];
      for (let guessable of track.guessables) {
        newGuesses.push({ guessed: guessable.state !== GuessableState.Enabled, guessedBy: [] });
        delayedPoints.push(new Map<string, number>());
      }
      setGuesses(newGuesses);
      setPlaying(true);
      setPaused(false);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
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
        <div className="bt-guess" title={guessable.toGuess}>{guess.guessedBy.length > 0 ? CheckEmoji : (guessable.state != GuessableState.Enabled ? InfoEmoji : CrossEmoji)} {guessable.original}</div>
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
                <FontAwesomeIcon icon={['fas', 'question']} size="sm" />
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
            <Button className="col-sm" id="nextButton" disabled={loading || doneTracks >= bt.tracks.length} type="submit" size="sm" onClick={handleNextSong}>
              <FontAwesomeIcon icon={['fas', 'step-forward']} color="#84BD00" size="sm" /> <b>NEXT</b>
            </Button>
            &nbsp;
            {
              paused &&
              <Button className="col-sm" id="resumeButton" disabled={!playing} type="submit" size="sm" onClick={handleResume}>
                <FontAwesomeIcon icon={['fas', 'play']} color="#84BD00" size="sm" /> <b>RESUME</b>
              </Button>
            }
            {
              !paused &&
              <Button className="col-sm" id="pauseButton" disabled={!playing} type="submit" size="sm" onClick={handlePause}>
                <FontAwesomeIcon icon={['fas', 'pause']} color="#84BD00" size="sm" /> <b>PAUSE</b>
              </Button>
            }
            &nbsp;
            <Button className="col-sm" id="revealButton" disabled={!playing || allGuessed()} type="submit" size="sm" onClick={handleReveal}>
              <FontAwesomeIcon icon={['fas', 'eye']} color="#84BD00" size="sm" /> <b>REVEAL</b>
            </Button>
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
                {leaderboardRows.slice(0, DISPLAYED_USER_LIMIT).map((sc) => {
                  return <tr key={sc.nick} className="leaderboard-row">
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
                  </tr>
                })}
                {leaderboardRows.length > DISPLAYED_USER_LIMIT &&
                  <tr style={{ textAlign: "center" }}>
                    <td colSpan={4}><span><i>...{leaderboardRows.length - DISPLAYED_USER_LIMIT} more players</i></span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlindTest
