import { create } from "zustand";
import { persist } from 'zustand/middleware'

export enum TwitchMode {
  Disabled = 0,
  Channel = 1,
  Whisper = 2
}

type SettingsData = {
  deviceId: string;
  addEveryUser: boolean;
  chatNotifications: boolean;
  previewGuessNumber: boolean;
  acceptanceDelay: number;
  scoreCommandMode: TwitchMode;
}

type Actions = {
  isInitialized: () => boolean;
  reset: () => void;
  update: (data: SettingsData) => void;
}

const initialState: SettingsData = {
  deviceId: '',
  addEveryUser: true,
  chatNotifications: true,
  previewGuessNumber: false,
  acceptanceDelay: 5,
  scoreCommandMode: TwitchMode.Channel,
}

export const settingsStore = create<SettingsData & Actions>()(
  persist(
    (set, get) => ({
      ...initialState,
      isInitialized: () => { return get().deviceId !== '' },
      reset: () => set(initialState),
      update: (data: SettingsData) => set(data)
    }),
    {
      name: 'settings'
    }
  )
);
