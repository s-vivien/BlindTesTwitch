import { getUsers, setDefaultAuth, validateToken } from 'services/TwitchAPI';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthData = {
  spotifyRefreshToken?: string,
  spotifyAccessToken?: string,
  twitchOauthToken?: string,
  spotifyUserCountry?: string,
  twitchNick?: string,
  twitchAvatar?: string
}

type Actions = {
  clear: () => void;
  deleteTwitchOAuthToken: () => void;
  setTwitchOAuthToken: (token: string) => void;
  validateTwitchOAuthToken: () => void;
  getSpotifyAccessToken: () => string | undefined;
  deleteSpotifyAccessToken: () => void;
  setSpotifyAccessToken: (token: string) => void;
  getSpotifyRefreshToken: () => string | undefined;
  deleteSpotifyRefreshToken: () => void;
  setSpotifyRefreshToken: (token: string) => void;
  setTwitchNickAndAvatar: (nick: string, avatar: string) => void;
  getSpotifyUserCountry: () => string | undefined;
  setSpotifyUserCountry: (country: string) => void;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthData & Actions>()(
  persist(
    (set, get) => ({
      clear: () => {
        set({
          spotifyRefreshToken: undefined,
          spotifyAccessToken: undefined,
          twitchOauthToken: undefined,
          spotifyUserCountry: undefined,
        });
      },
      deleteTwitchOAuthToken: () => {
        set(() => ({ twitchOauthToken: undefined }));
      },
      setTwitchOAuthToken: (token: string) => {
        set(() => ({ twitchOauthToken: token }));
      },
      validateTwitchOAuthToken: () => {
        const current = get();
        if (current.twitchOauthToken) {
          validateToken(current.twitchOauthToken).then(response => {
            if (response.status !== 200) {
              current.deleteTwitchOAuthToken();
            } else {
              setDefaultAuth(current.twitchOauthToken || '');
              response.json().then(body => {
                getUsers([body['user_id']]).then(response => {
                  set(() => ({ twitchNick: body['login'], twitchAvatar: response.data.data[0].profile_image_url }));
                });
              });
            }
          });
        }
      },
      getSpotifyAccessToken: (): string | undefined => {
        return get().spotifyAccessToken;
      },
      deleteSpotifyAccessToken: () => {
        set(() => ({ spotifyAccessToken: undefined }));
      },
      setSpotifyAccessToken: (token: string) => {
        set(() => ({ spotifyAccessToken: token }));
      },
      getSpotifyRefreshToken: (): string | undefined => {
        return get().spotifyRefreshToken;
      },
      deleteSpotifyRefreshToken: () => {
        set(() => ({ spotifyRefreshToken: undefined }));
      },
      setSpotifyRefreshToken: (token: string) => {
        set(() => ({ spotifyRefreshToken: token }));
      },
      setTwitchNickAndAvatar: (nick: string, avatar: string) => {
        set(() => ({ twitchNick: nick, twitchAvatar: avatar }));
      },
      getSpotifyUserCountry: (): string | undefined => {
        return get().spotifyUserCountry;
      },
      setSpotifyUserCountry: (country: string) => {
        set(() => ({ spotifyUserCountry: country }));
      },
      isLoggedIn: (): boolean => {
        const current = get();
        return current.twitchOauthToken !== undefined && current.spotifyRefreshToken !== undefined;
      },
    }),
    {
      name: 'auth_data',
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !['twitchNick'].includes(key)),
        ),
    },
  ),
);