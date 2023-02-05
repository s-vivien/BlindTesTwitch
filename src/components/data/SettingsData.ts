export enum TwitchMode {
  Disabled= 0,
  Channel=1,
  Whisper=2
}

export class SettingsData {
  twitchChannel: string
  deviceId: string
  addEveryUser: boolean
  chatNotifications: boolean
  previewGuessNumber: boolean
  acceptanceDelay: number
  scoreCommandMode: TwitchMode

  constructor(twitchChannel: string, deviceId: string, addEveryUser: boolean, chatNotifications: boolean, acceptanceDelay: number, previewGuessNumber: boolean, scoreCommandMode: TwitchMode) {
    this.twitchChannel = twitchChannel;
    this.deviceId = deviceId;
    this.addEveryUser = addEveryUser;
    this.chatNotifications = chatNotifications;
    this.acceptanceDelay = acceptanceDelay;
    this.previewGuessNumber = previewGuessNumber;
    this.scoreCommandMode = scoreCommandMode;
  }

  isInitialized(): boolean {
    return this.twitchChannel !== undefined && this.deviceId !== undefined;
  }
}
