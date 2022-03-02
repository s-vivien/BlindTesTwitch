import { cleanValue, cleanSpoiler, getMaxDist } from "../../helpers"

export class Guessable {
  original: string
  toGuess: string
  maxDistance: number

  constructor(original: string, toGuess: string, maxDistance: number) {
    this.original = original;
    this.toGuess = toGuess;
    this.maxDistance = maxDistance;
  }
}

export class BlindTestTrack {
  title: Guessable
  artists: Guessable[]
  img: string
  offset: number

  constructor(title: Guessable, artists: Guessable[], offset: number, img: string) {
    this.title = title;
    this.artists = artists;
    this.offset = offset;
    this.img = img;
  }
}

export class BlindTestTracks {
  tracks: BlindTestTrack[] = []
  playlistUri: string
  doneTracks: number = 0

  constructor(spotTracks: any[], playlistUri: string) {
    this.playlistUri = playlistUri;
    if (spotTracks) {
      let offset = 0;
      for (let spotTrack of spotTracks) {
        let t = spotTrack.track;
        let artists = t.artists.map((a: any) => a.name);
        let title = cleanSpoiler(t.name, artists);
        this.tracks.push(new BlindTestTrack(
          computeGuessable(title),
          t.artists.map((a: { name: string }) => computeGuessable(a.name)),
          offset++,
          t.album.images[1]?.url || ""
        ));
      }
    }
  }
}

const computeGuessable = (value: string) => {
  let cleaned = cleanValue(value);
  let maxDist = getMaxDist(cleaned);
  return new Guessable(value, cleaned, maxDist);
}
