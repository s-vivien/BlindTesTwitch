export class SettingsData {
  twitchChannel: string
  deviceId: string
  addEveryUser: boolean
  chatNotifications: boolean
  previewGuessNumber: boolean
  acceptanceDelay: number

  constructor(twitchChannel: string, deviceId: string, addEveryUser: boolean, chatNotifications: boolean, acceptanceDelay: number, previewGuessNumber: boolean) {
    this.twitchChannel = twitchChannel;
    this.deviceId = deviceId;
    this.addEveryUser = addEveryUser;
    this.chatNotifications = chatNotifications;
    this.acceptanceDelay = acceptanceDelay;
    this.previewGuessNumber = previewGuessNumber;
  }

  isInitialized(): boolean {
    return this.twitchChannel !== undefined && this.deviceId !== undefined;
  }
}
