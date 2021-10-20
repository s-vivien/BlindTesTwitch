import { getStoredBlindTest, computeDistance, cleanValueLight, getSettings, setStoredBlindTest } from "helpers"
import { useContext, useEffect, useState } from 'react'
import { launchTrack, stopPlayer, setRepeatMode } from "../services/SpotifyAPI"
import { Button } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Guessable } from "./data/BlindTestData"
import { Client } from "tmi.js"
import { BlindTestContext } from "App"

type DisplayableScoreType = {
  nick: string,
  rank?: number,
  score: number
}

type GuessType = {
  guessed: boolean,
  guessedBy?: string,
  points?: number
}

let twitchClient: Client | null = null;
let twitchCallback: (nick: string, msg: string) => void = () => { };

const twitchConnection = (chan: string) => {
  twitchClient = new Client({ channels: [chan] });
  twitchClient.connect();
  twitchClient.on('message', (_channel: any, _tags: any, _message: any) => twitchCallback(_tags['display-name'], _message));
}

const twitchDisconnection = () => {
  if (twitchClient !== null) {
    twitchClient.disconnect();
  }
}

const BlindTestView = () => {

  const { setSubtitle } = useContext(BlindTestContext);

  const [bt] = useState(() => getStoredBlindTest());
  const [settings] = useState(() => getSettings());
  const [doneTracks, setDoneTracks] = useState(bt.doneTracks);
  const [scores, setScores] = useState(bt.scores);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [guesses, setGuesses] = useState<GuessType[]>([]);
  const [guessables, setGuessables] = useState<Guessable[]>([]);
  const [coverUri, setCoverUri] = useState('');

  useEffect(() => {
    twitchConnection(settings.twitchChannel);
    return () => {
      twitchDisconnection();
    }
  }, [settings.twitchChannel]);

  useEffect(() => {
    if (playing) {
      setSubtitle(`Playing song #${doneTracks} out of ${bt.tracks.length}`)
    } else if (bt.tracks.length - doneTracks > 0) {
      setSubtitle(`${bt.tracks.length - doneTracks} tracks left`);
    } else {
      setSubtitle('Blind-test is finished !');
    }
  }, [setSubtitle, bt.tracks.length, playing, doneTracks]);

  const backupState = () => {
    bt.scores = scores;
    bt.doneTracks = doneTracks;
    setStoredBlindTest(bt);
  }

  const onProposition = (nick: string, message: string) => {
    addPlayerIfUnknown(nick);
    if (playing) {
      const proposition = cleanValueLight(message)
      for (let i = 0; i < guessables.length; i++) {
        const guess = guesses[i]
        if (guess.guessed) continue
        const guessable = guessables[i]
        const d = computeDistance(proposition, guessable.toGuess)
        if (d <= guessable.maxDistance || (proposition.includes(guessable.toGuess) && proposition.length <= 1.6 * guessable.toGuess.length)) {
          const points = 1 + (guesses.find((g) => g.guessed && g.guessedBy === nick) ? 1 : 0);
          addPointToPlayer(nick, points);
          updateGuessState(i, nick, points);
        }
      }
    }
  }
  twitchCallback = onProposition;

  const addPlayerIfUnknown = (nick: string) => {
    if (settings.addEveryUser && !scores.get(nick)) {
      addPointToPlayer(nick, 0)
    }
  }

  const addPointToPlayer = (nick: string, points: number) => {
    let newScores: Map<string, number> = new Map(scores)
    newScores.set(nick, (newScores.get(nick) || 0) + points)
    setScores(newScores);
  }

  const updateGuessState = (index: number, nick: string, points: number) => {
    let newGuesses = new Array<GuessType>()
    guesses.forEach((oldGuess: GuessType, i: number) => {
      if (i === index) {
        newGuesses.push({ guessed: true, guessedBy: nick, points: points })
      } else {
        newGuesses.push({ guessed: oldGuess.guessed, guessedBy: oldGuess.guessedBy, points: oldGuess.points })
      }
    })
    setGuesses(newGuesses);
  }

  const allGuessed = () => {
    return playing && guesses.reduce((prev, curr) => prev && curr.guessed, true)
  }

  const handleReveal = () => {
    backupState()
    let newGuesses = new Array<GuessType>()
    guesses.forEach((oldGuess: GuessType) => { newGuesses.push({ guessed: true, guessedBy: oldGuess.guessedBy, points: oldGuess.points }) })
    setGuesses(newGuesses);
  }

  const handleStop = () => {
    backupState();
    stopPlayer(settings.deviceId);
    setGuessables([]);
    setGuesses([]);
    setPlaying(false);
  }

  const handleNextSong = async () => {
    backupState()
    let track = bt.tracks[doneTracks]
    setPlaying(false);
    setLoading(true);
    launchTrack(track.uri, track.offset, settings.deviceId).then(() => {
      setRepeatMode(true, settings.deviceId);
      setDoneTracks(doneTracks + 1);
      setGuessables([track.title, ...track.artists]);
      setGuesses(new Array(track.artists.length + 1).fill({ guessed: false }));
      setCoverUri(track.img);
      setPlaying(true);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }

  const CrossEmoji = <FontAwesomeIcon color="#de281b" icon={['fas', 'times']} size="lg" />;
  const BubbleEmoji = <FontAwesomeIcon icon={['far', 'comment']} size="lg" />;
  const CheckEmoji = <FontAwesomeIcon color="#18ad1d" icon={['fas', 'check']} size="lg" />;

  const GuessableView = (props: any) => {
    const guessable: Guessable = props.guessable
    const guess: GuessType = props.guess
    if (guess.guessed) {
      return <div className="pb-3">
        <div className="bt-orig">{guess.guessedBy ? CheckEmoji : CrossEmoji} {guessable.original}</div>
        <div className="bt-tg">[<i>{guessable.toGuess}</i>]</div>
        {guess.guessedBy && <div className="bt-gb">{BubbleEmoji} {guess.guessedBy} <b>[+{guess.points}]</b></div>}
      </div>
    } else {
      return <div className="pb-3">
        {CrossEmoji}<div className="bt-orig" style={{ fontWeight: 'bold' }}>&nbsp;?</div>
      </div>
    }
  }

  const computeFlatScores = () => {
    let flat: DisplayableScoreType[] = []
    scores.forEach((_val: number, _key: string) => {
      flat.push({
        nick: _key,
        score: _val
      })
    })
    flat.sort((a, b) => b.score - a.score)
    let rank = 0
    for (let i = 0; i < flat.length; i++) {
      if (i === 0 || flat[i].score !== flat[i - 1].score) {
        rank++
        flat[i].rank = rank
      }
    }
    return flat;
  }

  return (
    <div id="blindtest">
      <div className="row align-items-md-stretch mb-4">
        <div className="col-md-6">
          <div id="title" className="p-3 mb-2 bg-light border rounded-3" >
            <div id="cover">
              {allGuessed() &&
                <img id="cover-image" src={coverUri} alt="album cover" />
              }
              {(playing || loading) && !allGuessed() &&
                <FontAwesomeIcon icon={['fas', 'question']} size="sm" />
              }
              {!playing && !loading &&
                <FontAwesomeIcon icon={['fas', 'volume-mute']} size="sm" />
              }
            </div>
          </div>
          <div id="title" className="p-3 mb-2 bg-light border rounded-3" >
            <div className="bt-h">
              <h2>TITLE</h2>
            </div>
            {playing &&
              <div>
                <GuessableView key="guess_0" guessable={guessables[0]} guess={guesses[0]} />
              </div>
            }
          </div>
          <div id="artists" className="p-3 mb-2 bg-light border rounded-3" >
            <div className="bt-h">
              <h2>ARTIST(S)</h2>
            </div>
            {playing &&
              <div>
                {guessables.slice(1).map((guessable: Guessable, index: number) => {
                  return <GuessableView key={"guess_" + (index + 1)} guessable={guessable} guess={guesses[index + 1]} />
                })}
              </div>
            }
          </div>
        </div>
        <div className="col-md-6">
          <div id="player" className="mb-2" style={{ display: 'flex' }}>
            <Button style={{ flexGrow: 4 }} id="nextButton" disabled={loading || doneTracks >= bt.tracks.length} type="submit" variant="outline-secondary" size="sm" onClick={handleNextSong} title="Next">
              <FontAwesomeIcon icon={['fas', 'step-forward']} color="#84BD00" size="sm" /> NEXT
            </Button>
            &nbsp;
            <Button style={{ flexGrow: 4 }} id="stopButton" disabled={!playing} type="submit" variant="outline-secondary" size="sm" onClick={handleStop} title="Stop">
              <FontAwesomeIcon icon={['fas', 'stop']} color="#84BD00" size="sm" /> STOP
            </Button>
            &nbsp;
            <Button style={{ flexGrow: 1 }} id="revealButton" disabled={!playing || allGuessed()} type="submit" variant="outline-secondary" size="sm" onClick={handleReveal} title="Reveal">
              <FontAwesomeIcon icon={['fas', 'eye']} color="#84BD00" size="sm" /> REVEAL
            </Button>
          </div>
          <div id="leaderboard" className="p-3 bg-light border rounded-3">
            <table className="table-hover bt-t">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>Rank</th>
                  <th style={{ width: "270px" }}>Nick</th>
                  <th style={{ width: "60px" }}>Score</th>
                  <th style={{ width: "100px" }}></th>
                </tr>
              </thead>
              <tbody>
                {computeFlatScores().map((sc, index) => {
                  return <tr key={"score_" + index}>
                    <td>{sc.rank}</td>
                    <td>{sc.nick}</td>
                    <td>{sc.score}</td>
                    <td className="text-right">
                      <Button type="submit" variant="primary" size="sm" onClick={() => addPointToPlayer(sc.nick, -1)} className="text-nowrap">
                        <FontAwesomeIcon icon={['fas', 'minus']} size="sm" />
                      </Button>
                      &nbsp;
                      <Button type="submit" variant="primary" size="sm" onClick={() => addPointToPlayer(sc.nick, 1)} className="text-nowrap">
                        <FontAwesomeIcon icon={['fas', 'plus']} size="sm" />
                      </Button>
                    </td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlindTestView