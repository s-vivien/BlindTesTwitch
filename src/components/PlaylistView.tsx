import { useContext } from 'react'
import { BlindTestContext } from "App"
import PlaylistTable from "./PlaylistTable"

const BlindTestView = () => {

  const { setSubtitle } = useContext(BlindTestContext);

  // TODO edition mode
  return (
    <div id="playlists">
      <PlaylistTable />
    </div>
  );
}

export default BlindTestView
