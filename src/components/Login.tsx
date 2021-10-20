import { Button } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { computePkcePair, getAppHomeURL } from "../helpers"
import { useContext, useEffect } from "react";
import { BlindTestContext } from "App";

const Login = () => {

  const { setSubtitle } = useContext(BlindTestContext);

  useEffect(() => {
    setSubtitle('Play Blind-Test on Twitch !');
  }, [setSubtitle]);

  const authorize = () => {
    const pkcePair = computePkcePair()
    window.location.href = "https://accounts.spotify.com/authorize" +
      "?client_id=" + process.env.REACT_APP_SPOTIFY_CLIENT_ID +
      "&redirect_uri=" + getAppHomeURL() + "/callback" +
      "&scope=playlist-read-private%20user-modify-playback-state%20user-read-playback-state" +
      "&response_type=code" +
      "&code_challenge_method=S256" +
      "&code_challenge=" + pkcePair.codeChallenge +
      "&show_dialog=true";
  }

  return (
    <Button id="loginButton" type="submit" variant="outline-secondary" size="lg" onClick={authorize}>
      <FontAwesomeIcon icon={['far', 'check-circle']} size="sm" /> Login with Spotify
    </Button>
  )
}

export default Login