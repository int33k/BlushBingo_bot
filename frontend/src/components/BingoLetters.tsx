import React from 'react';
import { BINGO_LETTERS } from '../shared-adapter';

interface BingoLettersProps {
  activeLetters: boolean[];
  markedLetters: boolean[];
  onLetterClick: (index: number) => void;
}

const BingoLetters: React.FC<BingoLettersProps> = ({
  activeLetters,
  markedLetters,
  onLetterClick
}) => {
  return (
    <div className="w-full max-w-[320px] mx-auto">
      <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm rounded-2xl p-4 border border-red-500/30 shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-red-400 font-semibold text-sm">BINGO Progress</h3>
          <div className="text-red-400/70 text-xs">
            Click when lines complete!
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {BINGO_LETTERS.map((letter: string, idx: number) => {
            const active = activeLetters[idx]; 
            const marked = markedLetters[idx];
            const isClickable = active && !marked;
            
            return (
              <div 
                key={letter} 
                onClick={() => isClickable && onLetterClick(idx)} 
                className={`text-center py-3 rounded-xl font-bold text-xl transition-all duration-300 relative border-2 backdrop-blur-sm ${
                  active ? (
                    marked ? 
                      'text-red-400 bg-gradient-to-br from-red-500/30 to-red-600/20 border-red-500 shadow-[0_0_15px_#EF4444]' : 
                      'text-red-400 border-red-500/50 bg-gradient-to-br from-red-500/10 to-red-600/5 hover:bg-gradient-to-br hover:from-red-500/20 hover:to-red-600/10 cursor-pointer hover:scale-105 hover:shadow-lg'
                  ) : 'text-red-400/40 border-red-500/20 bg-gradient-to-br from-slate-700/30 to-slate-600/20'
                }`}
              >
                {letter}
                {active && !marked && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                    {idx + 1}
                  </div>
                )}
                {marked && (
                  <div className="absolute inset-0 flex items-center justify-center text-red-400 text-4xl font-bold">
                    /
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BingoLetters;
