import { Button } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useNavigate } from "react-router-dom";

const LogoutButton = () => {

  const navigate = useNavigate()

  const handleClick = () => {
    navigate('/settings');
  }

  return (
    <Button id="settingButton" className="topButtons" type="submit" variant="link" size="sm" onClick={handleClick} title="Settings">
      <FontAwesomeIcon icon={['fas', 'cog']} size="lg" />
    </Button>
  )
}

export default LogoutButton
