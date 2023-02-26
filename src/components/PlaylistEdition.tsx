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
  // const [showAcceptedValues, setShowAcceptedValues] = useState(false);
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

  const renderGuessables = (guessables: Guessable[], showAcceptedValues: boolean = false) => {
    if (guessables.length === 0) return <></>
    return guessables.map<React.ReactNode>(g => {
      const value = showAcceptedValues ? g.toGuess : g.original;
      return g.disabled ? <del>{value}</del> : <>{value}</>;
    }).reduce((prev, curr) => [prev, ', ', curr]);
  }

  const popoverHelp = (
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

  const popoverCleanedValues = (
    <Popover id="popover-cleaned-values">
      <Popover.Body>
        This page displays the playlist tracks. For each of them, the track values (title/artist(s)) are displayed on the left, and the associated cleaned values on the right.
        <br></br>
        <br></br>
        <u><b>What does "cleaned" mean ?</b></u>
        <br></br>
        The bot cleans the values by removing accents, extra-characters, extra-information, etc.
        <br></br>
        It keeps the simplest value possible.
        <br></br>
        <br></br>
        The same cleaning process is applied to every chat answer before comparison.
        <br></br>
        <br></br>
        Sometimes, the cleaning procedure isn't perfect so it's important to manually check for the cleaned values in order to avoid "impossible" guesses.
        <br></br>
        <br></br>
        In such cases, feel free to <b>EDIT</b> the values to correct them.
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
          <Button style={{ width: "65px" }} size="sm" className="mr-2" onClick={restart}>
            <b>Yes</b>
          </Button>
          <Button style={{ width: "65px" }} variant="secondary" size="sm" onClick={() => setRestartModal(false)}>
            <b>Cancel</b>
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={removeTrackModal} centered>
        <Modal.Body>
          Do you really want to remove this track ?
        </Modal.Body>
        <Modal.Footer>
          <Button style={{ width: "65px" }} size="sm" className="mr-2" onClick={() => remove(selectedIndex, true)}>
            <b>Yes</b>
          </Button>
          <Button style={{ width: "65px" }} variant="secondary" size="sm" onClick={() => setRemoveTrackModal(false)}>
            <b>Cancel</b>
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={edition} centered size="lg">
        <Form noValidate validated={validated} onSubmit={validateEdit} style={{ flex: 1 }}>
          <Modal.Body style={{ paddingTop: 0 }}>
            <Form.Group as={Row} controlId="formHeader" className='edition-form-header'>
              <Form.Label column sm={1}>
              </Form.Label>
              <Form.Label column sm={1}>
                <b>Type</b>
              </Form.Label>
              <Form.Label column sm={5}>
                <b>Value</b>
              </Form.Label>
              <Form.Label column sm={5}>
                <b>Accepted value</b>
              </Form.Label>
            </Form.Group>

            {editedValues.map((guessable, index) => {
              return <Form.Group as={Row} controlId={"formRow" + index} className="mt-2">
                <Form.Label column sm={1}>
                  {guessable.type === GuessableType.Misc && <FontAwesomeIcon onClick={() => removeExtraGuessable(index)} icon={['fas', 'trash']} size="lg" />}
                  {guessable.type !== GuessableType.Misc && <input type="checkbox" className="larger" checked={!guessable.disabled} onChange={(e) => { updateDisabled(index, e.target.checked) }} />}
                </Form.Label>
                <Form.Label column sm={1}>
                  {GuessableType[guessable.type]}
                </Form.Label>
                <Col sm={5}>
                  <Form.Control required disabled={guessable.disabled} value={guessable.value} onChange={(e) => { updateValue(index, e.target.value) }} type="text" placeholder="Enter value" />
                </Col>
                <Form.Label className="code" column sm={5}>
                  {cleanValue(guessable.value)}
                </Form.Label>
              </Form.Group>
            })}
          </Modal.Body>
          <Modal.Footer style={{ paddingTop: 0 }}>
            <OverlayTrigger
              placement="right"
              delay={{ show: 100, hide: 250 }}
              overlay={popoverHelp}
            >
              <FontAwesomeIcon icon={['fas', 'circle-info']} style={{ fontSize: "1.95rem" }} />
            </OverlayTrigger>
            <Button size="sm" className="mr-2 edition-form-left-buttons" variant="primary" onClick={addExtraGuessable}>
              <b>Add value</b>
            </Button>
            <Button style={{ width: "65px" }} size="sm" className="mr-2" variant="primary" type="submit">
              <b>Save</b>
            </Button>
            <Button style={{ width: "65px" }} size="sm" className="mr-2" variant="secondary" onClick={endEdit}>
              <b>Cancel</b>
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <div className="playlist-load-button mb-2">
        <Button id="selectList" type="submit" onClick={() => setRestartModal(true)}>
          <b>Load another playlist from Spotify</b>
        </Button>
      </div>

      <table className="table-hover edition-table">
        <thead>
          <tr>
            <th style={{ width: "6%" }}></th>
            <th style={{ width: "7%", textAlign: 'center' }}>Cover</th>
            <th style={{ width: "36%" }} className={"px-3"}>Values</th>
            <th style={{ width: "36%" }} className={"px-3"}>Cleaned values <OverlayTrigger
              placement="right"
              delay={{ show: 100, hide: 250 }}
              overlay={popoverCleanedValues}
            >
              <FontAwesomeIcon icon={['fas', 'circle-info']} className="ml-2" />
            </OverlayTrigger></th>
            <th style={{ width: "15%", textAlign: 'center'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {
            bt.tracks.map((track, index) => {
              return <tr className={"p-1 edition-row " + (index < bt.doneTracks ? "edition-row-disabled" : "")} key={"track-" + track.offset}>
                <td className="edition-row-number">
                  #{1 + index}
                </td>
                <td id="cover">
                  <img className="edition-cover" id="cover-image" src={track.img} alt="cover" />
                </td>
                <td style={{ flex: 1 }} className={"px-3"}>
                  <div>
                    <b>{renderGuessables(track.getGuessables(GuessableType.Title))}</b>
                  </div>
                  <div>
                    {renderGuessables(track.getGuessables(GuessableType.Artist))}
                  </div>
                  <div>
                    {renderGuessables(track.getGuessables(GuessableType.Misc))}
                  </div>
                </td>
                <td style={{ flex: 1 }} className={"px-3 code"}>
                  <div>
                    <b>{renderGuessables(track.getGuessables(GuessableType.Title), true)}</b>
                  </div>
                  <div>
                    {renderGuessables(track.getGuessables(GuessableType.Artist), true)}
                  </div>
                  <div>
                    {renderGuessables(track.getGuessables(GuessableType.Misc), true)}
                  </div>
                </td>
                {index >= bt.doneTracks && <td className="edition-buttons">
                  <Button size="sm" variant="outline-secondary" onClick={() => startEdit(index)}><b>Edit</b></Button>
                  <Button size="sm" variant="outline-danger" onClick={() => remove(index, false)}><b>Delete</b></Button>
                </td>}
                {index < bt.doneTracks && <td className="edition-buttons">
                  <span>DONE</span>
                </td>}
              </tr>
            })
          }
        </tbody>
      </table>
    </>
  );
}

export default PlaylistEdition

