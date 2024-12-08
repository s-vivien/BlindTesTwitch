import { create } from "zustand";

export type Global = {
  subtitle: string,
}

type Actions = {
  setSubtitle: (subtitle: string) => void;
}

export const useGlobalStore = create<Global & Actions>()(
  (set) => ({
    subtitle: '',
    setSubtitle: (subtitle: string) => {
      set(() => ({ subtitle: subtitle }));
    }
  })
);
