import { instanceToPlain, plainToInstance } from 'class-transformer';
import { cleanSpoiler, cleanValue, specialCharactersAlternatives } from 'helpers';
import { create } from 'zustand';

const localStorageKey: string = 'blind_test_tracks_storage_v2';

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

export type Guessable = {
  original: string; // the original string
  toGuess: string[]; // the cleaned strings
  state: GuessableState;
  type: GuessableType;
}

export type BlindTestTrack = {
  done: boolean;
  guessables: Guessable[];
  img: string;
  track_uri: string;
}

export class BlindTestTracks {
  tracks: BlindTestTrack[] = [];
  doneTracks: number = 0;
  totalTracks: number = 0;
}

type Actions = {
  backup: () => void;
  clear: () => void;
  setTracksFromRaw: (spotTracks: any[]) => void;
  updateTrack: (track: BlindTestTrack, index: number) => void;
  getNextTrack: (random: boolean) => BlindTestTrack;
  incrementDoneTracks: () => void;
}

// storage is triggered manually because the store might be large and we want to avoid writing it everytime it changes (i.e. very often)

// restore persisted state for initialization
const plain: BlindTestTracks = JSON.parse(localStorage.getItem(localStorageKey) || '{}');
const restoredState = plainToInstance(BlindTestTracks, plain);

export const useBTTracksStore = create<BlindTestTracks & Actions>()(
  (set, get) => ({
    tracks: restoredState.tracks,
    doneTracks: restoredState.doneTracks,
    totalTracks: restoredState.totalTracks,
    backup: () => {
      const current = get();
      const backedUp = {
        tracks: current.tracks,
        doneTracks: current.doneTracks,
        totalTracks: current.totalTracks,
      };
      localStorage.setItem(localStorageKey, JSON.stringify(instanceToPlain(backedUp)));
    },
    clear: () => {
      localStorage.removeItem(localStorageKey);
      set({ tracks: [], doneTracks: 0, totalTracks: 0 });
    },
    setTracksFromRaw: (spotTracks: any[]) => {
      const tracks: BlindTestTrack[] = [];
      for (let spotTrack of spotTracks) {
        let t = spotTrack.track;
        let artists = t.artists.map((a: any) => a.name);
        let title = cleanSpoiler(t.name, artists);
        tracks.push({
          done: false,
          guessables: [computeGuessable(title, GuessableType.Title), ...t.artists.map((a: { name: string }) => computeGuessable(a.name, GuessableType.Artist))],
          track_uri: t.uri,
          img: t.album.images[0]?.url || '',
        });
      }
      set({ tracks: tracks, totalTracks: tracks.length, doneTracks: 0 });
    },
    updateTrack: (track: BlindTestTrack, index: number) => {
      set((state) => {
        const updatedTracks = state.tracks;
        updatedTracks[index] = track;
        return { tracks: updatedTracks };
      });
    },
    getNextTrack: (shuffled: boolean) => {
      const leftTracks = get().tracks.filter(t => !t.done);
      return shuffled ? leftTracks[Math.floor(Math.random() * leftTracks.length)] : leftTracks[0];
    },
    incrementDoneTracks: () => {
      set((state) => ({ doneTracks: state.doneTracks + 1 }));
    },
  }),
);

export const computeGuessable = (value: string, type: GuessableType, state: GuessableState = GuessableState.Enabled): Guessable => {
  let cleaned = [cleanValue(value)];
  specialCharactersAlternatives.forEach((replacements: string[], regexp: RegExp) => {
    if (value.toLowerCase().match(regexp)) {
      for (const replacement of replacements) {
        cleaned.push(cleanValue(value.toLowerCase().replaceAll(regexp, replacement)));
      }
    }
  });
  return {
    original: value,
    toGuess: cleaned,
    state: state,
    type: type,
  };
};