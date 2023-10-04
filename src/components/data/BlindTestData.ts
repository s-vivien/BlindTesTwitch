import "reflect-metadata"
import { Type } from "class-transformer"
import { cleanValue, cleanSpoiler } from "../../helpers"

export enum GuessableState {
  Enabled = 0,
  Disabled = 1,
  DisabledHidden = 2
}

export enum GuessableType {
  Title = 0,
  Artist = 1,
  Misc = 2
}

export class Guessable {
  original: string // the original string
  toGuess: string // the cleaned string
  state: GuessableState
  type: GuessableType

  constructor(original: string, toGuess: string, type: GuessableType, state: GuessableState) {
    this.original = original;
    this.toGuess = toGuess;
    this.state = state;
    this.type = type;
  }
}

export class BlindTestTrack {
  @Type(() => Guessable)
  guessables: Guessable[]
  img: string
  track_uri: string

  constructor(guessables: Guessable[], track_uri: string, img: string) {
    this.guessables = guessables;
    this.track_uri = track_uri;
    this.img = img;
  }

  mapGuessables = <U>(type: GuessableType, callbackfn: (value: Guessable, index: number) => U): U[] => {
    let values: U[] = [];
    for (let i = 0; i < this.guessables.length; ++i) {
      const elt = this.guessables[i];
      if (type && elt.type === type) {
        values.push(callbackfn(elt, i));
      }
    }
    return values;
  }

  getGuessables = (type: GuessableType) => {
    return (this.guessables.filter(e => e.type == type && e.state != GuessableState.DisabledHidden) || []);
  }
}

export class BlindTestTracks {
  @Type(() => BlindTestTrack)
  tracks: BlindTestTrack[] = [];
  doneTracks: number = 0;

  constructor(spotTracks: any[]) {
    if (spotTracks) {
      for (let spotTrack of spotTracks) {
        let t = spotTrack.track;
        let artists = t.artists.map((a: any) => a.name);
        let title = cleanSpoiler(t.name, artists);
        this.tracks.push(new BlindTestTrack(
          [computeGuessable(title, GuessableType.Title), ...t.artists.map((a: { name: string }) => computeGuessable(a.name, GuessableType.Artist))],
          t.uri,
          t.album.images[1]?.url || ""
        ));
      }
    }
  }
}

export function computeGuessable(value: string, type: GuessableType, state: GuessableState = GuessableState.Enabled) {
  let cleaned = cleanValue(value);
  return new Guessable(value, cleaned, type, state);
}
