import React from 'react';
import type { Game } from '../types';

interface BingoButtonProps {
  currentGame: Game | null;
  markedLetters: boolean[];
  onBingoStop: () => void;
  className?: string;
}

const BingoButton: React.FC<BingoButtonProps> = ({
  currentGame,
  markedLetters,
  onBingoStop,
  className = ''
}) => {
  const canCallBingo = currentGame?.status === 'playing' && markedLetters.filter(Boolean).length >= 5;

  return (
    <div className={`w-full max-w-[360px] mx-auto ${className}`.trim()}>
      <button 
        type="button"
        onClick={onBingoStop} 
        className={`w-full py-4 text-white text-2xl font-bold rounded-2xl transition-all duration-300 ${
          canCallBingo
            ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-[0_0_20px_#EF4444] hover:shadow-[0_0_30px_#EF4444] animate-pulse cursor-pointer hover:scale-105' 
            : 'bg-gradient-to-r from-red-900/40 to-red-800/40 text-red-400/60 cursor-not-allowed opacity-70 border-2 border-red-700/30 shadow-inner backdrop-blur-sm'
        }`}
      >
        <span className={`flex items-center justify-center gap-2 ${
          !canCallBingo ? 'filter grayscale' : ''
        }`}>
          BINGO STOP
        </span>
      </button>
    </div>
  );
};

export default BingoButton;
