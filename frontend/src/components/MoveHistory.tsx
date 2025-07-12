import React, { useRef, useEffect } from 'react';

interface Move {
  playerId?: string;
  number: number;
  value: number;
}

interface MoveHistoryProps {
  moveHistory: Move[];
  currentPlayerId?: string;
}

const MoveHistory: React.FC<MoveHistoryProps> = ({
  moveHistory,
  currentPlayerId
}) => {
  const movesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = movesContainerRef.current;
    if (container) {
      setTimeout(() => container.scrollLeft = container.scrollWidth, 50);
    }
  }, [moveHistory]);

  return (
    <div className="w-full max-w-[320px] mx-auto">
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/60 backdrop-blur-sm rounded-2xl p-4 border border-teal-400/30 shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-teal-400 font-semibold text-sm">Move History</h3>
          <div className="text-teal-400/70 text-xs">
            {moveHistory.length} moves
          </div>
        </div>
        <div 
          ref={movesContainerRef} 
          className="flex gap-2 overflow-x-auto scrollbar-hide h-12 items-center" 
          style={{ scrollBehavior: 'smooth' }}
        >
          {moveHistory.length > 0 ? moveHistory.map((move, index) => {
            const isUserMove = move.playerId === currentPlayerId;
            const color = isUserMove ? '#4FD1C5' : '#8B5CF6';
            const shadowColor = isUserMove ? 'rgba(79, 209, 197, 0.4)' : 'rgba(139, 92, 246, 0.4)';
            return (
              <div 
                key={index} 
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border-2 backdrop-blur-sm transition-all duration-200 hover:scale-105" 
                style={{ 
                  color, 
                  backgroundColor: 'rgba(15,23,42,0.8)', 
                  borderColor: color, 
                  boxShadow: `0 0 8px ${shadowColor}` 
                }}
              >
                {move.value || move.number}
              </div>
            );
          }) : (
            <div className="text-teal-400/60 text-sm italic w-full text-center py-2">
              No moves yet - game starting soon!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoveHistory;
