import { getUsers } from 'services/TwitchAPI';
import { create } from 'zustand';

const localStorageKey: string = 'blind_test_players';

export type PlayerStats = {
  answers: number;
  firsts: number;
  combos: number;
  fastestAnswer: number;
}

export type Player = {
  tid: string;
  nick: string;
  score: number;
  rank: number;
  stats: PlayerStats;
  avatar?: string;
}

export class Players {
  players: Record<string, Player> = {};
}

type Actions = {
  backup: () => void;
  clear: () => void;
  setScores: (players: Record<string, number>) => void;
  addAnswerStats: (nick: string, isCombo: boolean, isFirst: boolean, timer: number) => void;
  initPlayer: (nick: string, tid: string) => void;
  addPoints: (nick: string, points: number) => void;
  addMultiplePoints: (points: Record<string, number>) => void;
}

const recomputeRanks = (players: Record<string, Player>) => {
  const flat = Object.values(players);
  flat.sort((a, b) => b.score - a.score);
  let lastRankGroup = 1;
  for (let i = 0; i < flat.length; i++) {
    if (i === 0 || flat[i].score !== flat[i - 1].score) {
      lastRankGroup = i + 1;
    }
    flat[i].rank = lastRankGroup;
  }
};

let avatarFetchTimeout: NodeJS.Timeout | undefined = undefined;
const avatarFetchTimeoutDuration: number = 2500;

// storage is triggered manually because the store might be large and we want to avoid writing it everytime it changes (i.e. very often)

// restore persisted state for initialization
const restoredState: Players = JSON.parse(localStorage.getItem(localStorageKey) || '{}');

export const usePlayerStore = create<Players & Actions>()(
  (set, get) => ({
    players: restoredState.players || {},
    backup: () => {
      const current = get();
      const backedUp = {
        players: current.players,
      };
      localStorage.setItem(localStorageKey, JSON.stringify(backedUp));
    },
    clear: () => {
      localStorage.removeItem(localStorageKey);
      set({ players: {} });
    },
    setScores: (players: Record<string, number>) => {
      set((state) => {
        const updated = state.players;
        for (const nick of Object.keys(updated)) {
          updated[nick].score = players[nick] || 0;
        }
        return ({ players: updated });
      });
    },
    addAnswerStats: (nick: string, isCombo: boolean, isFirst: boolean, timer: number) => {
      set((state) => {
        const updated = state.players;
        // if (!updated[nick]) {
        //   debugger; // TODO remove
        // }
        updated[nick].stats.answers++;
        updated[nick].stats.fastestAnswer = Math.min(updated[nick].stats.fastestAnswer, timer);
        if (isCombo) { updated[nick].stats.combos++; }
        if (isFirst) { updated[nick].stats.firsts++; }
        return ({ players: updated });
      });
    },
    initPlayer: (nick: string, tid: string) => {

      const downloadAvatar = (current: Record<string, Player>) => {
        const ids = Object.entries(current).filter(([_, value]) => !value.avatar).map(([_, value]) => value.tid).slice(0, 100);
        if (ids.length > 0) {
          getUsers(ids).then((response) => {
            set((state) => {
              const updated = state.players;
              for (let u of response.data.data) {
                const nick = u.display_name;
                // if (!updated[nick]) {
                //   debugger; // TODO remove
                // }
                updated[nick].avatar = u.profile_image_url;
              }
              return ({ players: updated });
            });
          });
        }
      };

      set((state) => {
        const updated = state.players;
        // if (updated[nick]) {
        //   debugger; // TODO remove
        // }
        updated[nick] = { tid: tid, rank: -1, score: 0, nick: nick, stats: { answers: 0, firsts: 0, combos: 0, fastestAnswer: 1e8 } };

        if (avatarFetchTimeout === undefined) {
          downloadAvatar(updated);
          avatarFetchTimeout = setTimeout(() => {
            avatarFetchTimeout = undefined;
            downloadAvatar(get().players);
          }, avatarFetchTimeoutDuration);
        }

        recomputeRanks(updated);
        return ({ players: updated });
      });
    },
    addPoints: (nick: string, points: number) => {
      set((state) => {
        const updated = state.players;
        // if (!updated[nick]) {
        //   debugger; // TODO remove
        // }
        updated[nick].score += points;
        recomputeRanks(updated);
        return ({ players: updated });
      });
    },
    addMultiplePoints: (points: Record<string, number>) => {
      set((state) => {
        const updated = state.players;
        for (const nick of Object.keys(points)) {
          // if (!updated[nick]) {
          //   debugger; // TODO remove
          // }
          updated[nick].score += points[nick];
        }
        recomputeRanks(updated);
        return ({ players: updated });
      });
    },
  }),
);
