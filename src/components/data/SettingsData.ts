export class SettingsData {
  twitchChannel: string
  deviceId: string
  addEveryUser: boolean
  chatNotifications: boolean
  acceptanceDelay: number

  constructor(twitchChannel: string, deviceId: string, addEveryUser: boolean, chatNotifications: boolean, acceptanceDelay: number) {
    this.twitchChannel = twitchChannel
    this.deviceId = deviceId
    this.addEveryUser = addEveryUser
    this.chatNotifications = chatNotifications
    this.acceptanceDelay = acceptanceDelay
  }

  isInitialized(): boolean {
    return this.twitchChannel !== undefined && this.deviceId !== undefined;
  }
}
