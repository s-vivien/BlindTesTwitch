import instance from "./axios";

export const getPlaylists = (offset: number, limit: number) => {
    return instance.get(`https://api.spotify.com/v1/me/playlists?offset=${offset}&limit=${limit}`)
}

export const getPlaylistTracks = (playlist_id: string, offset: number, limit: number) => {
    return instance.get(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks?offset=${offset}&limit=${limit}&fields=items(track(track_number,name,artists(name),album(uri,images)))`)
}

export const setRepeatMode = (enabled: boolean, device_id: string) => {
    return instance.put(`https://api.spotify.com/v1/me/player/repeat?device_id=${device_id}&state=${enabled ? 'track' : 'off'}`)
}

export const launchTrack = (album_uri: string, offset: number, device_id: string) => {
    return instance.put(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
        context_uri: album_uri,
        offset: {
            position: offset
        }
    })
}

export const getDevices = () => {
    return instance.get(`https://api.spotify.com/v1/me/player/devices`)
}

export const stopPlayer = (device_id: string) => {
    return instance.put(`https://api.spotify.com/v1/me/player/pause?device_id=${device_id}`)
}