import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import GlobalMenu from 'components/global-menu';
import Playlist from 'components/playlist';
import { useAuthStore } from 'components/store/auth-store';
import { useBTTracksStore } from 'components/store/blind-test-tracks-store';
import { useGlobalStore } from 'components/store/global-store';
import { useSettingsStore } from 'components/store/settings-store';
import { useEffect, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import BlindTest from './components/blind-test';
import Login from './components/login';
import LoginCallback from './components/login-callback';
import Settings from './components/settings';
import './icons';
import { setAxiosErrorCallback } from './services/spotify-api';

function App() {
  const navigate = useNavigate();

  const settingsStore = useSettingsStore();
  const authStore = useAuthStore();
  const globalStore = useGlobalStore();
  const btTotalTracks = useBTTracksStore((state) => state.totalTracks);

  const [view, setView] = useState(<div />);
  const [errorMessage, setErrorMessage] = useState('');

  const location = useLocation();

  useEffect(() => {
    setAxiosErrorCallback((msg: string) => { setErrorMessage(msg); });
    authStore.validateTwitchOAuthToken();
  }, []);

  useEffect(() => {
    if (!authStore.isLoggedIn()) {
      setView(<Login />);
      navigate('/');
    } else if (!settingsStore.isInitialized()) {
      navigate('/settings');
    } else if (location.pathname === '/') {
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

  const loggedIn = authStore.isLoggedIn();
  return (
    <>
      <header className="app-header">
        <div style={{ position: 'absolute', left: 0, fontSize: '1.3333rem', padding: '4px' }}>
          <FontAwesomeIcon icon={['fab', 'spotify']} color="var(--spot-color)" size="sm" />
          <a className="btt" href={process.env.PUBLIC_URL}> <b>B</b>lind<b>T</b>es<b>T</b>witch</a>
        </div>
        <div style={{ position: 'absolute', right: 0 }}>
          {loggedIn &&
            <GlobalMenu />
          }
        </div>
        <p id="subtitle" className="lead text-secondary">
          {globalStore.subtitle}
        </p>
      </header>
      <div className={'app container'}>
        {errorMessage &&
          <div className="alert-modal-bg">
            <Alert className="alert-modal" variant="danger">
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
