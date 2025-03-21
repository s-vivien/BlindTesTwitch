import PlaylistEdition from './playlist-edition';
import PlaylistSelection from './playlist-selection';
import { useBTTracksStore } from './store/blind-test-tracks-store';

const Playlist = () => {

  const btStoreClear = useBTTracksStore((state) => state.clear);
  const btStoreTotalTracks = useBTTracksStore((state) => state.totalTracks);

  const restart = () => {
    btStoreClear();
  };

  return (
    <div>
      <div id="playlists">
        {btStoreTotalTracks > 0 && <PlaylistEdition onRestart={restart} />}
        {btStoreTotalTracks === 0 && <PlaylistSelection />}
      </div>
    </div>
  );
};

export default Playlist;
