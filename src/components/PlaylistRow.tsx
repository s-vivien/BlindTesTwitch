import TracksBaseData from "./data/TracksBaseData"
import { Button } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { BlindTestTracks } from "./data/BlindTestData"
import { setBlindTestTracks } from "../helpers"
import { useNavigate } from "react-router-dom";
import { useContext } from "react"
import { BlindTestContext } from "App"

const PlaylistRow = (props: any) => {

  const { setOngoingBt } = useContext(BlindTestContext);
  const navigate = useNavigate();

  const exportPlaylist = async () => {
    const tracks = await new TracksBaseData(props.playlist).getPlaylistItems();
    const bt = new BlindTestTracks(tracks);
    setBlindTestTracks(bt);
    setOngoingBt(true);
    navigate("/");
  }

  const renderTickCross = (condition: boolean) => {
    if (condition) {
      return <FontAwesomeIcon icon={['far', 'check-circle']} size="sm" />
    } else {
      return <FontAwesomeIcon icon={['far', 'times-circle']} size="sm" style={{ color: '#ECEBE8' }} />
    }
  };

  const MusicIcon = <FontAwesomeIcon icon={['fas', 'music']} />;

  let playlist = props.playlist;

  if (playlist.uri == null) return (
    <tr key={playlist.name}>
      <td>{MusicIcon}</td>
      <td>{playlist.name}</td>
      <td colSpan={2}>This playlist is not supported</td>
      <td>{renderTickCross(playlist.public)}</td>
      <td>&nbsp;</td>
    </tr>
  );

  return (
    <tr key={playlist.uri}>
      <td>{MusicIcon}</td>
      <td><a href={playlist.uri}>{playlist.name}</a></td>
      <td><a href={playlist.owner.uri}>{playlist.owner.display_name}</a></td>
      <td>{playlist.tracks.total}</td>
      <td>{renderTickCross(playlist.public)}</td>
      <td className="text-right">
        <Button type="submit" variant="primary" onClick={exportPlaylist} className="text-nowrap btn-xs">
          <FontAwesomeIcon icon={['fas', 'play-circle']} size="sm" /> Select
        </Button>
      </td>
    </tr>
  );
};

export default PlaylistRow
