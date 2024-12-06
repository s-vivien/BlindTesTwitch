import { useContext } from 'react';
import { BlindTestContext } from "App";
import PlaylistSelection from "./PlaylistSelection";
import PlaylistEdition from './PlaylistEdition';
import { useBTTracksStore } from './data/BlindTestTracksStore';

const Playlist = () => {

  const { tracksLoaded, setTracksLoaded } = useContext(BlindTestContext);
  const btStore = useBTTracksStore();

  const restart = () => {
    btStore.clear();
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
