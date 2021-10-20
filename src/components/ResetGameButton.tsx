import { Button } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { removeStoredBlindTest } from "helpers"
import { useContext } from "react";
import { BlindTestContext } from "App";

const ResetGameButton = () => {

  const { setOngoingBt } = useContext(BlindTestContext);

  const handleClick = () => {
    removeStoredBlindTest()
    setOngoingBt(false);
  }

  return (
    <Button id="resetButton" className="topButtons" type="submit" variant="link" size="lg" onClick={handleClick} title="Reset">
      <FontAwesomeIcon icon={['fas', 'sync-alt']} size="lg" />
    </Button>
  )
}

export default ResetGameButton
