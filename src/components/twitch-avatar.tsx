import { colors } from '../helpers';
import React from 'react';

const TwitchAvatar = ({ tid, avatar, className }: any) => {
  if (avatar) {
    return <img className={className} src={avatar} onError={({ currentTarget }) => {
      currentTarget.onerror = null;
      currentTarget.src = '/BlindTesTwitch/avatar.png';
    }} style={{ backgroundColor: colors[(+tid) % colors.length] }}>
    </img>;
  } else {
    return <div className={className} style={{ backgroundColor: colors[(+tid) % colors.length] }}></div>;
  }
};

export default TwitchAvatar;
