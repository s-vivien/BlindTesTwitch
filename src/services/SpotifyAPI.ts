import axios from 'axios';
import { getRefreshToken, setRefreshToken, removeAccessToken, getAccessToken, setAccessToken, consumePkcePair, getAppHomeURL } from 'helpers';

const instance = axios.create({
  headers: {
    "Content-Type": "application/json",
  }
});

let axiosErrorCallback: (msg: string) => void = () => { };

export const setAxiosErrorCallback = (callback: (msg: string) => void) => {
  axiosErrorCallback = callback;
}

instance.interceptors.response.use(
  (res) => {
    return res
  },
  async (err) => {
    const config = err.config

    if (err.response) {
      // Access Token was expired
      if (err.response.status === 401 && !config._retry) {
        delete instance.defaults.headers.common.Authorization
        removeAccessToken()
        config._retry = true
        try {
          const params = new URLSearchParams()
          params.append('grant_type', 'refresh_token')
          params.append('refresh_token', getRefreshToken() || "")
          params.append('client_id', process.env.REACT_APP_SPOTIFY_CLIENT_ID || "")
          const rs = await instance.post('https://accounts.spotify.com/api/token',
            params, {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            }
          })
          setRefreshToken(rs.data.refresh_token)
          const accessToken = rs.data.access_token
          setAccessToken(accessToken)
          instance.defaults.headers.common.Authorization = `Bearer ${accessToken}`
          config.headers.Authorization = `Bearer ${accessToken}`
          return instance(config)
        } catch (_error) {
          displayError(err);
          return Promise.reject(_error)
        }
      }
      displayError(err);
    }
    return Promise.reject(err);
  }
)

const displayError = (err: any) => {
  axiosErrorCallback(err.response.status + (err.response.data && (' ' + JSON.stringify(err.response.data))));
}

export const retrieveAccessToken = (access_code: string) => {
  const params = new URLSearchParams()
  const pkcePair = consumePkcePair()
  params.append('code', access_code)
  params.append('redirect_uri', getAppHomeURL() + "/callback")
  params.append('grant_type', 'authorization_code')
  params.append('code_verifier', pkcePair.codeVerifier)
  params.append('client_id', process.env.REACT_APP_SPOTIFY_CLIENT_ID || "")

  return instance.post('https://accounts.spotify.com/api/token',
    params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  })
}

const accessToken = getAccessToken()
if (accessToken) {
  instance.defaults.headers.common.Authorization = `Bearer ${accessToken}`
}

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

export const pausePlayer = (device_id: string) => {
  return instance.put(`https://api.spotify.com/v1/me/player/pause?device_id=${device_id}`)
}

export const resumePlayer = (device_id: string) => {
  return instance.put(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`)
}

export default instance;