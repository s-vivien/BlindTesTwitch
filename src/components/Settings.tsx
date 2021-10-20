import { getSettings, setSettings } from "helpers"
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
  const [addEveryUser, setAddEveryUser] = useState<boolean>(settings.addEveryUser || false);
  const [channel, setChannel] = useState(settings.twitchChannel || '');

  useEffect(() => {
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

  const submit = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.checkValidity() === true) {
      setSettings(new SettingsData(channel, selectedDevice, addEveryUser));
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
