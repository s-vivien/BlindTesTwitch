import { useAuthStore } from 'components/store/auth-store';
import { consumePkcePair, getAppHomeURL } from 'helpers';
import axios from 'axios';

const authStore = useAuthStore;

const instance = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dedicated instance for the Spotify token endpoint. It must NEVER carry an
// `Authorization: Bearer` header: on /api/token Spotify uses that header to
// authenticate the client, and a bearer token is not valid client auth, which
// results in `invalid_client`. Keeping it separate from `instance` avoids the
// persisted default Authorization header leaking into the token exchange.
const authInstance = axios.create({
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

let axiosErrorCallback: (msg: string) => void = () => { };

export const setAxiosErrorCallback = (callback: (msg: string) => void) => {
  axiosErrorCallback = callback;
};

instance.interceptors.response.use(
  (res) => {
    return res;
  },
  async (err) => {
    const config = err.config;

    if (err.response) {
      // Access Token was expired
      if (err.response.status === 401 && !config._retry) {
        delete instance.defaults.headers.common.Authorization;
        authStore.setState({ spotifyAccessToken: undefined });
        config._retry = true;
        try {
          const params = new URLSearchParams();
          params.append('grant_type', 'refresh_token');
          params.append('refresh_token', authStore.getState().spotifyRefreshToken || '');
          params.append('client_id', import.meta.env.VITE_SPOTIFY_CLIENT_ID || '');
          const rs = await authInstance.post('https://accounts.spotify.com/api/token', params);
          const accessToken = rs.data.access_token;
          authStore.setState({ spotifyRefreshToken: rs.data.refresh_token, spotifyAccessToken: accessToken });
          instance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          config.headers.Authorization = `Bearer ${accessToken}`;
          return instance(config);
        } catch (_error) {
          displayError(err);
          return Promise.reject(_error);
        }
      }
      displayError(err);
    }
    return Promise.reject(err);
  },
);

const displayError = (err: any) => {
  axiosErrorCallback(err.response.status + (err.response.data && (' ' + JSON.stringify(err.response.data))));
};

export const retrieveAccessToken = (access_code: string) => {
  const params = new URLSearchParams();
  const pkcePair = consumePkcePair();
  params.append('code', access_code);
  params.append('redirect_uri', getAppHomeURL() + '/callback');
  params.append('grant_type', 'authorization_code');
  params.append('code_verifier', pkcePair.codeVerifier);
  params.append('client_id', import.meta.env.VITE_SPOTIFY_CLIENT_ID || '');

  return authInstance.post('https://accounts.spotify.com/api/token', params);
};

const accessToken = authStore.getState().spotifyAccessToken;
if (accessToken) {
  instance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
}

export const getUserProfile = () => {
  return instance.get(`https://api.spotify.com/v1/me`);
};

export const getPlaylists = (offset: number, limit: number) => {
  return instance.get(`https://api.spotify.com/v1/me/playlists?offset=${offset}&limit=${limit}`);
};

export const getPlaylistTracks = (playlist_id: string, offset: number, limit: number) => {
  const market = authStore.getState().spotifyUserCountry;
  return instance.get(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks?offset=${offset}&limit=${limit}&market=${market}&fields=items(track(is_playable,name,artists(name),uri,album(images)))`);
};

export const launchTrack = (track_uri: string, device_id: string) => {
  return instance.put(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
    uris: [track_uri],
  });
};

export const getDevices = () => {
  return instance.get(`https://api.spotify.com/v1/me/player/devices`);
};

export default instance;