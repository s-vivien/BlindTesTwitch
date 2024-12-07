import PlaylistEdition from './PlaylistEdition';
import PlaylistSelection from "./PlaylistSelection";
import { useBTTracksStore } from './data/BlindTestTracksStore';

const Playlist = () => {

  const btStoreClear = useBTTracksStore((state) => state.clear);
  const btStoreTotalTracks = useBTTracksStore((state) => state.totalTracks);

  const restart = () => {
    btStoreClear();
  }

  return (
    <div>
      <div id="playlists">
        {btStoreTotalTracks > 0 && <PlaylistEdition onRestart={restart} />}
        {btStoreTotalTracks == 0 && <PlaylistSelection />}
      </div>
    </div>
  );
}

export default Playlist
