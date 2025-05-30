import React from 'react';
import type { Player } from '../types';

interface PlayerCardProps {
  player?: Player;
  isCurrentUser?: boolean;
  className?: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isCurrentUser = false,
  className = ''
}) => {
  const getStatusColor = (status?: string, connected?: boolean) => {
    // If player doesn't exist, they haven't joined yet
    if (!player) return 'text-gray-400';
    // If player exists but not connected, they're disconnected
    if (player && connected === false) return 'text-orange-400';

    switch (status) {
      case 'ready': return 'text-green-400';
      case 'waiting': return 'text-orange-400';
      case 'playing': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status?: string, connected?: boolean) => {
    // If player doesn't exist, they haven't joined yet
    if (!player) return 'Not joined yet';
    // If player exists but not connected, they're disconnected
    if (player && connected === false) return 'Disconnected';

    switch (status) {
      case 'ready': return 'Ready';
      case 'waiting': return 'Filling card...';
      case 'playing': return 'Playing';
      default: return 'Waiting...';
    }
  };

  const getCardColor = () => {
    if (isCurrentUser) {
      return 'bg-teal-600/20 border-teal-400';
    } else {
      return 'bg-purple-600/20 border-purple-400';
    }
  };

  const getAvatarColor = () => {
    return isCurrentUser ? 'bg-teal-500' : 'bg-purple-500';
  };

  const getInitials = (name?: string) => {
    if (!name) return isCurrentUser ? 'Y' : 'O';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className={`player-card ${getCardColor()} border-2 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-full ${getAvatarColor()} flex items-center justify-center text-white font-bold text-sm`}>
            {getInitials(player?.name || (isCurrentUser ? 'You' : 'Opponent'))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white truncate text-sm">
            {player?.name || (isCurrentUser ? 'You' : 'Opponent')}
          </div>
          <div className={`text-xs ${getStatusColor(player?.status, player?.connected)}`}>
            {getStatusText(player?.status, player?.connected)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
