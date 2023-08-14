import { Button } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { computePkcePair, getAppHomeURL } from "../helpers"
import { useContext, useEffect } from "react";
import { BlindTestContext } from "App";

const Login = () => {

  const { setSubtitle, loggedInSpotify, loggedInTwitch } = useContext(BlindTestContext);

  useEffect(() => {
    setSubtitle('');
  }, [setSubtitle]);


  const twitchLogin = async () => {
    window.location.href = "https://id.twitch.tv/oauth2/authorize" +
      "?client_id=" + process.env.REACT_APP_TWITCH_CLIENT_ID +
      "&redirect_uri=" + getAppHomeURL() + "/callback" +
      "&scope=chat:read+chat:edit+whispers:edit" +
      "&force_verify=true" +
      "&response_type=token";
  }

  const spotifyLogin = async () => {
    const pkcePair = computePkcePair()
    window.location.href = "https://accounts.spotify.com/authorize" +
      "?client_id=" + process.env.REACT_APP_SPOTIFY_CLIENT_ID +
      "&redirect_uri=" + getAppHomeURL() + "/callback" +
      "&scope=playlist-read-private%20user-modify-playback-state%20user-read-playback-state%20user-read-private" +
      "&response_type=code" +
      "&code_challenge_method=S256" +
      "&code_challenge=" + (await pkcePair).codeChallenge +
      "&show_dialog=true";
  }

  const LoginButton = (props: any) => {
    return (
      <Button id={props.appName + "LoginButton"} disabled={props.flag} style={{ display: 'block', margin: '5px auto', width: '15rem' }} variant={props.flag ? "outline-success" : "secondary"} size="lg" onClick={props.onClick}>
        {!props.flag && <>Login with {props.appName}</>}
        {props.flag && <><FontAwesomeIcon icon={['far', 'check-circle']} size="sm" /> Logged in {props.appName}</>}
      </Button>
    );
  };

  return (
    <>
      <LoginButton flag={loggedInSpotify} appName="Spotify" onClick={spotifyLogin}></LoginButton>
      <LoginButton flag={loggedInTwitch} appName="Twitch" onClick={twitchLogin}></LoginButton>
    </>
  )
}

export default Login
