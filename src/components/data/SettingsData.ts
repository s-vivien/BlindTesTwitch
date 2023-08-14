export enum TwitchMode {
  Disabled = 0,
  Channel = 1,
  Whisper = 2
}

export class SettingsData {
  deviceId: string
  addEveryUser: boolean
  chatNotifications: boolean
  previewGuessNumber: boolean
  acceptanceDelay: number
  scoreCommandMode: TwitchMode

  constructor(deviceId: string, addEveryUser: boolean, chatNotifications: boolean, acceptanceDelay: number, previewGuessNumber: boolean, scoreCommandMode: TwitchMode) {
    this.deviceId = deviceId;
    this.addEveryUser = addEveryUser;
    this.chatNotifications = chatNotifications;
    this.acceptanceDelay = acceptanceDelay;
    this.previewGuessNumber = previewGuessNumber;
    this.scoreCommandMode = scoreCommandMode;
  }

  isInitialized(): boolean {
    return this.deviceId !== undefined;
  }
}
