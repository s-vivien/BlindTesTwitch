import './icons';
import { useEffect, useState, createContext } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Alert, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { setAxiosErrorCallback } from './services/SpotifyAPI';
import { deleteStoredBlindTestTracks, deleteStoredBlindTestScores, deleteStoredTwitchOAuthToken, deleteStoreSpotifyAccessToken, deleteStoredSpotifyRefreshToken, getStoredSpotifyRefreshToken, getStoredTheme, hasStoredTracks, setStoredTheme, themeNames, getStoredTwitchOAuthToken } from './helpers';
import Login from './components/Login';
import Settings from './components/Settings';
import BlindTest from './components/BlindTest';
import LoginCallback from './components/LoginCallback';
import Help from 'components/Help';
import Playlist from 'components/Playlist';
import { validateToken } from 'services/TwitchAPI';
import { settingsStore } from 'components/data/SettingsStore';

function App() {
  const navigate = useNavigate();

  const settings = settingsStore();

  const [twitchNick, setTwitchNick] = useState('');
  const [theme, setTheme] = useState(() => getStoredTheme());
  const [loggedInSpotify, setLoggedInSpotify] = useState(() => getStoredSpotifyRefreshToken() !== null);
  const [loggedInTwitch, setLoggedInTwitch] = useState(() => getStoredTwitchOAuthToken() !== null);
  const [configured, setConfigured] = useState(() => settings.isInitialized());
  const [tracksLoaded, setTracksLoaded] = useState(() => hasStoredTracks());
  const [view, setView] = useState(<div />);
  const [subtitle, setSubtitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const contextValue = { loggedInSpotify, setLoggedInSpotify, loggedInTwitch, setLoggedInTwitch, configured, setConfigured, tracksLoaded, setTracksLoaded, subtitle, setSubtitle, twitchNick, setTwitchNick };

  const location = useLocation();

  useEffect(() => {
    setAxiosErrorCallback((msg: string) => { setErrorMessage(msg); });

    // check if twitch token is still valid
    if (getStoredTwitchOAuthToken() !== null) {
      const twitchToken = getStoredTwitchOAuthToken() || '';
      validateToken(twitchToken).then(response => {
        if (response.status !== 200) {
          deleteStoredTwitchOAuthToken();
          setLoggedInTwitch(false);
        } else {
          response.json().then(body => setTwitchNick(body['login']));
          setLoggedInTwitch(true);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!loggedInSpotify || !loggedInTwitch) {
      setView(<Login />);
      navigate('/');
    } else if (!configured) {
      navigate('/settings');
    } else if (location.pathname === "/") {
      if (!tracksLoaded) {
        navigate('/playlist');
      } else {
        setView(<BlindTest />);
        navigate('/');
      }
    }
  }, [navigate, loggedInSpotify, loggedInTwitch, configured, tracksLoaded]);

  useEffect(() => {
    for (let name of themeNames) {
      document.documentElement.classList.remove(name);
    }
    document.documentElement.classList.add(themeNames[theme]);
  }, [theme]);

  const onPopupClose = () => {
    setErrorMessage('');
    navigate('/');
  };

  const toggleTheme = () => {
    setStoredTheme(1 - theme);
    setTheme(1 - theme);
  }

  const logout = () => {
    deleteStoredSpotifyRefreshToken();
    deleteStoreSpotifyAccessToken();
    deleteStoredBlindTestTracks();
    deleteStoredBlindTestScores();
    deleteStoredTwitchOAuthToken();
    settings.reset();
    setLoggedInSpotify(false);
    setLoggedInTwitch(false);
    setTracksLoaded(false);
    setConfigured(false);
    navigate("/");
  }

  const loggedIn = loggedInSpotify && loggedInTwitch;
  return (
    <BlindTestContext.Provider value={contextValue}>
      <header className="app-header">
        <div style={{ position: 'absolute', left: 0, fontSize: '1.3333rem', padding: '4px' }}>
          <FontAwesomeIcon icon={['fab', 'spotify']} color="#1ED760" size="sm" />
          <a href={process.env.PUBLIC_URL}> <b>B</b>lind<b>T</b>es<b>T</b>witch</a>
        </div>
        <div style={{ position: 'absolute', right: 0 }}>
          {loggedIn && tracksLoaded && <Button id="playButton" type="submit" variant="link" size="sm" onClick={() => navigate("/")} title="Play">
            <FontAwesomeIcon icon={['fas', 'music']} size="lg" />
          </Button>}
          {loggedIn && <Button id="listButton" type="submit" variant="link" size="sm" onClick={() => navigate("/playlist")} title="Playlists">
            <FontAwesomeIcon icon={['fas', 'list']} size="lg" />
          </Button>}
          <Button id="toggleButton" type="submit" variant="link" size="sm" onClick={toggleTheme} title="Switch theme">
            <FontAwesomeIcon icon={['fas', 'adjust']} size="lg" />
          </Button>
          {loggedIn && <Button id="settingButton" type="submit" variant="link" size="sm" onClick={() => navigate("/settings")} title="Settings">
            <FontAwesomeIcon icon={['fas', 'cog']} size="lg" />
          </Button>}
          {loggedIn && tracksLoaded && <Help />}
          {loggedIn && <Button id="logoutButton" type="submit" variant="link" size="sm" onClick={logout} title="Logout">
            <FontAwesomeIcon icon={['fas', 'sign-out-alt']} size="lg" />
          </Button>}
        </div>
        <p id="subtitle" className="lead text-secondary">
          {subtitle}
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
    </BlindTestContext.Provider >
  );
}

export default App;

export const BlindTestContext = createContext({
  loggedInSpotify: false,
  setLoggedInSpotify: (v: boolean) => { }, // eslint-disable-line
  loggedInTwitch: false,
  setLoggedInTwitch: (v: boolean) => { }, // eslint-disable-line
  configured: false,
  setConfigured: (v: boolean) => { }, // eslint-disable-line
  tracksLoaded: false,
  setTracksLoaded: (v: boolean) => { }, // eslint-disable-line
  subtitle: '',
  setSubtitle: (v: string) => { }, // eslint-disable-line
  twitchNick: '',
  setTwitchNick: (v: string) => { } // eslint-disable-line
});
