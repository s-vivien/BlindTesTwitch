import { create } from "zustand";

const localStorageKey: string = "blind_test_scores";

export class Scoring {
    scores: Record<string, number> = {};
}

type Actions = {
    backup: () => void;
    clear: () => void;
    setScores: (scores: Record<string, number>) => void;
    addPoints: (nick: string, points: number) => void;
    addMultiplePoints: (points: Record<string, number>) => void;
}

// storage is done manually because the store might be large and we want to avoid writing it everytime it changes (i.e. very often)

// restore persisted state for initialization
const restoredState: Scoring = JSON.parse(localStorage.getItem(localStorageKey) || "{}");

export const useScoringStore = create<Scoring & Actions>()(
    (set, get) => ({
        scores: restoredState.scores || {},
        backup: () => {
            const current = get();
            const backedUp = {
                scores: current.scores,
            };
            localStorage.setItem(localStorageKey, JSON.stringify(backedUp));
        },
        clear: () => {
            localStorage.removeItem(localStorageKey);
            set({ scores: {} });
        },
        setScores: (scores: Record<string, number>) => {
            set({ scores: scores })
        },
        addPoints: (nick: string, points: number) => {
            set((state) => {
                const updated = state.scores;
                updated[nick] = (updated[nick] || 0) + points;
                return ({ scores: updated });
            });
        },
        addMultiplePoints: (points: Record<string, number>) => {
            set((state) => {
                const updated = state.scores;
                for (const nick of Object.keys(points)) {
                    updated[nick] = (updated[nick] || 0) + points[nick];
                }
                return ({ scores: updated });
            });
        }
    })
);
