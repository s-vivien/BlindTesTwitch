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
    return <span className="podium-stats-line">
          <span><strong>{leftText}</strong></span>
          <span>{rightText}</span>
      </span>;
  };

  const renderPlayerStats = (player: Player) => {
    return <div className="podium-stats">
      {renderStatsLine('Answers', `${player.stats.answers}`)}
      {settings.acceptanceDelay > 0 && renderStatsLine('Firsts', `${player.stats.firsts}`)}
      {renderStatsLine('Combos', `${player.stats.combos}`)}
      {renderStatsLine('Fastest', `${(player.stats.fastestAnswer / 1000).toFixed(1)} s`)}
    </div>;
  };

  const renderPlayer = (player: Player, withStats: boolean) => {
    return <div
      key={`podium-avatar-${player.tid}`}
      className="podium-player">

      {withStats &&
        renderPlayerStats(player)
      }

      <TwitchAvatar tid={player.tid} avatar={player.avatar} className="podium-avatar" />
      <span className="podium-name">{player.nick}</span>
    </div>;
  };

  const renderPodiumStep = (
    players: Player[],
    delay: number,
    withStats: boolean,
    heightPercent: number,
    svg: string,
    subtext: string,
  ) => {
    return (
      <div
        key={players[0].tid}
        className="podium-step"
        style={{ height: heightPercent + '%' }}
      >
        <motion.div
          className="podium-step-header"
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
          className="podium-bar"
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
            <img className="podium-medal" src={`/BlindTesTwitch/${svg}.svg`}></img>
          </motion.div>
          <span className="podium-subtext">{subtext}</span>
        </motion.div>
      </div>
    );
  };

  const podiumContent: PodiumStepContent[] = [];
  const players = Object.values(playerStore.players);

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
          className="podium-grid"
        >
          {loser && renderPodiumStep([loser], 0, false, 46, 'crown', 'Loser')}
          {podiumContent.map((step) => {
            return renderPodiumStep(
              step.players,
              0.5 * (podiumContent.length - 1 - step.idx),
              true,
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
        <Button size="sm" className="btn-modal-close" onClick={() => onClose()}>
          <b>Close</b>
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default Podium;
