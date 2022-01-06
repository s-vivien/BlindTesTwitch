import { getSettings, getTwitchOAuthToken, setSettings, getAppHomeURL, setTwitchOAuthToken, getHashParam, removeTwitchOAuthToken } from "helpers"
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from 'react'
import { getDevices } from "services/SpotifyAPI"
import { SettingsData } from "./data/SettingsData";
import Form from 'react-bootstrap/Form'
import { Button } from "react-bootstrap";
import { BlindTestContext } from "App";

const Settings = () => {

  const { setConfigured, setSubtitle } = useContext(BlindTestContext);
  const navigate = useNavigate();

  const [settings] = useState(() => getSettings());
  const [validated, setValidated] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [loggedInTwitch, setLoggedInTwitch] = useState<boolean>(() => getTwitchOAuthToken() !== null);
  const [chatNotifications, setChatNotifications] = useState<boolean>(settings.chatNotifications || false);
  const [addEveryUser, setAddEveryUser] = useState<boolean>(settings.addEveryUser || false);
  const [channel, setChannel] = useState(settings.twitchChannel || '');

  const twitchLoginURI = "https://id.twitch.tv/oauth2/authorize" +
    "?client_id=" + process.env.REACT_APP_TWITCH_CLIENT_ID +
    "&redirect_uri=" + getAppHomeURL() + "/settings" +
    "&scope=chat:read+chat:edit+channel:moderate+whispers:read+whispers:edit+channel_editor" +
    "&response_type=token";

  useEffect(() => {
    console.log("main useEffect");
    // Twitch logging callback
    const token = getHashParam('access_token')
    if (token) {
      setTwitchOAuthToken(token);
      setLoggedInTwitch(true);
      navigate("/settings");
    }

    setSubtitle('Settings');
    getDevices().then(response => {
      setDevices(response.data.devices);
      const found = response.data.devices.find((d: any) => d.id === settings.deviceId)
      if (found) {
        setSelectedDevice(found.id)
      }
      setInitialized(true);
    })
  }, []);

  const twitchLogout = () => {
    removeTwitchOAuthToken();
    setLoggedInTwitch(false);
  }

  const submit = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.checkValidity() === true) {
      setSettings(new SettingsData(channel, selectedDevice, addEveryUser, chatNotifications));
      setConfigured(true);
      navigate("/");
    }
    setValidated(true);
  }

  if (initialized) {
    return (
      <div style={{ width: '600px', margin: 'auto' }}>
        <Form noValidate validated={validated} onSubmit={submit}>
          <Form.Group className="mb-3" controlId="formGroupTwitch">
            <Form.Label>Twitch channel</Form.Label>
            <Form.Control required value={channel} onChange={(e) => { setChannel(e.target.value) }} type="text" placeholder="Enter twitch channel" />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formGroupDevice">
            <Form.Label>Playing device</Form.Label>
            <Form.Select required className="form-control" value={selectedDevice} onChange={(e) => { setSelectedDevice(e.target.value) }}>
              <option value="">Select device...</option>
              {devices.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.type})</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3" controlId="formGroupChatNotifications">
            <Form.Check disabled={!loggedInTwitch} type="checkbox" checked={loggedInTwitch && chatNotifications} label="Display guess notifications in the chat" onChange={(e) => { setChatNotifications(e.target.checked) }} />
            {process.env.REACT_APP_TWITCH_CLIENT_ID &&
              <>
                {!loggedInTwitch &&
                  <Form.Text id="twitchLoginBlock" muted>
                    You need to log in to twitch to use that feature. <a href={twitchLoginURI}>Click here to log in</a>
                  </Form.Text>
                }
                {loggedInTwitch &&
                  <Form.Text id="twitchLogoutBlock" onClick={twitchLogout} muted>
                    <a href="#">Log out from twitch</a>
                  </Form.Text>
                }
              </>
            }
          </Form.Group>
          <Form.Group className="mb-3" controlId="formGroupAddEveryUser">
            <Form.Check type="checkbox" checked={addEveryUser} label="Add every speaking viewer in the leaderboard" onChange={(e) => { setAddEveryUser(e.target.checked) }} />
          </Form.Group>
          <Button variant="primary" type="submit">
            Save
          </Button>
        </Form>
      </div>
    )
  } else {
    return <div className="spinner"></div>
  }
}

export default Settings
