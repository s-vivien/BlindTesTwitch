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
    uri: string
    img: string
    offset: number

    constructor(title: Guessable, artists: Guessable[], uri: string, offset: number, img: string) {
        this.title = title;
        this.artists = artists;
        this.uri = uri;
        this.offset = offset;
        this.img = img;
    }
}

export class BlindTestTracks {
    tracks: BlindTestTrack[] = []
    doneTracks: number = 0

    constructor(spotTracks: any[]) {
        if (spotTracks) {
            for (let spotTrack of spotTracks) {
                let t = spotTrack.track;
                let artists = t.artists.map((a: any) => a.name);
                let title = cleanSpoiler(t.name, artists);
                this.tracks.push(new BlindTestTrack(
                    computeGuessable(title),
                    t.artists.map((a: { name: string }) => computeGuessable(a.name)),
                    t.album.uri,
                    t.track_number - 1,
                    t.album.images[1].url
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
