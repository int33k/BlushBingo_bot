import React from 'react';
import type { Game, Player } from '../types';

interface GameHeaderProps {
  currentGame: Game | null;
  currentPlayer: Player | null;
  opponent: Player | null;
  currentPlayerRole: string | null;
}

const GameHeader: React.FC<GameHeaderProps> = (props) => {
  const { currentGame, currentPlayer, opponent, currentPlayerRole } = props;
  // Debug: Log photoUrl for both players in header
  // console.log('[PHOTOURL FLOW] GameHeader:', {
  //   currentPlayerPhotoUrl: currentPlayer?.photoUrl,
  //   opponentPhotoUrl: opponent?.photoUrl
  // });
  // Helper to check for valid photoUrl
  const isValidPhotoUrl = (url?: string) => {
    if (!url || typeof url !== 'string') return false;
    if (url.trim() === '' || url.trim().toLowerCase() === 'null') return false;
    return /^https?:\/\//.test(url);
  };
  const playerAvatar = (isActive: boolean) => {
    const baseClasses = 'w-14 h-14 rounded-2xl border-2 bg-gradient-to-br from-slate-700/80 to-slate-600/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300';
    if (!isActive) return baseClasses;
    return `${baseClasses} scale-110`;
  };

  if (!currentGame) return null;

  return (
    <div
      className="flex justify-between items-center w-full mx-auto"
      style={{ maxWidth: '360px', minHeight: '8vh', margin: '0 auto', paddingTop: '2vh', paddingBottom: '2vh' }}
    >
      {/* Current Player */}
      <div className="flex items-center gap-3 flex-1 min-w-0 relative">
        {currentGame.currentTurn === currentPlayerRole && (
          <div className="absolute -inset-2 bg-teal-400/10 rounded-2xl border-2 border-teal-400/40" />
        )}
        <div className="relative z-10">
          {currentGame.currentTurn === currentPlayerRole && (
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-400/30 to-cyan-400/30 rounded-2xl border-4 border-teal-400/80 animate-pulse shadow-[0_0_20px_#4FD1C5]" />
          )}
          {isValidPhotoUrl(currentPlayer?.photoUrl) ? (
            <img
              src={currentPlayer?.photoUrl}
              alt={currentPlayer?.name || 'You'}
              className={`${playerAvatar(currentGame.currentTurn === currentPlayerRole)} object-cover relative z-10`}
              style={{ width: '56px', height: '56px', borderRadius: '1rem' }}
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          ) : (
            <div className={`${playerAvatar(currentGame.currentTurn === currentPlayerRole)} relative z-10`}>
              <span className="text-teal-400 font-bold text-lg">
                {currentPlayer?.name?.charAt(0) || 'Y'}
              </span>
            </div>
          )}
        </div>
        <div className="text-left relative z-10">
          <div className="text-white font-semibold text-sm">
            {currentPlayer?.name || 'You'}
          </div>
        </div>
      </div>

      {/* Opponent */}
      <div className="flex items-center gap-3 flex-1 min-w-0 flex-row-reverse relative">
        {currentGame.currentTurn !== currentPlayerRole && (
          <div className="absolute -inset-2 bg-purple-400/10 rounded-2xl border-2 border-purple-400/40" />
        )}
        <div className="relative z-10">
          {currentGame.currentTurn !== currentPlayerRole && (
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-2xl border-4 border-purple-400/80 animate-pulse shadow-[0_0_20px_#8B5CF6]" />
          )}
          {isValidPhotoUrl(opponent?.photoUrl) ? (
            <img
              src={opponent?.photoUrl}
              alt={opponent?.name || 'Opponent'}
              className={`${playerAvatar(currentGame.currentTurn !== currentPlayerRole)} object-cover relative z-10`}
              style={{ width: '56px', height: '56px', borderRadius: '1rem' }}
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          ) : (
            <div className={`${playerAvatar(currentGame.currentTurn !== currentPlayerRole)} relative z-10`}>
              <span className="text-purple-400 font-bold text-lg">
                {opponent?.name?.charAt(0) || 'O'}
              </span>
            </div>
          )}
        </div>
        <div className="text-right relative z-10">
          <div className="text-white font-semibold text-sm">
            {opponent?.name || 'Opponent'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
