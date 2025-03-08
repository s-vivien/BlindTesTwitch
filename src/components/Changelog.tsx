import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Modal } from 'react-bootstrap';

const Changelog = ({ show, onClose }: any) => {

  return (
    <Modal scrollable={true} show={show} centered size="lg" dialogClassName="changelog-modal">
      <Modal.Body>
        <h3><u>16/12/2024</u></h3>
        <br />
        <h5 className="h5-with-line">UI rework</h5>
        <br />
        <img src="/BlindTesTwitch/chglg_1.png" className="border" />
        <br />
        <ul>
          <li>Twitch avatars are now displayed in the leaderboard</li>
          <li>The Pause button has been removed</li>
          <li>The UI is now wider</li>
          <li>A new menu in the top-right corner replaces the old buttons</li>
          <li>Lots of small tweaks</li>
        </ul>
        <br />
        <h5 className="h5-with-line">New available actions during the game</h5>
        <br />
        <img src="/BlindTesTwitch/chglg_0.png" className="border" />
        <br />
        <ul>
          <li><i><b>Shuffle</b></i> : the next track will be chosen randomly</li>
          <li><i><b>Cancel last track points</b></i> : removes the points awarded by the last track</li>
        </ul>
        <br />
        <h5 className="h5-with-line">Playlist edition rework</h5>
        <br />
        <img src="/BlindTesTwitch/chglg_2.gif" className="border" />
        <div className={'img-caption'}><span>Quick-edit the visibility of each guessable value</span></div>
        <br />
        <br />
        <img src="/BlindTesTwitch/chglg_2.png" className="border" />
        <div className={'img-caption'}><span>Edition modal revamp</span></div>
        <br />
        <br />
        <h5 className="h5-with-line">New valid alternative answers</h5>
        <br />
        <span>A few examples :</span>
        <ul>
          <li><code>the police</code> <FontAwesomeIcon icon={['fas', 'arrow-right']} size="xs" /> <code>police</code> and <code>the police</code> are both considered valid answers</li>
          <li><code>earth wind & fire</code> <FontAwesomeIcon icon={['fas', 'arrow-right']} size="xs" /> <code>earth wind & fire</code> and <code>earth wind and fire</code> are valid</li>
          <li><code>bigflo & oli</code> <FontAwesomeIcon icon={['fas', 'arrow-right']} size="xs" /> <code>bigflo & oli</code> and <code>bigflo et oli</code> are valid</li>
          <li><code>florence + the machine</code> <FontAwesomeIcon icon={['fas', 'arrow-right']} size="xs" /> <code>florence + the machine</code> and <code>florence and the machine</code> are valid</li>
        </ul>
        <br />
        <h5 className="h5-with-line">Various bug fixes</h5>
      </Modal.Body>
      <Modal.Footer>
        <Button size="sm" style={{ color: 'white', width: '60px' }} onClick={() => onClose()}>
          <b>Ok</b>
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default Changelog;
