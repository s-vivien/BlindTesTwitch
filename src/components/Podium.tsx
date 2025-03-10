import { Button, Modal } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { Player, usePlayerStore } from './store/PlayerStore';
import TwitchAvatar from './TwitchAvatar';
import React, { useState } from 'react';

const Podium = ({ onClose }: any) => {

  const playerStore = usePlayerStore();
  const [loser, setLoser] = useState<Player | null>(null);

  class PodiumStepContent {
    players: Player[] = [];
    score: number = -1;
    rank: number = -1;
    idx: number = -1;
  }

  const computePlayer = (player: Player) => {
    return <div
      key={`podium-avatar-${player.tid}`}
      style={{ display: 'flex', flexDirection: 'column', width: '8rem', whiteSpace: 'nowrap', overflow: 'hidden' }}>
      <TwitchAvatar tid={player.tid} avatar={player.avatar} className="podium-avatar" />
      <span style={{ textAlign: 'center' }}>{player.nick}</span>
    </div>;
  };

  const computePodiumStep = (
    players: Player[],
    delay: number,
    color: string,
    heightPercent: number,
    emoji: string,
    subtext: string,
  ) => {
    return (
      <div
        key={players[0].tid}
        style={{ display: 'flex', flexDirection: 'column', placeContent: 'center', height: heightPercent + '%' }}
      >
        <motion.div
          style={{ alignSelf: 'center', marginBottom: '.25rem', display: 'flex', alignItems: 'center' }}
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              opacity: 1,
              transition: {
                delay: 1 + delay,
                duration: 0.55,
              },
            },
            hidden: { opacity: 0 },
          }}
        >
          {players.map((player) => {
            return computePlayer(player);
          })}
        </motion.div>

        <motion.div
          style={{
            placeContent: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflow: 'hidden',
            borderRadius: '.5rem',
            backgroundColor: color,
            marginBottom: -1,
            justifyContent: 'end',
            paddingBottom: '1.5rem',
          }}
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              height: '100%',
              opacity: 1,
              transition: {
                delay: delay,
                duration: 0.8,
                ease: 'easeInOut',
              },
            },
            hidden: { opacity: 0, height: 0 },
          }}
        >
          <span style={{ fontSize: 'xxx-large' }}>{emoji}</span>
          <span style={{ fontWeight: 'bold' }}>{subtext}</span>
        </motion.div>
      </div>
    );
  };

  let podiumContent: PodiumStepContent[] = [];
  let players = Object.values(playerStore.players);

  for (let rank = 1; rank <= 3; rank++) {
    const step = new PodiumStepContent();
    step.players = players.filter((player) => player.rank === rank);
    if (step.players.length > 0) {
      step.rank = rank;
      step.score = step.players[0].score;
      step.idx = podiumContent.length;
      if (podiumContent.length % 2 === 0) {
        podiumContent.push(step);
      } else {
        podiumContent.unshift(step);
      }
    }
  }

  const losers = Object.values(playerStore.players).filter(player => player.score > 0 && !podiumContent.find(pc => pc.players.includes(player)));

  const pickLoser = () => {
    const loser = losers[Math.floor(Math.random() * losers.length)];
    if (losers.length > 0) {
      setLoser(loser);
    }
  };

  return (
    <Modal scrollable={true} show={true} centered dialogClassName="podium-modal">
      <Modal.Body>
        <motion.div
          layout
          style={{
            display: 'grid',
            gridAutoFlow: 'column dense',
            gap: '.5rem',
            marginTop: '2rem',
            justifyContent: 'center',
            justifyItems: 'center',
            alignItems: 'flex-end',
            height: '30rem',
            width: 'fit-content',
            margin: 'auto',
            paddingLeft: '6rem',
            paddingRight: '6rem',
            paddingTop: '15px',
          }}
        >
          {loser && computePodiumStep([loser], 0, '#474747FF', 60, '👑', 'Loser')}
          {podiumContent.map((step) => {
            return computePodiumStep(
              step.players,
              0.5 * (podiumContent.length - 1 - step.idx),
              '#737373FF',
              (100 - 10 * (step.rank - 1)),
              ['🥇', '🥈', '🥉'][step.rank - 1],
              `${step.score} point${step.score > 1 ? 's' : ''}`,
            );
          })}
        </motion.div>
      </Modal.Body>
      <Modal.Footer>
        {losers.length > 0 &&
          <Button size="sm" className="mr-2 edition-form-left-buttons" variant="secondary" onClick={pickLoser}>
            <b>Pick random loser</b>
          </Button>
        }
        <Button size="sm" style={{ color: 'white', width: '60px' }} onClick={() => onClose()}>
          <b>Close</b>
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default Podium;
