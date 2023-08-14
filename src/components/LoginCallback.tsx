import { setStoredSpotifyAccessToken, setStoredSpotifyRefreshToken, getQueryParam, setStoredUserCountry, getHashParam, setStoredTwitchOAuthToken } from "helpers"
import { useNavigate } from "react-router-dom";
import instance, { getUserProfile, retrieveAccessToken } from 'services/SpotifyAPI'
import { useContext, useEffect } from 'react'
import { BlindTestContext } from "App";

const LoginCallback = () => {

  const { setLoggedInSpotify, setLoggedInTwitch } = useContext(BlindTestContext);
  const navigate = useNavigate()

  useEffect(() => {
    const twitchToken = getHashParam('access_token')
    const spotifyCode = getQueryParam('code')

    if (twitchToken) { // Twitch logging callback
      setStoredTwitchOAuthToken(twitchToken);
      setLoggedInTwitch(true);
    } else if (spotifyCode) { // Spotify logging callback
      retrieveAccessToken(spotifyCode).then(response => {
        setStoredSpotifyRefreshToken(response.data.refresh_token);
        const accessToken = response.data.access_token;
        setStoredSpotifyAccessToken(accessToken);
        instance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        setLoggedInSpotify(true);
        getUserProfile().then(response => {
          setStoredUserCountry(response.data.country);
        });
      })
    }
    navigate("/");
  }, [navigate, setLoggedInSpotify, setLoggedInTwitch]);

  return (
    <div className="spinner"></div>
  )
}

export default LoginCallback
