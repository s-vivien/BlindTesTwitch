import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'framer-motion';
import React, { memo, useMemo, useState } from 'react';
import { Button, FormControl } from 'react-bootstrap';
import { usePlayerStore } from './store/player-store';
import TwitchAvatar from './twitch-avatar';

type LeaderboardRow = {
  nick: string,
  displayedRank?: number,
  score: number,
  tid: string,
  avatar?: string
};

const DISPLAYED_USER_LIMIT = 100;

const Leaderboard = memo(() => {

  const playerStore = usePlayerStore();

  const [nickFilter, setNickFilter] = useState('');

  const filteredAndSortedLeaderboardRows = useMemo(() => {
    let rows: LeaderboardRow[] = Object.values(playerStore.players).map(player => ({
      nick: player.nick,
      score: player.score,
      tid: player.tid,
      avatar: player.avatar,
      displayedRank: player.rank,
    }));

    if (nickFilter) {
      rows = rows.filter(s => s.nick.toLowerCase().includes(nickFilter));
    }

    rows.sort((a, b) => a.nick.localeCompare(b.nick));
    rows.sort((a, b) => b.score - a.score);

    for (let i = rows.length - 1; i > 0; i--) {
      if (rows[i].score === rows[i - 1].score) {
        rows[i].displayedRank = undefined;
      }
    }

    return rows;
  }, [nickFilter, playerStore]);

  const addPointToPlayer = (nick: string, points: number) => {
    playerStore.addPoints(nick, points);
  };

  const onNickFilterChange = (e: any) => {
    setNickFilter(e.target.value.toLowerCase());
  };

  return (
    <div id="leaderboard" className="p-3 bt-panel border rounded-3">
      <FormControl value={nickFilter} className={'mb-2'} type="text" role="searchbox" placeholder="Nick filter" size="sm" onChange={onNickFilterChange} />
      <table className="table-hover bt-t">
        <thead>
        <tr>
          <th style={{ width: '10%', textAlign: 'center' }}>#</th>
          <th style={{ width: '12%' }}></th>
          <th style={{ width: '61%' }}>Nick</th>
          <th style={{ width: '17%', textAlign: 'center' }}>Score</th>
        </tr>
        </thead>
        <tbody>
        <AnimatePresence>
          {filteredAndSortedLeaderboardRows.slice(0, DISPLAYED_USER_LIMIT).map((sc) => (
            <motion.tr
              key={sc.nick}
              className="leaderboard-row"
              initial={{ opacity: 0, top: -20 }}
              animate={{ opacity: 1, top: 0 }}
              exit={{ opacity: 0, top: 20 }}
              transition={{ duration: 0.3 }}
              layout="position"
            >
              <td style={{ textAlign: 'center' }}>
                <span>{sc.displayedRank}</span>
              </td>
              <td>
                <TwitchAvatar tid={sc.tid} avatar={sc.avatar} className="leaderboard-avatar" />
              </td>
              <td style={{ position: 'relative' }}>
                <span className="leaderboard-nick">{sc.nick}</span>
                <div className="leaderboard-buttons">
                  <Button type="submit" size="sm" onClick={() => addPointToPlayer(sc.nick, -1)}>
                    <FontAwesomeIcon icon={['fas', 'minus']} size="lg" />
                  </Button>
                  <Button type="submit" size="sm" onClick={() => addPointToPlayer(sc.nick, 1)}>
                    <FontAwesomeIcon icon={['fas', 'plus']} size="lg" />
                  </Button>
                </div>
              </td>
              <td style={{ textAlign: 'center' }}>
                <span>{sc.score}</span>
              </td>
            </motion.tr>
          ))}
          {filteredAndSortedLeaderboardRows.length > DISPLAYED_USER_LIMIT &&
            <tr style={{ textAlign: 'center' }}>
              <td colSpan={4}><span><i>...{filteredAndSortedLeaderboardRows.length - DISPLAYED_USER_LIMIT} more players</i></span></td>
            </tr>
          }
        </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
});

export default Leaderboard;
