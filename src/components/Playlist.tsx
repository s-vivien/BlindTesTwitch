import { useContext, useState } from 'react';
import { BlindTestContext } from "App";
import PlaylistSelection from "./PlaylistSelection";
import PlaylistEdition from './PlaylistEdition';
import { deleteStoredBlindTestTracks } from 'helpers';
import { Button, Modal } from 'react-bootstrap';

const Playlist = () => {

  const { tracksLoaded, setTracksLoaded } = useContext(BlindTestContext);

  const [confirmationDisplayed, setConfirmationDisplayed] = useState(false);

  const restart = () => {
    deleteStoredBlindTestTracks();
    setConfirmationDisplayed(false);
    setTracksLoaded(false);
  }

  return (
    <div>
      {tracksLoaded && <div className="playlist-load-button mb-2">
        <Button id="selectList" type="submit" size="sm" onClick={() => setConfirmationDisplayed(true)} title="Select playlist">
          <b>Load another playlist from Spotify</b>
        </Button>
      </div>}

      <Modal show={confirmationDisplayed} centered>
        <Modal.Body>
          Do you really want to load another playlist from Spotify ?
          <br></br>
          <i>All modifications will be lost</i> (scores won't be affected)
        </Modal.Body>
        <Modal.Footer>
          <Button size="sm" className="mr-2" onClick={restart}>
            Yes
          </Button>
          <Button size="sm" onClick={() => setConfirmationDisplayed(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <div id="playlists">
        {tracksLoaded && <PlaylistEdition />}
        {!tracksLoaded && <PlaylistSelection />}
      </div>
    </div>
  );
}

export default Playlist
