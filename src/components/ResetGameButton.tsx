import { Button, Alert } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { removeBlindTestTracks, removeBlindTestScores } from "helpers"
import { useContext, useState } from "react";
import { BlindTestContext } from "App";

const ResetGameButton = () => {

  const { setOngoingBt } = useContext(BlindTestContext);
  const [popupDisplayed, setPopupDisplayed] = useState(false);

  const handleClick = (keepScores: boolean) => {
    removeBlindTestTracks();
    if (!keepScores) {
      removeBlindTestScores();
    }
    setOngoingBt(false);
  }

  return (
    <>
      {popupDisplayed &&
        <div className="spot-modal-bg">
          <Alert className="spot-modal" variant="secondary" >
            <p>
              Do you want to keep scores ?
            </p>
            <div className="d-flex justify-content-center">
              <Button className="mr-2" onClick={() => handleClick(true)} >
                Yes
              </Button>
              <Button onClick={() => handleClick(false)} variant="danger">
                No thanks
              </Button>
            </div>
          </Alert>
        </div>
      }
      <Button id="resetButton" className="topButtons" type="submit" variant="link" size="lg" onClick={() => setPopupDisplayed(true)} title="Reset">
        <FontAwesomeIcon icon={['fas', 'sync-alt']} size="lg" />
      </Button>
    </>
  )
}

export default ResetGameButton
