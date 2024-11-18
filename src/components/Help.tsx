import { Button, Alert } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useState } from "react"
import { getStoredSettings } from "helpers";

const Help = () => {

  const [helpDisplayed, setHelpDisplayed] = useState(false);

  const handleClick = () => {
    setHelpDisplayed(true);
  }

  const settings = getStoredSettings();

  return (
    <>
      {helpDisplayed &&
        <div className="alert-modal-bg">
          <Alert className="alert-modal" variant="secondary">
            <strong>BlindTesTwitch</strong> is made by <strong>Neumann</strong> (<a href="https://twitter.com/N_e_u_m_a_n_n" target="_blank">@N_e_u_m_a_n_n</a>) and is <strong><a href="https://github.com/s-vivien/BlindTesTwitch" target="_blank">open-source</a></strong>
            <br />
            <br />
            <h2>How to play</h2>
            <ul>
              <li><b>No registration/prerequisite needed </b> : just type in the chat to play ! You'll be added automatically to the leaderboard</li>
              <li>There is a (small) <b>typo tolerance</b>, don't be afraid to type fast 😃</li>
              <li>Artists/titles and propositions are <b>cleaned before comparison</b> :
                <ul>
                  <li>Accents and special characters are removed</li>
                  <li>Lower-cased (i.e. propositions are case-insensitive)</li>
                </ul>
              </li>
            </ul>
            <p style={{ border: 'dashed black', padding: '10px' }}>
              <FontAwesomeIcon icon={['fas', 'exclamation-triangle']} size="lg" /> <i><b>Each proposition must contain a single artist/title</b></i> <FontAwesomeIcon icon={['fas', 'exclamation-triangle']} size="lg" />
              <br />
              <i>i.e. if your message contains both the artist and the title, or two artists, it won't be acknowledged...</i>
            </p>
            <h2>Scoring</h2>
            <ul>
              {settings.acceptanceDelay === 0 &&
                <li><b>1 point</b> is awarded each time someone is <i>the first</i> to find the title or one of the artists</li>
              }
              {settings.acceptanceDelay > 0 &&
                <>
                  <li><b>2 points</b> are awarded each time someone is <i>the first</i> to find the title or one of the artists</li>
                  <li>Every other player who finds the same answer within {settings.acceptanceDelay} second(s) will be rewarded with <b>1 point</b></li>
                </>
              }
              <li>Each player who answers correctly more than once on a track will receive <b>1 extra point</b> per<br />answer in addition to the points mentioned above</li>
            </ul>
            <div className="d-flex justify-content-center">
              <Button size="sm" style={{ color: 'white', width: '60px' }} onClick={() => setHelpDisplayed(false)}>
                <b>Ok</b>
              </Button>
            </div>
          </Alert>
        </div>
      }
      <Button id="helpButton" className="topButtons" type="submit" variant="link" size="sm" onClick={handleClick} title="Help">
        <FontAwesomeIcon icon={['fas', 'question-circle']} size="lg" />
      </Button>
    </>
  );
};

export default Help
