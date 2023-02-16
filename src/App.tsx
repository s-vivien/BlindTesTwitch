import './icons';
import { useEffect, useState, createContext } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Alert, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { setAxiosErrorCallback } from './services/SpotifyAPI';
import { deleteStoredBlindTestTracks, deleteStoredBlindTestScores, deleteStoredTwitchOAuthToken, deleteStoredSettings, deleteStoredAccessToken, deleteStoredRefreshToken, getStoredRefreshToken, getStoredSettings, getStoredTheme, hasStoredBlindTest, setStoredTheme, themeNames } from './helpers';
import Login from './components/Login';
import Settings from './components/Settings';
import BlindTestView from './components/BlindTestView';
import LoginCallback from './components/LoginCallback';
import Help from 'components/Help';
import PlaylistView from 'components/PlaylistView';

function App() {
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => getStoredTheme());
  const [loggedIn, setLoggedIn] = useState(() => getStoredRefreshToken() !== null);
  const [configured, setConfigured] = useState(() => getStoredSettings().isInitialized());
  const [ongoingBt, setOngoingBt] = useState(() => hasStoredBlindTest());
  const [view, setView] = useState(<div />);
  const [subtitle, setSubtitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const contextValue = { loggedIn, setLoggedIn, configured, setConfigured, ongoingBt, setOngoingBt, subtitle, setSubtitle };

  useEffect(() => {
    setAxiosErrorCallback((msg: string) => { setErrorMessage(msg); });
  }, []);

  useEffect(() => {
    if (!loggedIn) {
      setView(<Login />);
    } else if (!configured) {
      navigate('/settings');
    } else if (!ongoingBt) {
      navigate('/playlist');
    } else {
      setView(<BlindTestView />);
    }
  }, [navigate, loggedIn, configured, ongoingBt]);

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
    deleteStoredRefreshToken();
    deleteStoredAccessToken();
    deleteStoredBlindTestTracks();
    deleteStoredBlindTestScores();
    deleteStoredTwitchOAuthToken();
    deleteStoredSettings();
    setLoggedIn(false);
    setOngoingBt(false);
    setConfigured(false);
    navigate("/");
  }

  return (
    <BlindTestContext.Provider value={contextValue}>
      <header className="app-header">
        <div style={{ position: 'absolute', left: 0, fontSize: '1.3333rem', padding: '4px' }}>
          <FontAwesomeIcon icon={['fab', 'spotify']} color="#84BD00" size="sm" />
          <a href={process.env.PUBLIC_URL}> <b>B</b>lind<b>T</b>es<b>T</b>witch</a>
        </div>
        <div style={{ position: 'absolute', right: 0 }}>
          {loggedIn && ongoingBt && <Button id="playButton" type="submit" variant="link" size="sm" onClick={() => navigate("/")} title="Play">
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
          <Help />
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
          <div className="spot-modal-bg">
            <Alert className="spot-modal" variant="danger" >
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
          <Route path="/playlist" element={<PlaylistView />} />
          <Route path="/callback" element={<LoginCallback />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </BlindTestContext.Provider >
  );
}

export default App;

export const BlindTestContext = createContext({
  loggedIn: false,
  setLoggedIn: (v: boolean) => { }, // eslint-disable-line
  configured: false,
  setConfigured: (v: boolean) => { }, // eslint-disable-line
  ongoingBt: false,
  setOngoingBt: (v: boolean) => { }, // eslint-disable-line
  subtitle: '',
  setSubtitle: (v: string) => { } // eslint-disable-line
});
