import './icons';
import { useEffect, useState, createContext } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Alert, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { setAxiosErrorCallback } from './services/axios';
import { getRefreshToken, getSettings, getStoredTheme, hasStoredBlindTest, setStoredTheme, themeNames } from './helpers';
import Login from './components/Login';
import Settings from './components/Settings';
import PlaylistTable from './components/PlaylistTable';
import PlaylistsButton from './components/PlaylistsButton';
import LogoutButton from './components/LogoutButton';
import SettingsButton from 'components/SettingsButton';
import BlindTestView from './components/BlindTestView';
import LoginCallback from './components/LoginCallback';

function App() {
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => getStoredTheme());
  const [loggedIn, setLoggedIn] = useState(() => getRefreshToken() !== null);
  const [configured, setConfigured] = useState(() => getSettings().isInitialized());
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
      setView(<PlaylistTable />);
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

  return (
    <BlindTestContext.Provider value={contextValue}>
      <div className={"App container"} >
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
        <header className="App-header">
          <div style={{ position: 'absolute', right: 0 }}>
            <Button id="toggleButton" className="topButtons" type="submit" variant="link" size="lg" onClick={toggleTheme} title="Switch theme">
              <FontAwesomeIcon icon={['fas', 'adjust']} size="lg" />
            </Button>
            {ongoingBt && <PlaylistsButton />}
            {loggedIn && <SettingsButton />}
            {loggedIn && <LogoutButton />}
          </div>
          <h1>
            <FontAwesomeIcon icon={['fab', 'spotify']} color="#84BD00" size="sm" /> <a href={process.env.PUBLIC_URL}>BlindTesTwitch</a>
          </h1>

          <p id="subtitle" className="lead text-secondary">
            {subtitle}
          </p>
        </header>
        <Routes>
          <Route path="/" element={view} />
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
