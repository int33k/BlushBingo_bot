import React from 'react';
import type { Game, Player } from '../types';

interface GameHeaderProps {
  currentGame: Game | null;
  currentPlayer: Player | null;
  opponent: Player | null;
  currentPlayerRole: string | null;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  currentGame,
  currentPlayer,
  opponent,
  currentPlayerRole
}) => {
  const playerAvatar = (isActive: boolean) => {
    const baseClasses = 'w-14 h-14 rounded-2xl border-2 bg-gradient-to-br from-slate-700/80 to-slate-600/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300';
    if (!isActive) return baseClasses;
    return `${baseClasses} scale-110`;
  };

  if (!currentGame) return null;

  return (
    <div className="flex justify-between items-center w-full max-w-[320px] mx-auto">
      {/* Current Player */}
      <div className="flex items-center gap-3 relative">
        {/* Static turn boundary for current player - around entire profile */}
        {currentGame.currentTurn === currentPlayerRole && (
          <div className="absolute -inset-2 bg-teal-400/10 rounded-2xl border-2 border-teal-400/40" />
        )}
        <div className="relative z-10">
          {/* Dynamic boundary for avatar only */}
          {currentGame.currentTurn === currentPlayerRole && (
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-400/30 to-cyan-400/30 rounded-2xl border-4 border-teal-400/80 animate-pulse shadow-[0_0_20px_#4FD1C5]" />
          )}
          <div 
            className={`${playerAvatar(currentGame.currentTurn === currentPlayerRole)} relative z-10`}
            style={{
              ...(currentGame.currentTurn === currentPlayerRole && {
                boxShadow: '0 0 15px #4FD1C5',
                borderColor: 'rgba(79, 209, 197, 0.5)'
              })
            }}
          >
            <span className="text-teal-400 font-bold text-lg">
              {currentPlayer?.name?.charAt(0) || 'Y'}
            </span>
          </div>
        </div>
        <div className="text-left relative z-10">
          <div className="text-white font-semibold text-sm">
            {currentPlayer?.name || 'You'}
          </div>
        </div>
      </div>

      {/* Opponent */}
      <div className="flex items-center gap-3 flex-row-reverse relative">
        {/* Static turn boundary for opponent - around entire profile */}
        {currentGame.currentTurn !== currentPlayerRole && (
          <div className="absolute -inset-2 bg-purple-400/10 rounded-2xl border-2 border-purple-400/40" />
        )}
        <div className="relative z-10">
          {/* Dynamic boundary for avatar only */}
          {currentGame.currentTurn !== currentPlayerRole && (
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-2xl border-4 border-purple-400/80 animate-pulse shadow-[0_0_20px_#8B5CF6]" />
          )}
          <div 
            className={`${playerAvatar(currentGame.currentTurn !== currentPlayerRole)} relative z-10`}
            style={{
              ...(currentGame.currentTurn !== currentPlayerRole && {
                boxShadow: '0 0 15px #8B5CF6',
                borderColor: 'rgba(139, 92, 246, 0.5)'
              })
            }}
          >
            <span className="text-purple-400 font-bold text-lg">
              {opponent?.name?.charAt(0) || 'O'}
            </span>
          </div>
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
