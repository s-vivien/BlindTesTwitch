import TracksBaseData from "./data/TracksBaseData"
import { Button, Alert } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { BlindTestTracks } from "./data/BlindTestData"
import { setBlindTestTracks, removeBlindTestScores, getBlindTestScores } from "../helpers"
import { useNavigate } from "react-router-dom";
import { useContext, useState } from "react"
import { BlindTestContext } from "App"

const PlaylistRow = (props: any) => {

  const { setOngoingBt } = useContext(BlindTestContext);
  const [confirmationDisplayed, setConfirmationDisplayed] = useState(false);
  const navigate = useNavigate();

  const selectPlaylist = async () => {
    if (getBlindTestScores().size > 0) {
      setConfirmationDisplayed(true);
    } else {
      loadPlaylist(false);
    }
  }

  const loadPlaylist = async (keepScores: boolean) => {
    if (!keepScores) {
      removeBlindTestScores();
    }
    let tracks = await new TracksBaseData(props.playlist).getPlaylistItems();
    tracks = tracks.filter(t => t.track.is_playable);
    const bt = new BlindTestTracks(tracks, props.playlist.uri);
    setBlindTestTracks(bt);
    setOngoingBt(true);
    navigate("/");
  }

  const renderTickCross = (condition: boolean) => {
    if (condition) {
      return <FontAwesomeIcon icon={['far', 'check-circle']} size="1x" style={{ color: "green" }} />
    } else {
      return <FontAwesomeIcon icon={['far', 'times-circle']} size="1x" style={{ color: "red" }} />
    }
  };

  const MusicIcon = <FontAwesomeIcon icon={['fas', 'music']} />;

  let playlist = props.playlist;

  if (playlist.uri == null) return (
    <tr key={playlist.name}>
      <td>{MusicIcon}</td>
      <td>{playlist.name}</td>
      <td colSpan={2}>This playlist is not supported</td>
      <td>{renderTickCross(!playlist.public)}</td>
      <td>&nbsp;</td>
    </tr>
  );

  return (
    <>
      {confirmationDisplayed &&
        <div className="spot-modal-bg">
          <Alert className="spot-modal" variant="secondary" >
            <p>
              Do you want to reset the leaderboard scores ?
            </p>
            <div className="d-flex justify-content-center">
              <Button className="mr-2" onClick={() => loadPlaylist(false)}>
                Yes
              </Button>
              <Button className="mr-2" onClick={() => loadPlaylist(true)}>
                No
              </Button>
              <Button onClick={() => setConfirmationDisplayed(false)}>
                Cancel
              </Button>
            </div>
          </Alert>
        </div>
      }
      <tr key={playlist.uri}>
        <td>{MusicIcon}</td>
        <td><a href={playlist.uri}>{playlist.name}</a></td>
        <td><a href={playlist.owner.uri}>{playlist.owner.display_name}</a></td>
        <td>{playlist.tracks.total}</td>
        <td>{renderTickCross(!playlist.public)}</td>
        <td className="text-right">
          <Button type="submit" variant="primary" onClick={selectPlaylist} className="text-nowrap btn-xs">
            <FontAwesomeIcon icon={['fas', 'play-circle']} size="sm" /> Select
          </Button>
        </td>
      </tr>
    </>
  );
};

export default PlaylistRow
