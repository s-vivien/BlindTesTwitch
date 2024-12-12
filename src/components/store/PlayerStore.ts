import { getUsers } from "services/TwitchAPI";
import { create } from "zustand";

const localStorageKey: string = "blind_test_players";

export type Player = {
  tid: string;
  score: number;
  avatar?: string;
}

export class Players {
  players: Record<string, Player> = {};
}

type Actions = {
  backup: () => void;
  clear: () => void;
  setScores: (players: Record<string, number>) => void;
  initPlayer: (nick: string, tid: string) => void;
  addPoints: (nick: string, points: number) => void;
  addMultiplePoints: (points: Record<string, number>) => void;
}

let avatarFetchTimeout: NodeJS.Timeout | undefined = undefined;
const avatarFetchTimeoutDuration: number = 2500;

// storage is triggered manually because the store might be large and we want to avoid writing it everytime it changes (i.e. very often)

// restore persisted state for initialization
const restoredState: Players = JSON.parse(localStorage.getItem(localStorageKey) || "{}");

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
            })
          });
        }
      }

      set((state) => {
        const updated = state.players;
        // if (updated[nick]) {
        //   debugger; // TODO remove
        // }
        updated[nick] = { tid: tid, score: 0 };

        if (avatarFetchTimeout == undefined) {
          downloadAvatar(updated);
          avatarFetchTimeout = setTimeout(() => {
            avatarFetchTimeout = undefined;
            downloadAvatar(get().players);
          }, avatarFetchTimeoutDuration);
        }

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
        return ({ players: updated });
      });
    }
  })
);
