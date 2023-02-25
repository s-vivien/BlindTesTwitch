import { useContext, useEffect, useState } from 'react'
import { BlindTestContext } from "App"
import { cleanValue, deepCopyObject, deleteStoredBlindTestTracks, getStoredBlindTestTracks, setStoredBlindTestTracks } from 'helpers';
import { Button, Col, Form, Modal, OverlayTrigger, Popover, Row } from 'react-bootstrap';
import { BlindTestTracks, computeGuessable, Guessable, GuessableType } from './data/BlindTestData';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type EditedGuessable = {
  value: string,
  type: GuessableType
  disabled: boolean
}

const PlaylistEdition = (props: any) => {

  const { setSubtitle } = useContext(BlindTestContext);

  const [bt, setBt] = useState(() => getStoredBlindTestTracks());
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showAcceptedValues, setShowAcceptedValues] = useState(false);
  const [editedValues, setEditedValues] = useState<EditedGuessable[]>([]);
  const [edition, setEdition] = useState(false);
  const [validated, setValidated] = useState(false);
  const [removeTrackModal, setRemoveTrackModal] = useState(false);
  const [restartModal, setRestartModal] = useState(false);

  useEffect(() => {
    setSubtitle(`Editing playlist`);
  }, []);

  const validateEdit = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.checkValidity() === true) {
      let newBt = deepCopyObject(BlindTestTracks, bt);
      newBt.tracks[selectedIndex].guessables = editedValues.map((g) => computeGuessable(g.value, g.type, g.disabled));
      setStoredBlindTestTracks(newBt);
      setBt(newBt);
      endEdit();
    }
    setValidated(true);
  }

  const restart = () => {
    setRestartModal(false);
    props.onRestart();
  }

  const startEdit = (index: number) => {
    setSelectedIndex(index);
    setEdition(true);
    let editedGuessables: EditedGuessable[] = [];
    bt.tracks[index].guessables.forEach(g => { editedGuessables.push({ value: g.original, type: g.type, disabled: g.disabled }); })
    setEditedValues(editedGuessables);
  }

  const addExtraGuessable = () => {
    let newEditedValues = [...editedValues];
    newEditedValues.push({ value: "", type: GuessableType.Misc, disabled: false });
    setEditedValues(newEditedValues);
  }

  const removeExtraGuessable = (index: number) => {
    let newEditedValues = [...editedValues];
    newEditedValues.splice(index, 1);
    setEditedValues(newEditedValues);
  }

  const endEdit = () => {
    setSelectedIndex(-1);
    setEdition(false);
  }

  const updateDisabled = (index: number, enabled: boolean) => {
    let newEditedValues = [...editedValues];
    newEditedValues[index].disabled = !enabled;
    setEditedValues(newEditedValues);
  }

  const updateValue = (index: number, value: string) => {
    let newEditedValues = [...editedValues];
    newEditedValues[index].value = value;
    setEditedValues(newEditedValues);
  }

  const remove = (index: number, confirmed: boolean) => {
    if (!confirmed) {
      setSelectedIndex(index);
      setRemoveTrackModal(true);
    } else {
      let newBt = deepCopyObject(BlindTestTracks, bt);
      newBt.tracks.splice(index, 1);
      setStoredBlindTestTracks(newBt);
      setBt(newBt);
      if (index < newBt.doneTracks) {
        newBt.doneTracks--;
      }
      setRemoveTrackModal(false);
    }
  }

  const renderGuessables = (guessables: Guessable[]) => {
    if (guessables.length === 0) return <></>
    return guessables.map<React.ReactNode>(g => {
      const value = showAcceptedValues ? g.toGuess : g.original;
      return g.disabled ? <del>{value}</del> : <>{value}</>;
    }).reduce((prev, curr) => [prev, ', ', curr]);
  }

  const popover = (
    <Popover id="popover-help">
      <Popover.Body>
        You can modify each value to guess directly in the text-fields.
        <br></br>
        <br></br>
        The <strong>accepted value</strong> indicates what will be used by the bot as a reference to accept answers. It's the "cleaned" version of the value.
        <br></br>
        <br></br>
        The checkbox indicates if the value is enabled or not. Disabled values are shown from the start during the game, and players won't be able to score points on them.
        <br></br>
        <br></br>
        You can add extra values to guess by clicking the <strong>Add value</strong> button.
      </Popover.Body>
    </Popover>
  );

  return (
    <>

      <Modal show={restartModal} centered>
        <Modal.Body>
          Do you really want to load another playlist from Spotify ?
          <br></br>
          <i>All modifications will be lost</i> (scores won't be affected)
        </Modal.Body>
        <Modal.Footer>
          <Button className="mr-2" onClick={restart}>
            Yes
          </Button>
          <Button onClick={() => setRestartModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={removeTrackModal} centered>
        <Modal.Body>
          Do you really want to remove this track ?
        </Modal.Body>
        <Modal.Footer>
          <Button className="mr-2" onClick={() => remove(selectedIndex, true)}>
            Yes
          </Button>
          <Button onClick={() => setRemoveTrackModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={edition} centered size="lg">
        <Form noValidate validated={validated} onSubmit={validateEdit} style={{ flex: 1 }} className="px-3">
          <Modal.Body>

            <Form.Group as={Row} controlId="formHeader" className='edition-form-header'>
              <Form.Label column sm={1}>
                <b>Type</b>
              </Form.Label>
              <Form.Label column sm={5}>
                <b>Value</b>
              </Form.Label>
              <Form.Label column sm={5}>
                <b>Accepted value</b>
              </Form.Label>
              <Form.Label column sm={1}>
              </Form.Label>
            </Form.Group>

            {editedValues.map((guessable, index) => {
              return <Form.Group as={Row} controlId={"formRow" + index} className="mt-2">
                <Form.Label column sm={1}>
                  {GuessableType[guessable.type]}
                </Form.Label>
                <Col sm={5}>
                  <Form.Control title={cleanValue(guessable.value)} required disabled={guessable.disabled} value={guessable.value} onChange={(e) => { updateValue(index, e.target.value) }} type="text" placeholder="Enter value" />
                </Col>
                <Form.Label className="code" column sm={5}>
                  {cleanValue(guessable.value)}
                </Form.Label>
                <Form.Label column sm={1}>
                  {guessable.type === GuessableType.Misc && <FontAwesomeIcon onClick={() => removeExtraGuessable(index)} icon={['fas', 'trash']} size="lg" />}
                  {guessable.type !== GuessableType.Misc && <input type="checkbox" className="larger" checked={!guessable.disabled} onChange={(e) => { updateDisabled(index, e.target.checked) }} />}
                </Form.Label>
              </Form.Group>
            })}
          </Modal.Body>
          <Modal.Footer>
            <OverlayTrigger
              placement="right"
              delay={{ show: 250, hide: 400 }}
              overlay={popover}
            >
              <FontAwesomeIcon icon={['fas', 'circle-info']} style={{ fontSize: "2.4rem" }} />
            </OverlayTrigger>
            <Button className="mr-2 edition-form-left-buttons" variant="primary" onClick={addExtraGuessable}>
              Add value
            </Button>
            <Button className="mr-2" variant="primary" type="submit">
              Save
            </Button>
            <Button className="mr-2" variant="secondary" onClick={endEdit}>
              Cancel
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <div className="playlist-load-button mb-2">
        <Button id="selectList" type="submit" onClick={() => setRestartModal(true)} title="Select playlist">
          <b>Load another playlist from Spotify</b>
        </Button>
        <div className="mt-2">
          <input
            type="checkbox"
            id="show-accepted"
            checked={showAcceptedValues}
            className="m-2 large"
            onChange={() => setShowAcceptedValues(!showAcceptedValues)}
          >
          </input>
          <label htmlFor="show-accepted">Display the values the bot will accept (i.e. cleaned values)</label>
        </div>
      </div>

      {
        bt.tracks.map((track, index) => {
          return <div className={"p-1 edition-row " + (index < bt.doneTracks ? "edition-row-disabled" : "")} key={"track-" + track.offset}>
            <div className="edition-row-number">
              #{1 + index}
            </div>
            <div id="cover" className="edition-cover">
              <img id="cover-image" src={track.img} alt="cover" />
            </div>
            <div style={{ flex: 1 }} className={"px-3 " + (showAcceptedValues ? "code" : "")}>
              <div>
                <b>{renderGuessables(track.getGuessables(GuessableType.Title))}</b>
              </div>
              <div>
                {renderGuessables(track.getGuessables(GuessableType.Artist))}
              </div>
              <div>
                {renderGuessables(track.getGuessables(GuessableType.Misc))}
              </div>
            </div>
            {!edition && index >= bt.doneTracks && <div className="edition-buttons">
              <Button variant="outline-secondary" onClick={() => startEdit(index)}>Edit</Button>
              <Button variant="outline-danger" onClick={() => remove(index, false)}>Delete</Button>
            </div>}
          </div>
        })
      }
    </>
  );
}

export default PlaylistEdition

