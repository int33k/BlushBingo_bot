import React, { useState, useEffect } from 'react';

interface VictoryOverlayProps {
  isVisible: boolean;
  isWinner: boolean;
  winnerName: string;
  winnerInitial: string;
  winnerPhotoUrl?: string;
  winReason?: 'bingo' | 'disconnection' | 'forfeit';
  onClose: () => void;
  onRematch: () => void;
  rematchStatus: 'none' | 'requested' | 'waiting' | 'accepted';
  opponentConnected: boolean;
  isNavigating?: boolean;
}

const VictoryOverlay: React.FC<VictoryOverlayProps> = ({
  isVisible,
  isWinner,
  winnerName,
  winnerInitial,
  winnerPhotoUrl,
  winReason,
  onClose,
  onRematch,
  rematchStatus,
  opponentConnected,
  isNavigating = false
}): React.ReactElement => {
  // Debug: Log winner photoUrl in victory overlay
  console.log('[PHOTOURL FLOW] VictoryOverlay:', {
    winnerPhotoUrl
  });
  const isValidPhotoUrl = (url?: string) => {
    if (!url || typeof url !== 'string') return false;
    if (url.trim() === '' || url.trim().toLowerCase() === 'null') return false;
    return /^https?:\/\//.test(url);
  };
  const [showContent, setShowContent] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Stagger the animations for a smooth entrance
      const timer1 = setTimeout(() => setShowContent(true), 100);
      const timer2 = setTimeout(() => setShowParticles(true), 300);
      const timer3 = setTimeout(() => setShowConfetti(true), 500);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      setShowContent(false);
      setShowParticles(false);
      setShowConfetti(false);
    }
  }, [isVisible]);

  if (!isVisible && !isNavigating) return <></>;

  // Rematch configuration with modern styling
  const REMATCH_CONFIG = {
    none: { 
      text: 'Play Again', 
      disabled: false, 
      showButton: true,
      className: 'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white shadow-lg shadow-teal-400/30'
    },
    waiting: { 
      text: 'Waiting for opponent...', 
      disabled: true, 
      showButton: true,
      className: 'bg-gradient-to-r from-slate-600 to-slate-500 text-slate-300 cursor-not-allowed'
    },
    requested: { 
      text: 'Join Rematch', 
      disabled: false, 
      showButton: true,
      className: 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-400/30 animate-pulse'
    },
    accepted: { 
      text: 'Starting new game...', 
      disabled: true, 
      showButton: true,
      className: 'bg-gradient-to-r from-green-600 to-green-500 text-white'
    }
  };

  const rematchUI = opponentConnected
    ? REMATCH_CONFIG[rematchStatus]
    : { 
        text: 'Opponent disconnected', 
        disabled: true, 
        showButton: true,
        className: 'bg-gradient-to-r from-red-600/60 to-red-500/60 text-red-200 cursor-not-allowed'
      };

  const handleClose = () => {
    // Use the onClose callback provided by parent component
    // This ensures proper state management and navigation coordination
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-slate-900/95 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      
      {/* Enhanced animated background particles */}
      {showParticles && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Ambient floating particles */}
          {[...Array(40)].map((_, i) => (
            <div
              key={`ambient-${i}`}
              className={`absolute rounded-full animate-pulse ${
                isWinner 
                  ? 'bg-teal-400/40' 
                  : 'bg-purple-400/40'
              }`}
              style={{
                width: `${2 + Math.random() * 6}px`,
                height: `${2 + Math.random() * 6}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
          
          {/* Floating stars for winners */}
          {isWinner && [...Array(15)].map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute text-yellow-400"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${12 + Math.random() * 16}px`,
                animation: `starFloat 4s ${Math.random() * 2}s infinite ease-in-out`
              }}
            >
              ⭐
            </div>
          ))}
        </div>
      )}

      {/* Enhanced confetti effect */}
      {showConfetti && isWinner && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={`confetti-${i}`}
              className="absolute w-2 h-4"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                background: `hsl(${Math.random() * 360}, 80%, 60%)`,
                borderRadius: '2px',
                animation: `confettiFall ${3 + Math.random() * 2}s ${Math.random() * 2}s ease-out`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
        </div>
      )}

      {/* Main container */}
      <div className={`relative w-full max-w-lg mx-auto transition-all duration-500 ${showContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        
        {/* Glassmorphism container */}
        <div className="relative bg-gradient-to-br from-slate-800/80 via-slate-700/70 to-slate-800/80 rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden">
          
          {/* Gradient border effects */}
          <div className={`absolute inset-0 rounded-3xl opacity-50 blur-xl ${
            isWinner 
              ? 'bg-gradient-to-r from-teal-400/30 via-green-400/30 to-yellow-400/30'
              : 'bg-gradient-to-r from-purple-400/30 via-pink-400/30 to-red-400/30'
          }`} />
          <div className="absolute inset-[1px] rounded-3xl bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl" />

          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-700/80 backdrop-blur-sm text-slate-300 hover:text-white hover:bg-slate-600/80 transition-all duration-200 flex items-center justify-center text-xl font-bold border border-slate-600/50 z-20"
          >
            ×
          </button>

          {/* Content */}
          <div className="relative z-10 text-center">
            
            {/* Enhanced winner avatar with multiple effects */}
            <div className="mb-8">
              <div className={`relative inline-block ${showContent ? 'animate-bounce' : ''}`}>
                {/* Avatar glow rings */}
                <div className="absolute inset-0">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={`ring-${i}`}
                      className={`absolute inset-0 rounded-full border-2 ${
                        isWinner 
                          ? 'border-teal-400/30' 
                          : 'border-purple-400/30'
                      }`}
                      style={{
                        animation: `avatarRing 3s ${i * 0.5}s infinite ease-out`,
                        transform: `scale(${1 + i * 0.3})`
                      }}
                    />
                  ))}
                </div>
                
                {/* Main avatar - show photo if available */}
                {isValidPhotoUrl(winnerPhotoUrl) ? (
                  <img
                    src={winnerPhotoUrl}
                    alt={winnerName || 'Winner'}
                    className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 shadow-2xl transition-all duration-500 ${
                      isWinner
                        ? 'border-teal-300 shadow-teal-400/50'
                        : 'border-purple-300 shadow-purple-400/50'
                    }`}
                    style={{ borderRadius: '1rem' }}
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-3xl sm:text-4xl font-black shadow-2xl border-4 transition-all duration-500 ${
                    isWinner 
                      ? 'bg-gradient-to-br from-teal-400 to-green-500 border-teal-300 shadow-teal-400/50 hover:scale-110' 
                      : 'bg-gradient-to-br from-purple-400 to-pink-500 border-purple-300 shadow-purple-400/50'
                  }`}>
                    <span className="text-white drop-shadow-lg">{winnerInitial}</span>
                  </div>
                )}
                
                {/* Enhanced glow effect */}
                <div className={`absolute inset-0 rounded-full blur-lg opacity-75 animate-pulse ${
                  isWinner 
                    ? 'bg-gradient-to-br from-teal-400 to-green-500'
                    : 'bg-gradient-to-br from-purple-400 to-pink-500'
                }`} />
                
                {/* Particle burst around avatar */}
                {showContent && isWinner && (
                  <div className="absolute inset-0">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={`avatar-particle-${i}`}
                        className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                        style={{
                          left: '50%',
                          top: '50%',
                          animation: `avatarParticleBurst 2s ${i * 0.1}s infinite ease-out`,
                          transform: `rotate(${i * 45}deg) translateY(-60px)`
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Victory message */}
            <div className="mb-8 sm:mb-10">
              <h1 className={`text-4xl sm:text-5xl font-black mb-4 bg-gradient-to-r bg-clip-text text-transparent ${
                isWinner 
                  ? 'from-teal-400 via-green-400 to-yellow-400'
                  : 'from-purple-400 via-pink-400 to-red-400'
              }`}>
                {isWinner ? '🏆 VICTORY! 🏆' : '🥀 DEFEAT 🥀'}
              </h1>
              
              <div className="space-y-2">
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {isWinner ? 'Congratulations!' : `${winnerName} Wins!`}
                </p>
                <p className="text-slate-300 text-sm sm:text-base">
                  {isWinner 
                    ? (winReason === 'bingo' 
                        ? "You completed BINGO first!" 
                        : winReason === 'disconnection'
                        ? "You won because your opponent disconnected!"
                        : "You won the game!"
                      )
                    : "Better luck next time!"
                  }
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-4">
              {/* Rematch button */}
              {rematchUI.showButton && (
                <button
                  type="button"
                  onClick={onRematch}
                  disabled={rematchUI.disabled}
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${rematchUI.className}`}
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>🎮</span>
                    <span>{rematchUI.text}</span>
                  </span>
                </button>
              )}
              
              {/* Back to home button */}
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3 px-6 rounded-2xl font-semibold text-base bg-gradient-to-r from-slate-700/80 to-slate-600/80 text-slate-300 hover:from-slate-600/80 hover:to-slate-500/80 hover:text-white transition-all duration-300 border border-slate-500/30"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>🏠</span>
                  <span>Back to Home</span>
                </span>
              </button>
            </div>

            {/* Connection status indicator */}
            {!opponentConnected && (
              <div className="mt-6 flex items-center justify-center space-x-2 text-amber-400 text-sm">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                <span>Opponent disconnected</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Enhanced Victory Overlay Animations */}
      <style>{`
        @keyframes avatarRing {
          0% {
            transform: scale(1);
            opacity: 0.7;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        @keyframes avatarParticleBurst {
          0% {
            opacity: 1;
            transform: rotate(var(--rotation, 0deg)) translateY(0px) scale(0);
          }
          50% {
            opacity: 1;
            transform: rotate(var(--rotation, 0deg)) translateY(-60px) scale(1);
          }
          100% {
            opacity: 0;
            transform: rotate(var(--rotation, 0deg)) translateY(-120px) scale(0);
          }
        }
        
        @keyframes victoryTextGlow {
          0%, 100% {
            text-shadow: 0 0 20px rgba(20, 184, 166, 0.5);
            filter: brightness(1);
          }
          50% {
            text-shadow: 0 0 40px rgba(20, 184, 166, 0.8), 0 0 80px rgba(20, 184, 166, 0.4);
            filter: brightness(1.2);
          }
        }
        
        @keyframes starFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 1;
          }
        }
        
        @keyframes confettiFall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default VictoryOverlay;