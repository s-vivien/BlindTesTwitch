import { Button, Alert } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useState } from "react"

const PlaylistRow = (props: any) => {

  const [helpDisplayed, setHelpDisplayed] = useState(false);

  const handleClick = () => {
    setHelpDisplayed(true);
  }

  return (
    <>
      {helpDisplayed &&
        <div className="spot-modal-bg">
          <Alert className="spot-modal" variant="secondary">
            <h2>How to play</h2>
            <p>
              No registration/prerequisite is needed to play : <b>just type in the chat to play !</b>
              <br />
              You'll be added automatically to the leaderboard.
            </p>
            <p>
              There is a (small) typo tolerance, don't be afraid to type fast 😃
            </p>
            <p>
              ⚠️ <i><b>Title and artist(s) must be typed in separate messages</b></i> ⚠️
              <br />
              i.e. if your message contains both artist and title, it won't be acknowleged...
            </p>
            <h2>Scoring</h2>
            <p>
              <b>1 point</b> is awarded each time someone is <i>the first</i> to find the title or one of the artists.
              <br />
              Any additional correct answer on a track by the same player will give them <b>2 points</b> !
            </p>
            <div className="d-flex justify-content-center">
              <Button onClick={() => setHelpDisplayed(false)}>
                Ok
              </Button>
            </div>
          </Alert>
        </div>
      }
      <Button id="helpButton" className="topButtons" type="submit" variant="link" size="lg" onClick={handleClick} title="Help">
        <FontAwesomeIcon icon={['fas', 'question-circle']} size="lg" />
      </Button>
    </>
  );
};

export default PlaylistRow
