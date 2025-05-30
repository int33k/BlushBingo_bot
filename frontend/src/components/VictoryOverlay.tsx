import React from 'react';

interface VictoryOverlayProps {
  isVisible: boolean;
  isWinner: boolean;
  winnerName: string;
  winnerInitial: string;
  onClose: () => void;
  onRematch: () => void;
  rematchStatus: 'none' | 'requested' | 'waiting' | 'accepted';
  opponentConnected: boolean;
}

const VictoryOverlay: React.FC<VictoryOverlayProps> = ({
  isVisible, isWinner, winnerName, winnerInitial, onClose, onRematch, rematchStatus, opponentConnected
}) => {

  if (!isVisible) return null;

  // Ultra-compact rematch logic using lookup tables
  const REMATCH_CONFIG = {
    none: { text: 'Rematch', disabled: false, showButton: true },
    waiting: { text: 'Waiting for opponent...', disabled: true, showButton: true },
    requested: { text: 'Join Rematch', disabled: false, showButton: true },
    accepted: { text: 'Starting new game...', disabled: true, showButton: true }
  };

  const rematchUI = opponentConnected
    ? REMATCH_CONFIG[rematchStatus]
    : { text: '⚠️ Opponent disconnected', disabled: true, showButton: false };

  const handleClose = () => { onClose(); window.location.href = '/'; };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border-2 border-yellow-400 shadow-[0_0_30px_#FCD34D] max-w-md w-full mx-4">

        {/* Close Button */}
        <button
          onClick={handleClose}
          className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors z-10 
          }`}
        >
          ×
        </button>

        {/* Winner Profile Picture - Half above border */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full border-4 border-yellow-400 shadow-[0_0_20px_#FCD34D] flex items-center justify-center">
            <span className="text-2xl font-bold text-slate-900">{winnerInitial}</span>
          </div>
        </div>

        {/* Content */}
        <div className="pt-16 pb-8 px-8 text-center">
          {/* Victory Message */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">
              <span className={isWinner ? 'text-yellow-400' : 'text-red-400'}>
                {isWinner ? '🏆 You Win! 🏆' : '😔 You Lost'}
              </span>
            </h2>
            <p className="text-lg text-gray-300">
              {isWinner ? "Congratulations! You completed BINGO first!" : `${winnerName} completed BINGO first!`}
            </p>
          </div>

          {/* Rematch Section - Real-time Updates */}
          {rematchUI.showButton ? (
            <button
              onClick={onRematch}
              disabled={rematchUI.disabled}
              className={`w-full py-3 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
                rematchUI.disabled
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 hover:shadow-[0_0_20px_#3B82F6]'
              }`}
            >
              {rematchUI.text}
            </button>
          ) : (
            <div className="text-orange-400 text-sm font-medium bg-orange-900/20 border border-orange-600/30 rounded-lg py-3 px-4">
              {rematchUI.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VictoryOverlay;