import { Button } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { deleteStoredRefreshToken, deleteStoredAccessToken, deleteStoredBlindTestTracks, deleteStoredBlindTestScores, deleteStoredSettings, deleteStoredTwitchOAuthToken } from "helpers"
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { BlindTestContext } from "App";

const LogoutButton = () => {

  const { setLoggedIn, setOngoingBt, setConfigured } = useContext(BlindTestContext);
  const navigate = useNavigate()

  const handleClick = () => {
    deleteStoredRefreshToken();
    deleteStoredAccessToken();
    deleteStoredBlindTestTracks();
    deleteStoredBlindTestScores();
    deleteStoredTwitchOAuthToken();
    deleteStoredSettings();
    setLoggedIn(false);
    setOngoingBt(false);
    setConfigured(false);
    navigate("/");
  }

  return (
    <Button id="logoutButton" className="topButtons" type="submit" variant="link" size="sm" onClick={handleClick} title="Logout">
      <FontAwesomeIcon icon={['fas', 'sign-out-alt']} size="lg" />
    </Button>
  )
}

export default LogoutButton
