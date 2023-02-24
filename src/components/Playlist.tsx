import { useContext } from 'react';
import { BlindTestContext } from "App";
import PlaylistSelection from "./PlaylistSelection";
import PlaylistEdition from './PlaylistEdition';
import { deleteStoredBlindTestTracks } from 'helpers';

const Playlist = () => {

  const { tracksLoaded, setTracksLoaded } = useContext(BlindTestContext);

  const restart = () => {
    deleteStoredBlindTestTracks();
    setTracksLoaded(false);
  }

  return (
    <div>
      <div id="playlists">
        {tracksLoaded && <PlaylistEdition onRestart={restart} />}
        {!tracksLoaded && <PlaylistSelection />}
      </div>
    </div>
  );
}

export default Playlist
