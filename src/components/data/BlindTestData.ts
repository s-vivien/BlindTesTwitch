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
  offset: number

  constructor(guessables: Guessable[], offset: number, img: string) {
    this.guessables = guessables;
    this.offset = offset;
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
  playlistUri: string;
  doneTracks: number = 0;

  constructor(spotTracks: any[], playlistUri: string) {
    this.playlistUri = playlistUri;
    if (spotTracks) {
      let offset = 0;
      for (let spotTrack of spotTracks) {
        let t = spotTrack.track;
        let artists = t.artists.map((a: any) => a.name);
        let title = cleanSpoiler(t.name, artists);
        this.tracks.push(new BlindTestTrack(
          [computeGuessable(title, GuessableType.Title), ...t.artists.map((a: { name: string }) => computeGuessable(a.name, GuessableType.Artist))],
          offset++,
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
