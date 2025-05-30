import React, { useState, useEffect } from 'react';

interface Player {
  id: string;
  name: string;
}

interface PlayerSelectionOverlayProps {
  currentPlayer: Player;
  opponent: Player;
  firstPlayerId: string;
  onFinish?: () => void;
}

const PlayerSelectionOverlay: React.FC<PlayerSelectionOverlayProps> = ({
  currentPlayer,
  opponent,
  firstPlayerId,
  onFinish
}) => {
  const [hovering, setHovering] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [hoverIndex, setHoverIndex] = useState(0);

  // Arrange players with current player first
  const players = [currentPlayer, opponent];

  useEffect(() => {
    let steps = 0;
    const interval = setInterval(() => {
      setHoverIndex(prev => 1 - prev);
      steps++;
      if (steps >= 4) {
        clearInterval(interval);
        setHovering(false);
        // Set the final selection based on firstPlayerId
        setHoverIndex(firstPlayerId === currentPlayer.id ? 0 : 1);
        // Show selection for 1 second before closing
        setTimeout(() => {
          setShowOverlay(false);
          if (onFinish) onFinish();
        }, 1000);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [firstPlayerId, currentPlayer.id, onFinish]);

  if (!showOverlay) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-50">
      <div className="bg-slate-800/90 rounded-2xl p-8 w-[90%] max-w-md border-4 border-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.5)] text-center relative">
        <div
          className="text-xl font-bold mb-6 text-white"
          style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}
        >
          Who goes first
        </div>

        <div className="flex flex-col items-center mb-4 space-y-3">
          {players.map((player, idx) => (
            <div
              key={player.id}
              className={`
                text-2xl font-extrabold py-3 px-6 rounded-xl relative transition-all duration-300 ease-in-out min-w-[200px] text-center
                ${idx === hoverIndex
                  ? (hovering
                    ? 'border-2 border-dashed border-teal-400 shadow-[0_0_15px_#4FD1C5] text-teal-400 bg-teal-400/5 scale-105'
                    : 'border-3 border-solid border-teal-400 bg-teal-400/20 shadow-[0_0_25px_#4FD1C5] text-teal-400 scale-110'
                  )
                  : 'text-violet-400 border-2 border-violet-400/30 bg-violet-400/5'
                }
              `}
              style={{
                textShadow: idx === hoverIndex
                  ? '0 0 15px #4FD1C5'
                  : '0 0 10px #8B5CF6'
              }}
            >
              {player.name}
            </div>
          ))}
        </div>

        <div className="text-teal-400 text-xl font-bold uppercase tracking-[2px] mt-5">
          TO START
        </div>
      </div>
    </div>
  );
};

export default PlayerSelectionOverlay;
