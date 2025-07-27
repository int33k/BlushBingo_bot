import React from 'react';
import type { Game } from '../types';

interface GameBingoCardProps {
  bingoCard: (number | null)[][];
  onCellClick: (row: number, col: number) => void;
  isCellInCompletedLine: (row: number, col: number) => boolean;
  currentPlayerRole: string | null;
  currentGame: Game | null;
  className?: string;
  cellPadding?: string;
}

const GameBingoCard: React.FC<GameBingoCardProps> = ({
  bingoCard,
  onCellClick,
  isCellInCompletedLine,
  currentPlayerRole,
  currentGame,
  className = '',
  cellPadding = 'py-3 px-2'
}) => {
  const getCellStyles = (isMarked: boolean, isInLine: boolean, isClickable: boolean) => {
    const baseClasses = `flex items-center justify-center text-lg font-bold rounded-xl transition-all duration-200 relative ${cellPadding}`;
    if (isMarked) {
      return `${baseClasses} ${isInLine ? 'bg-gradient-to-br from-red-500/30 to-red-600/20 text-red-400 border-2 border-red-500/70 shadow-[0_0_10px_#EF4444]' : 'bg-gradient-to-br from-slate-600/70 to-slate-700/50 text-red-400 border border-red-500/40'}`;
    }
    return `${baseClasses} bg-gradient-to-br from-slate-700/80 to-slate-600/60 backdrop-blur-sm text-white border border-teal-400/30 ${isClickable ? 'hover:bg-gradient-to-br hover:from-slate-600/80 hover:to-slate-500/60 hover:scale-105 hover:shadow-lg cursor-pointer' : 'cursor-default'}`;
  };

  return (
    <div
      className={`w-full max-w-[360px] aspect-square mx-auto ${className}`.trim()}
      style={{ position: 'relative' }}
    >
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/60 backdrop-blur-sm rounded-2xl border-2 border-teal-400/50 shadow-xl w-full h-full aspect-square flex items-center justify-center p-[2vw]">
        <div className="w-full h-full flex flex-col justify-center items-center">
          <div className="grid grid-rows-5 grid-cols-5 gap-[1vw] w-full h-full">
            {bingoCard.flat().map((cell, idx) => {
              const rowIndex = Math.floor(idx / 5);
              const colIndex = idx % 5;
              const isMarked = cell === null;
              const isInCompletedLine = isCellInCompletedLine(rowIndex, colIndex);
              const isClickable = currentGame?.currentTurn === currentPlayerRole && cell !== null && currentGame?.status === 'playing';
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => onCellClick(rowIndex, colIndex)}
                  className={getCellStyles(isMarked, isInCompletedLine, isClickable)}
                  style={{
                    width: '100%',
                    height: '100%',
                    minWidth: 0,
                    minHeight: 0,
                    borderRadius: '1rem'
                  }}
                >
                  {isMarked ? (
                    <div className="text-2xl font-bold text-red-400 flex items-center justify-center w-full h-full">/</div>
                  ) : (
                    <span className="text-lg font-bold flex items-center justify-center w-full h-full">{cell}</span>
                  )}
                  {isInCompletedLine && isMarked && (
                    <div className="absolute inset-0 bg-red-500/10 border border-red-500/50 rounded-xl backdrop-blur-sm" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBingoCard;
