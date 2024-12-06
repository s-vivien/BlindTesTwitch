import { useContext } from 'react';
import { BlindTestContext } from "App";
import PlaylistSelection from "./PlaylistSelection";
import PlaylistEdition from './PlaylistEdition';
import { btTracksStore } from './data/BlindTestTracksStore';

const Playlist = () => {

  const { tracksLoaded, setTracksLoaded } = useContext(BlindTestContext);
  const bt = btTracksStore();

  const restart = () => {
    bt.clear();
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
