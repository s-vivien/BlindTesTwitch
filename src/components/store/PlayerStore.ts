import { getUsers } from 'services/TwitchAPI';
import { create } from 'zustand';

const localStorageKey: string = 'blind_test_players_v2';

export type PlayerStats = {
  answers: number;
  firsts: number;
  combos: number;
  fastestAnswer: number;
}

export class Answer {
  nick: string;
  isFirst: boolean;
  isCombo: boolean;
  timer: number;

  constructor(nick: string, isFirst: boolean, isCombo: boolean, timer: number) {
    this.nick = nick;
    this.isFirst = isFirst;
    this.isCombo = isCombo;
    this.timer = timer;
  }

  getPoints = () => {
    return 1 + (this.isFirst ? 1 : 0) + (this.isCombo ? 1 : 0);
  };
}

export const EMPTY_PLAYER_STATS: PlayerStats = {
  answers: 0,
  firsts: 0,
  combos: 0,
  fastestAnswer: Infinity,
};

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
  restorePlayers: (players: Record<string, Player>) => void;
  initPlayer: (nick: string, tid: string) => void;
  addPoints: (nick: string, points: number) => void;
  recordAnswers: (answers: Answer[]) => void;
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
    restorePlayers: (players: Record<string, Player>) => {
      set((state) => {
        const updated = state.players;
        for (const nick of Object.keys(updated)) {
          if (players[nick]) {
            updated[nick].score = players[nick].score;
            updated[nick].stats = players[nick].stats;
          } else {
            updated[nick].score = 0;
            updated[nick].stats = { ...EMPTY_PLAYER_STATS };
          }
        }
        return ({ players: updated });
      });
    },
    initPlayer: (nick: string, tid: string) => {

      const downloadAvatar = (current: Record<string, Player>) => {
        const ids = Object.entries(current).filter(([_, value]) => value.tid && !value.avatar).map(([_, value]) => value.tid).slice(0, 100);
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
        updated[nick] = { tid: tid, rank: -1, score: 0, nick: nick, stats: { ...EMPTY_PLAYER_STATS } };

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
    recordAnswers: (answers: Answer[]) => {
      set((state) => {
        const updated = state.players;

        // var nicks: Record<string, string> = {}; // TODO remove
        // for (const answer of answers) {
        //   if (nicks[answer.nick]) {
        //     debugger;
        //   }
        //   nicks[answer.nick] = '';
        // }

        for (const answer of answers) {
          // if (!updated[answer.nick]) {
          //   debugger; // TODO remove
          // }
          const score = answer.getPoints();
          updated[answer.nick].stats.answers++;
          updated[answer.nick].stats.fastestAnswer = Math.min(updated[answer.nick].stats.fastestAnswer, answer.timer);
          if (answer.isCombo) { updated[answer.nick].stats.combos++; }
          if (answer.isFirst) { updated[answer.nick].stats.firsts++; }
          updated[answer.nick].score += score;
        }
        recomputeRanks(updated);
        return ({ players: updated });
      });
    },
  }),
);
