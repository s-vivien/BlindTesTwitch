import { Button } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { computePkcePair, getAppHomeURL } from "../helpers"
import { useContext, useEffect } from "react";
import { BlindTestContext } from "App";

const Login = () => {

  const { setSubtitle } = useContext(BlindTestContext);

  useEffect(() => {
    setSubtitle('');
  }, [setSubtitle]);

  const authorize = async () => {
    const pkcePair = computePkcePair()
    window.location.href = "https://accounts.spotify.com/authorize" +
      "?client_id=" + process.env.REACT_APP_SPOTIFY_CLIENT_ID +
      "&redirect_uri=" + getAppHomeURL() + "/callback" +
      "&scope=playlist-read-private%20user-modify-playback-state%20user-read-playback-state" +
      "&response_type=code" +
      "&code_challenge_method=S256" +
      "&code_challenge=" + (await pkcePair).codeChallenge +
      "&show_dialog=true";
  }

  return (
    <Button id="loginButton" style={{ display: 'block', margin: '0 auto' }} type="submit" variant="outline-secondary" size="lg" onClick={authorize}>
      <FontAwesomeIcon icon={['far', 'check-circle']} size="sm" /> Login with Spotify
    </Button>
  )
}

export default Login
