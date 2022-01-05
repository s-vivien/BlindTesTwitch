export class SettingsData {
    twitchChannel: string
    deviceId: string
    addEveryUser: boolean
    chatNotifications: boolean

    constructor(twitchChannel: string, deviceId: string, addEveryUser: boolean, chatNotifications: boolean) {
        this.twitchChannel = twitchChannel
        this.deviceId = deviceId
        this.addEveryUser = addEveryUser
        this.chatNotifications = chatNotifications
    }

    isInitialized(): boolean {
        return this.twitchChannel !== undefined && this.deviceId !== undefined;
    }
}
