import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuthStore } from 'components/store/AuthStore';
import { useBTTracksStore } from 'components/store/BlindTestTracksStore';
import { useGlobalStore } from 'components/store/GlobalStore';
import { usePlayerStore } from 'components/store/PlayerStore';
import { useSettingsStore } from 'components/store/SettingsStore';
import Help from 'components/Help';
import Playlist from 'components/Playlist';
import { useEffect, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { setDefaultAuth, validateToken } from 'services/TwitchAPI';
import BlindTest from './components/BlindTest';
import Login from './components/Login';
import LoginCallback from './components/LoginCallback';
import Settings from './components/Settings';
import './icons';
import { setAxiosErrorCallback } from './services/SpotifyAPI';

function App() {
  const navigate = useNavigate();

  const settingsStore = useSettingsStore();
  const authStore = useAuthStore();
  const globalStore = useGlobalStore();
  const btTotalTracks = useBTTracksStore((state) => state.totalTracks);
  const btClear = useBTTracksStore((state) => state.clear);
  const clearPlayers = usePlayerStore((state) => state.clear);

  const [view, setView] = useState(<div />);
  const [errorMessage, setErrorMessage] = useState('');

  const location = useLocation();

  useEffect(() => {
    setAxiosErrorCallback((msg: string) => { setErrorMessage(msg); });

    // check if twitch token is still valid
    if (authStore.twitchOauthToken) {
      validateToken(authStore.twitchOauthToken).then(response => {
        if (response.status !== 200) {
          authStore.deleteTwitchOAuthToken();
        } else {
          setDefaultAuth(authStore.twitchOauthToken || '');
          response.json().then(body => authStore.setTwitchNick(body['login']));
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!authStore.isLoggedIn()) {
      setView(<Login />);
      navigate('/');
    } else if (!settingsStore.isInitialized()) {
      navigate('/settings');
    } else if (location.pathname === "/") {
      if (btTotalTracks == 0) {
        navigate('/playlist');
      } else {
        setView(<BlindTest />);
        navigate('/');
      }
    }
  }, [navigate, authStore, settingsStore]);

  const onPopupClose = () => {
    setErrorMessage('');
    navigate('/');
  };

  const logout = () => {
    btClear();
    clearPlayers();
    authStore.clear();
    settingsStore.reset();
    navigate("/");
  }

  console.log('render App');

  const loggedIn = authStore.isLoggedIn();
  return (
    <>
      <header className="app-header">
        <div style={{ position: 'absolute', left: 0, fontSize: '1.3333rem', padding: '4px' }}>
          <FontAwesomeIcon icon={['fab', 'spotify']} color="#1ED760" size="sm" />
          <a href={process.env.PUBLIC_URL}> <b>B</b>lind<b>T</b>es<b>T</b>witch</a>
        </div>
        <div style={{ position: 'absolute', right: 0 }}>
          {loggedIn && btTotalTracks > 0 && <Button id="playButton" type="submit" variant="link" size="sm" onClick={() => navigate("/")} title="Play">
            <FontAwesomeIcon icon={['fas', 'music']} size="lg" />
          </Button>}
          {loggedIn && <Button id="listButton" type="submit" variant="link" size="sm" onClick={() => navigate("/playlist")} title="Playlists">
            <FontAwesomeIcon icon={['fas', 'list']} size="lg" />
          </Button>}
          <Button id="toggleButton" type="submit" variant="link" size="sm" onClick={() => settingsStore.toggleTheme()} title="Switch theme">
            <FontAwesomeIcon icon={['fas', 'adjust']} size="lg" />
          </Button>
          {loggedIn && <Button id="settingButton" type="submit" variant="link" size="sm" onClick={() => navigate("/settings")} title="Settings">
            <FontAwesomeIcon icon={['fas', 'cog']} size="lg" />
          </Button>}
          {loggedIn && btTotalTracks > 0 && <Help />}
          {loggedIn && <Button id="logoutButton" type="submit" variant="link" size="sm" onClick={logout} title="Logout">
            <FontAwesomeIcon icon={['fas', 'sign-out-alt']} size="lg" />
          </Button>}
        </div>
        <p id="subtitle" className="lead text-secondary">
          {globalStore.subtitle}
        </p>
      </header>
      <div className={"app container"} >
        {errorMessage &&
          <div className="alert-modal-bg">
            <Alert className="alert-modal" variant="danger" >
              <Alert.Heading>Error</Alert.Heading>
              <p>
                Spotify server returned : {errorMessage}
              </p>
              <div className="d-flex justify-content-center">
                <Button onClick={onPopupClose} variant="outline-danger">
                  Close
                </Button>
              </div>
            </Alert>
          </div>
        }
        <Routes>
          <Route path="/" element={view} />
          <Route path="/playlist" element={<Playlist />} />
          <Route path="/callback" element={<LoginCallback />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
