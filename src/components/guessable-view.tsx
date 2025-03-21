import { Guessable, GuessableState, GuessableType } from './store/blind-test-tracks-store';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const DISPLAYED_GUESS_NICK_LIMIT = 5;

type Guesser = {
  nick: string,
  points: number
}

export type Guess = {
  guessable: Guessable,
  guessed: boolean,
  guessedBy: Guesser[]
};

const crossEmoji = <FontAwesomeIcon color="#de281b" icon={['fas', 'times']} size="lg" />;
const bubbleEmoji = <FontAwesomeIcon icon={['far', 'comment']} size="lg" />;
const checkEmoji = <FontAwesomeIcon color="var(--icon-green-color)" icon={['fas', 'check']} size="lg" />;
const lockEmoji = <FontAwesomeIcon color="var(--icon-blue-color)" icon={['fas', 'lock']} size="lg" />;

const labelPerType: Record<GuessableType, string> = {
  [GuessableType.Title]: 'TITLE',
  [GuessableType.Artist]: 'ARTIST(S)',
  [GuessableType.Misc]: 'MISC',
};

type GuessViewProps = {
  type: GuessableType;
  guesses: Guess[];
  previewGuessNumber: boolean;
};

const GuessView = (props: GuessViewProps) => {
  if (props.guesses.length === 0) {
    return null;
  }
  return <div className="px-3 pb-3">
    <div className="bt-h">
      <h2>{labelPerType[props.type]}</h2>
    </div>
    <div>
      {
        props.guesses.map((guess, index) => {
          const guessable: Guessable = guess.guessable;

          let guessContent;

          if (guess.guessed) {
            guessContent = (
              <>
                <div className="bt-guess" title={guessable.toGuess[0]}>
                  {guess.guessedBy.length > 0 ? checkEmoji : (guessable.state !== GuessableState.Enabled ? lockEmoji : crossEmoji)} {guessable.original}
                </div>
                {guess.guessedBy.length > 0 && (
                  <div className="bt-gb">
                    {bubbleEmoji}&nbsp;
                    {guess.guessedBy.slice(0, DISPLAYED_GUESS_NICK_LIMIT).map((gb, i) => (
                      <span key={`gb_${i}`}>{i > 0 && <>, </>}{gb.nick} <b>[+{gb.points}]</b></span>
                    ))}
                    {guess.guessedBy.length > DISPLAYED_GUESS_NICK_LIMIT && (
                      <span>, and {guess.guessedBy.length - DISPLAYED_GUESS_NICK_LIMIT} more</span>
                    )}
                  </div>
                )}
              </>
            );
          } else if (guess.guessedBy.length > 0 && props.previewGuessNumber) {
            guessContent = (
              <>
                {checkEmoji}
                <div className="bt-guess">
                  &nbsp;Guessed by <b>{guess.guessedBy.length}</b> player{guess.guessedBy.length > 1 ? 's' : ''}
                </div>
              </>
            );
          } else {
            guessContent = (
              <>
                {crossEmoji}
                <div className="bt-guess" style={{ fontWeight: 'bold' }}>&nbsp;?</div>
              </>
            );
          }

          return <div key={`guess_${props.type}_${index}`} className="mb-3">{guessContent}</div>;
        })
      }
    </div>
  </div>;
};

export default GuessView;