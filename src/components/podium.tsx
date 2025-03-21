import { Button, Modal } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { Player, usePlayerStore } from './store/player-store';
import TwitchAvatar from './twitch-avatar';
import React, { useState } from 'react';
import { useSettingsStore } from './store/settings-store';

const Podium = ({ onClose }: any) => {

  const playerStore = usePlayerStore();
  const settings = useSettingsStore();
  const [loser, setLoser] = useState<Player | null>(null);

  class PodiumStepContent {
    players: Player[] = [];
    score: number = -1;
    rank: number = -1;
    idx: number = -1;
  }

  const renderStatsLine = (leftText: string, rightText: string) => {
    return <span style={{ display: 'flex', justifyContent: 'space-between', margin: 'auto' }}>
          <span style={{ textAlign: 'left' }}><strong>{leftText}</strong></span>
          <span style={{ textAlign: 'right' }}>{rightText}</span>
      </span>;
  };

  const renderPlayerStats = (player: Player) => {
    return <div style={{ border: '3px dashed #4A4A4AFF', padding: '10px 15px', borderRadius: '.5rem', margin: '5px 5px 14px 0' }}>
      {renderStatsLine('Answers', `${player.stats.answers}`)}
      {settings.acceptanceDelay > 0 && renderStatsLine('Firsts', `${player.stats.firsts}`)}
      {renderStatsLine('Combos', `${player.stats.combos}`)}
      {renderStatsLine('Fastest', `${(player.stats.fastestAnswer / 1000).toFixed(1)} s`)}
    </div>;
  };

  const renderPlayer = (player: Player, withStats: boolean) => {
    return <div
      key={`podium-avatar-${player.tid}`}
      style={{ display: 'flex', flexDirection: 'column', width: '12rem', whiteSpace: 'nowrap', overflow: 'hidden' }}>

      {withStats &&
        renderPlayerStats(player)
      }

      <TwitchAvatar tid={player.tid} avatar={player.avatar} className="podium-avatar" />
      <span style={{ textAlign: 'center' }}>{player.nick}</span>
    </div>;
  };

  const renderPodiumStep = (
    players: Player[],
    delay: number,
    withStats: boolean,
    color: string,
    heightPercent: number,
    svg: string,
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
            return renderPlayer(player, withStats);
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
          <motion.div
            animate={{ rotate: [0, 5, -5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }}
            transition={{ delay: Math.random() * 2, repeat: Infinity, duration: 2, ease: 'easeInOut' }}>
            <img style={{ width: '5rem', filter: 'drop-shadow(5px 5px 3px #222)' }} src={`/BlindTesTwitch/${svg}.svg`}></img>
          </motion.div>
          <span style={{ fontWeight: 'bold', fontSize: 'larger' }}>{subtext}</span>
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
          style={{
            display: 'grid',
            gridAutoFlow: 'column dense',
            gap: '.5rem',
            marginTop: '2rem',
            justifyContent: 'center',
            justifyItems: 'center',
            alignItems: 'flex-end',
            height: '41rem',
            width: 'fit-content',
            margin: 'auto',
            paddingLeft: '6rem',
            paddingRight: '6rem',
            paddingTop: '15px',
          }}
        >
          {loser && renderPodiumStep([loser], 0, false, '#656565', 46, 'crown', 'Loser')}
          {podiumContent.map((step) => {
            return renderPodiumStep(
              step.players,
              0.5 * (podiumContent.length - 1 - step.idx),
              true,
              '#656565',
              (100 - 10 * (step.rank - 1)),
              ['gold', 'silver', 'bronze'][step.rank - 1],
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
