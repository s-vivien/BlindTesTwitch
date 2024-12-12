import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Modal } from "react-bootstrap";

const Changelog = ({ show, onClose }: any) => {

  return (
    <Modal scrollable={true} show={show} centered size="lg" dialogClassName="changelog-modal">
      <Modal.Body>
        <h3>12/12/2024</h3>
        <br />
        <h5>Some characters now produces valid alternative answers</h5>
        <br />
        <span>A few examples :</span>
        <ul>
          <li><code>the police</code> <FontAwesomeIcon icon={['fas', 'arrow-right']} size="xs" /> <code>police</code> and <code>the police</code> are both considered valid answers</li>
          <li><code>earth wind & fire</code> <FontAwesomeIcon icon={['fas', 'arrow-right']} size="xs" /> <code>earth wind & fire</code> and <code>earth wind and fire</code> are valid</li>
          <li><code>bigflo & oli</code> <FontAwesomeIcon icon={['fas', 'arrow-right']} size="xs" /> <code>bigflo & oli</code> and <code>bigflo et oli</code> are valid</li>
          <li><code>florence + the machine</code> <FontAwesomeIcon icon={['fas', 'arrow-right']} size="xs" /> <code>florence + the machine</code> and <code>florence and the machine</code> are valid</li>
        </ul>
        <br />
        <h5>New available actions</h5>
        <br />
        <img src='/BlindTesTwitch/chglg_0.png' className="border" />
        <br />
        <ul>
          <li><i><b>Shuffle</b></i> : the next track will be chosen randomly</li>
          <li><i><b>Cancel last track points</b></i> : removes the points awarded by the last track</li>
          <li><i><b>Pick random player</b></i> : randomly selects a player with at least 1 point</li>
        </ul>
        <br />
        <h5>UI rework</h5>
        <ul>
          <li>The Pause button has been removed</li>
          <li>The UI is now wider</li>
          <li>Twitch avatars are now displayed in the leaderboard</li>
          <img src='/BlindTesTwitch/chglg_1.png' className="border" />
          <li>A new menu in the top-right corner replaces the old buttons</li>
          <li>Lots of small tweaks</li>
        </ul>
        <br />
        <h5>Various bug fixes</h5>
      </Modal.Body>
      <Modal.Footer>
        <Button size="sm" style={{ color: 'white', width: '60px' }} onClick={() => onClose()}>
          <b>Ok</b>
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default Changelog
