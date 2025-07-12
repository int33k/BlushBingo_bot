import React from 'react';
import type { Game } from '../types';

interface GameBingoCardProps {
  bingoCard: (number | null)[][];
  onCellClick: (row: number, col: number) => void;
  isCellInCompletedLine: (row: number, col: number) => boolean;
  currentPlayerRole: string | null;
  currentGame: Game | null;
}

const GameBingoCard: React.FC<GameBingoCardProps> = ({
  bingoCard,
  onCellClick,
  isCellInCompletedLine,
  currentPlayerRole,
  currentGame
}) => {
  const getCellStyles = (isMarked: boolean, isInLine: boolean, isClickable: boolean) => {
    const baseClasses = 'flex items-center justify-center text-lg font-bold rounded-xl transition-all duration-200 relative';
    if (isMarked) {
      return `${baseClasses} ${isInLine ? 'bg-gradient-to-br from-red-500/30 to-red-600/20 text-red-400 border-2 border-red-500/70 shadow-[0_0_10px_#EF4444]' : 'bg-gradient-to-br from-slate-600/70 to-slate-700/50 text-red-400 border border-red-500/40'}`;
    }
    return `${baseClasses} bg-gradient-to-br from-slate-700/80 to-slate-600/60 backdrop-blur-sm text-white border border-teal-400/30 ${isClickable ? 'hover:bg-gradient-to-br hover:from-slate-600/80 hover:to-slate-500/60 hover:scale-105 hover:shadow-lg cursor-pointer' : 'cursor-default'}`;
  };

  return (
    <div className="w-full max-w-[320px] mx-auto">
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/60 backdrop-blur-sm rounded-2xl p-4 border-2 border-teal-400/50 shadow-xl">
        <div className="flex justify-center items-center p-2">
          <div className="flex flex-col gap-2">
            {bingoCard.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-2">
                {row.map((cell, colIndex) => {
                  const isMarked = cell === null;
                  const isInCompletedLine = isCellInCompletedLine(rowIndex, colIndex);
                  const isClickable = currentGame?.currentTurn === currentPlayerRole && cell !== null && currentGame?.status === 'playing';
                  
                  return (
                    <div 
                      key={`${rowIndex}-${colIndex}`} 
                      onClick={() => onCellClick(rowIndex, colIndex)} 
                      className={getCellStyles(isMarked, isInCompletedLine, isClickable)}
                      style={{ width: '52px', height: '52px', minWidth: '52px', minHeight: '52px' }}
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBingoCard;
