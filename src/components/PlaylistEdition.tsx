import { useContext, useEffect, useState } from 'react'
import { BlindTestContext } from "App"
import { cleanValue, deepCopyObject, getStoredBlindTestTracks, setStoredBlindTestTracks } from 'helpers';
import { Button, Col, Form, Modal, OverlayTrigger, Popover, Row } from 'react-bootstrap';
import { BlindTestTracks, computeGuessable, Guessable, GuessableType } from './data/BlindTestData';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type EditedGuessable = {
  value: string,
  type: GuessableType
  disabled: boolean
}

const PlaylistEdition = () => {

  const { setSubtitle } = useContext(BlindTestContext);

  const [bt, setBt] = useState(() => getStoredBlindTestTracks());
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [editedValues, setEditedValues] = useState<EditedGuessable[]>([]);
  const [edition, setEdition] = useState(false);
  const [validated, setValidated] = useState(false);
  const [confirmationDisplayed, setConfirmationDisplayed] = useState(false);

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
      setConfirmationDisplayed(true);
    } else {
      let newBt = deepCopyObject(BlindTestTracks, bt);
      newBt.tracks.splice(index, 1);
      setStoredBlindTestTracks(newBt);
      setBt(newBt);
      if (index < newBt.doneTracks) {
        newBt.doneTracks--;
      }
      setConfirmationDisplayed(false);
    }
  }

  const renderGuessables = (guessables: Guessable[]) => {
    if (guessables.length === 0) return <></>
    return guessables.map<React.ReactNode>(g => g.disabled ? <del>{g.original}</del> : <>{g.original}</>).reduce((prev, curr) => [prev, ', ', curr]);
  }

  const popover = (
    <Popover id="popover-help">
      <Popover.Body>
        You can modify each value to guess directly in the text-fields.
        <br></br>
        <strong>NB</strong> : Don't forget that the values are cleaned (i.e. the value that players will have to type to score points is different from the value displayed); hover the mouse over the value to see the cleaned value.
        <br></br>
        <br></br>
        Disabled fields are shown from the start during the game, and players won't be able to score points on them.
        <br></br>
        <br></br>
        You can add extra values to guess by clicking the "Add value" button.
      </Popover.Body>
    </Popover>
  );

  return (
    <>

      <Modal show={confirmationDisplayed} centered>
        <Modal.Body>
          Do you really want to remove this track ?
        </Modal.Body>
        <Modal.Footer>
          <Button size="sm" className="mr-2" onClick={() => remove(selectedIndex, true)}>
            Yes
          </Button>
          <Button size="sm" onClick={() => setConfirmationDisplayed(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={edition} centered size="lg">
        <Form noValidate validated={validated} onSubmit={validateEdit} style={{ flex: 1 }} className="px-3">
          <Modal.Body className="edition-form-row">
            {editedValues.map((guessable, index) => {
              return <Form.Group as={Row} controlId="formHorizontalEmail">
                <Form.Label column sm={2}>
                  {GuessableType[guessable.type]}
                </Form.Label>
                <Col sm={8}>
                  <Form.Control title={cleanValue(guessable.value)} size="sm" required disabled={guessable.disabled} value={guessable.value} onChange={(e) => { updateValue(index, e.target.value) }} type="text" placeholder="Enter value" />
                </Col>
                <Col sm={2}>
                  {guessable.type === GuessableType.Misc && <FontAwesomeIcon onClick={() => removeExtraGuessable(index)} icon={['fas', 'trash']} size="xl" />}
                  {guessable.type !== GuessableType.Misc && <Form.Group controlId={"formGroupEnable" + index}>
                    <Form.Check type="checkbox" label="Enabled" checked={!guessable.disabled} onChange={(e) => { updateDisabled(index, e.target.checked) }} />
                  </Form.Group>}
                </Col>
              </Form.Group>
            })}
          </Modal.Body>
          <Modal.Footer>
            <OverlayTrigger
              placement="right"
              delay={{ show: 250, hide: 400 }}
              overlay={popover}
            >
              <FontAwesomeIcon icon={['fas', 'circle-info']} size="2xl" />
            </OverlayTrigger>
            <Button className="mr-2 edition-form-left-buttons" size="sm" variant="primary" onClick={addExtraGuessable}>
              Add value
            </Button>
            <Button className="mr-2" size="sm" variant="primary" type="submit">
              Save
            </Button>
            <Button className="mr-2" size="sm" variant="secondary" onClick={endEdit}>
              Cancel
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {
        bt.tracks.map((track, index) => {
          return <div className={"p-1 edition-row " + (index < bt.doneTracks ? "edition-row-disabled" : "")} key={"track-" + track.offset}>
            <div className="edition-row-number">
              #{1 + index}
            </div>
            <div id="cover" className="edition-cover">
              <img id="cover-image" src={track.img} alt="cover" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="px-3">
                <b>{renderGuessables(track.getGuessables(GuessableType.Title))}</b>
              </div>
              <div className="px-3">
                {renderGuessables(track.getGuessables(GuessableType.Artist))}
              </div>
              <div className="px-3">
                <i>{renderGuessables(track.getGuessables(GuessableType.Misc))}</i>
              </div>
            </div>
            {!edition && index >= bt.doneTracks && <div className="edition-buttons">
              <Button size="sm" onClick={() => startEdit(index)}>Edit</Button>
              <Button size="sm" variant="danger" onClick={() => remove(index, false)}>Delete</Button>
            </div>}
          </div>
        })
      }
    </>
  );
}

export default PlaylistEdition
