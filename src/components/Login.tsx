import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect } from "react";
import { Button } from "react-bootstrap";
import { computePkcePair, getAppHomeURL } from "../helpers";
import { useAuthStore } from "./data/AuthStore";
import { useGlobalStore } from "./data/GlobalStore";

const Login = () => {

  const globalStore = useGlobalStore();
  const authStore = useAuthStore();

  useEffect(() => {
    globalStore.setSubtitle('');
  }, []);


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

  const spotifyIcon = <FontAwesomeIcon icon={['fab', 'spotify']} color="#1ED760" />
  const twitchIcon = <FontAwesomeIcon icon={['fab', 'twitch']} color="#6441A4" />

  const LoginButton = (props: any) => {
    return (
      <Button id={props.appName + "LoginButton"} disabled={props.flag} style={{ display: 'block', margin: '5px auto', width: '20rem' }} variant={props.flag ? "outline-success" : "secondary"} size="lg" onClick={props.onClick}>
        <>
          {!props.flag && <>Log in {props.appName}</>}
          {props.flag && <><FontAwesomeIcon icon={['far', 'check-circle']} /> Logged in {props.appName}</>}
          &nbsp;{props.icon}
        </>
      </Button>
    );
  };

  return (
    <>
      <LoginButton flag={authStore.spotifyRefreshToken !== undefined} appName="Spotify" onClick={spotifyLogin} icon={spotifyIcon}></LoginButton>
      <LoginButton flag={authStore.twitchOauthToken !== undefined} appName="Twitch" onClick={twitchLogin} icon={twitchIcon}></LoginButton>
    </>
  )
}

export default Login
