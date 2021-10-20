export class SettingsData {
    twitchChannel: string
    deviceId: string
    addEveryUser: boolean

    constructor(twitchChannel: string, deviceId: string, addEveryUser: boolean) {
        this.twitchChannel = twitchChannel
        this.deviceId = deviceId
        this.addEveryUser = addEveryUser
    }

    isInitialized(): boolean {
        return this.twitchChannel !== undefined && this.deviceId !== undefined;
    }
}
