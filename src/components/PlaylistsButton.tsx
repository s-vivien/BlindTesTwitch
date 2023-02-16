import { Button } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { deleteStoredBlindTestTracks } from "helpers"
import { useContext } from "react";
import { BlindTestContext } from "App";

const PlaylistsButton = () => {

  const { setOngoingBt } = useContext(BlindTestContext);

  const handleClick = () => {
    deleteStoredBlindTestTracks();
    setOngoingBt(false);
  }

  return (
    <Button id="listButton" className="topButtons" type="submit" variant="link" size="sm" onClick={handleClick} title="Playlists">
      <FontAwesomeIcon icon={['fas', 'list']} size="lg" />
    </Button>
  )
}

export default PlaylistsButton
