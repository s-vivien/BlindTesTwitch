import { getHashParam, getQueryParam } from "helpers";
import { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import instance, { getUserProfile, retrieveAccessToken } from 'services/SpotifyAPI';
import { useAuthStore } from "./data/AuthStore";

const LoginCallback = () => {

  const authStore = useAuthStore();
  const navigate = useNavigate()

  useEffect(() => {
    const twitchToken = getHashParam('access_token')
    const spotifyCode = getQueryParam('code')

    if (twitchToken) { // Twitch logging callback
      authStore.setTwitchOAuthToken(twitchToken);
    } else if (spotifyCode) { // Spotify logging callback
      retrieveAccessToken(spotifyCode).then(response => {
        authStore.setSpotifyRefreshToken(response.data.refresh_token);
        const accessToken = response.data.access_token;
        authStore.setSpotifyAccessToken(accessToken);
        instance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        getUserProfile().then(response => {
          authStore.setSpotifyUserCountry(response.data.country);
        });
      })
    }
    navigate("/");
  }, [navigate]);

  return (
    <div className="spinner"></div>
  )
}

export default LoginCallback
