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
  const [avatarError, setAvatarError] = React.useState(false);
  // Helper to check for valid photoUrl
  const isValidPhotoUrl = (url?: string) => {
    if (!url || typeof url !== 'string') return false;
    if (url.trim() === '' || url.trim().toLowerCase() === 'null') return false;
    // Optionally, check for valid URL format
    return /^https?:\/\//.test(url);
  };
  const getStatusColor = (status?: string, connected?: boolean) => {
    if (!player) return 'text-slate-400';
    if (player && connected === false) return 'text-orange-400';

    switch (status) {
      case 'ready': return 'text-emerald-400';
      case 'waiting': return 'text-amber-400';
      case 'playing': return 'text-blue-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusText = (status?: string, connected?: boolean) => {
    if (!player) return 'Waiting 4 player...';
    if (player && connected === false) return (
      <>
        Dis -
        <br />
        connected
      </>
    );

    switch (status) {
      case 'ready': return 'Ready to play!';
      case 'waiting': return (
        <>
          Setting
          <br />
          up card...
        </>
      );
      case 'playing': return 'Playing';
      default: return 'Preparing...';
    }
  };

  const getCardStyles = () => {
    const baseStyles = 'relative bg-gradient-to-br backdrop-blur-sm rounded-2xl p-4 border-2 transition-all duration-300 shadow-xl overflow-hidden';
    
    if (isCurrentUser) {
      return `${baseStyles} from-teal-500/10 via-teal-400/5 to-teal-500/10 border-teal-400/50 shadow-teal-400/20 hover:shadow-teal-400/30`;
    } else {
      return `${baseStyles} from-purple-500/10 via-purple-400/5 to-purple-500/10 border-purple-400/50 shadow-purple-400/20 hover:shadow-purple-400/30`;
    }
  };

  const getAvatarStyles = () => {
    const baseStyles = 'w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all duration-300';
    
    if (isCurrentUser) {
      return `${baseStyles} bg-gradient-to-br from-teal-500 to-teal-600 shadow-teal-400/50`;
    } else {
      return `${baseStyles} bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-400/50`;
    }
  };

  const getStatusIndicator = (status?: string, connected?: boolean) => {
    if (!player) return '⏳';
    if (player && connected === false) return '⚠️';
    
    switch (status) {
      case 'ready': return '✅';
      case 'waiting': return '⏳';
      case 'playing': return '🎮';
      default: return '⏳';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return isCurrentUser ? 'Y' : '?';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className={`${getCardStyles()} ${className}`}>
      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r opacity-30 blur-lg ${
        isCurrentUser ? 'from-teal-400/20 to-teal-500/20' : 'from-purple-400/20 to-purple-500/20'
      }`} />

      {/* Content */}
      <div className="relative z-10 flex items-center space-x-3">
        <div className="flex-shrink-0">
          {
            isValidPhotoUrl(player?.photoUrl) && !avatarError
              ? (
                  <img
                    src={player?.photoUrl}
                    alt={player?.name || 'Player'}
                    className={getAvatarStyles() + ' object-cover'}
                    style={{ width: '48px', height: '48px', borderRadius: '1rem' }}
                    onError={() => setAvatarError(true)}
                  />
                )
              : (
                  <div className={getAvatarStyles()}>
                    {getInitials(player?.name || (isCurrentUser ? 'You' : 'Opponent'))}
                  </div>
                )
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <div className="font-bold text-white truncate text-base">
              {player?.name || (isCurrentUser ? 'You' : 'Opponent')}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs">{getStatusIndicator(player?.status, player?.connected)}</span>
            <div className={`text-xs font-medium ${getStatusColor(player?.status, player?.connected)}`}>
              {getStatusText(player?.status, player?.connected)}
            </div>
          </div>
        </div>
      </div>

      {/* Status glow animation for ready state */}
      {player?.status === 'ready' && (
        <div className="absolute inset-0 rounded-2xl bg-emerald-400/10 animate-pulse" />
      )}
    </div>
  );
};

export default PlayerCard;
