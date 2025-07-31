import React, { useState, useEffect } from 'react';

import type { Player } from '../types';

interface PlayerSelectionOverlayProps {
  currentPlayer: Player;
  opponent: Player;
  firstPlayerId: string;
  onFinish?: () => void;
  isNavigating?: boolean;
}

const PlayerSelectionOverlay: React.FC<PlayerSelectionOverlayProps> = ({
  currentPlayer,
  opponent,
  firstPlayerId,
  onFinish,
  isNavigating = false
}): React.ReactElement => {
  // Debug: Log photoUrl for both players in overlay
  // console.log('[PHOTOURL FLOW] PlayerSelectionOverlay:', {
  //   currentPlayerPhotoUrl: currentPlayer?.photoUrl,
  //   opponentPhotoUrl: opponent?.photoUrl
  // });
  const isValidPhotoUrl = (url?: string) => {
    if (!url || typeof url !== 'string') return false;
    if (url.trim() === '' || url.trim().toLowerCase() === 'null') return false;
    return /^https?:\/\//.test(url);
  };
  //console.log('[DEBUG] PlayerSelectionOverlay rendered with props:', {
    //currentPlayer: currentPlayer?.name,
    //opponent: opponent?.name,
    //firstPlayerId,
    //isNavigating
  //});
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  // Ensure photoUrl fallback for both players
  const players = [
    { ...currentPlayer, photoUrl: currentPlayer.photoUrl || '' },
    { ...opponent, photoUrl: opponent.photoUrl || '' }
  ];

  useEffect(() => {
    //console.log('[DEBUG] PlayerSelectionOverlay useEffect starting');
    let switchCount = 0;
    const maxSwitches = 6;
    
    const switchPlayer = () => {
      //console.log('[DEBUG] switchPlayer called, switchCount:', switchCount);
      if (switchCount >= maxSwitches) {
        // Stop animation and show final selection
        //console.log('[DEBUG] Animation complete, showing final selection');
        setIsAnimating(false);
        const finalIndex = firstPlayerId === currentPlayer.playerId ? 0 : 1;
        setSelectedIndex(finalIndex);
        
        // Close overlay after showing result
        setTimeout(() => {
          //console.log('[DEBUG] Calling onFinish callback');
          if (onFinish) onFinish();
          // Don't hide overlay here - let parent component handle it
          // The navigation logic in parent will handle hiding
        }, 2000);
        return;
      }
      
      setSelectedIndex(prev => 1 - prev);
      switchCount++;
      
      // Gradually slow down the animation
      const delay = 300 + (switchCount * 100);
      setTimeout(switchPlayer, delay);
    };

    // Start animation after a brief delay
    //console.log('[DEBUG] Starting animation timer');
    const timer = setTimeout(switchPlayer, 500);
    
    return () => {
      //console.log('[DEBUG] Cleaning up animation timer');
      clearTimeout(timer);
    };
  }, [firstPlayerId, currentPlayer.playerId, onFinish, isNavigating]);

  // Always show the overlay when component is mounted
  // Parent component controls when to mount/unmount this component

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-slate-900/95 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-teal-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main container */}
      <div className="relative w-full max-w-md mx-auto">
        {/* Glassmorphism container */}
        <div className="bg-gradient-to-br from-slate-800/80 via-slate-700/70 to-slate-800/80 rounded-3xl p-6 sm:p-8 w-full border border-white/10 shadow-2xl backdrop-blur-xl text-center relative overflow-hidden">
          
          {/* Gradient border effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-teal-400/20 via-purple-400/20 to-pink-400/20 opacity-50 blur-xl" />
          <div className="absolute inset-[1px] rounded-3xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl" />
          
          {/* Content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <div className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-teal-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                🎲 First Player
              </div>
              <div className="text-slate-300 text-xs sm:text-sm font-medium tracking-wide uppercase opacity-80">
                {isAnimating ? 'Randomly selecting who starts' : 'Player selected!'}
              </div>
            </div>

            {/* Player cards */}
            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              {players.map((player, idx) => (
                <div
                  key={player.playerId}
                  className={`
                    relative group transition-all duration-500 ease-out transform
                    ${selectedIndex === idx ? 'scale-105 z-20' : 'scale-95 z-10'}
                  `}
                >
                  {/* Card background with glow */}
                  <div className={`
                    absolute inset-0 rounded-2xl transition-all duration-500
                    ${selectedIndex === idx 
                      ? (isAnimating 
                        ? 'bg-gradient-to-r from-teal-400/20 to-purple-400/20 shadow-[0_0_40px_rgba(79,209,197,0.3)] blur-sm' 
                        : 'bg-gradient-to-r from-teal-400/30 to-purple-400/30 shadow-[0_0_60px_rgba(79,209,197,0.6)] blur-sm'
                      )
                      : 'bg-slate-600/20'
                    }
                  `} />
                  
                  {/* Main card */}
                  <div className={`
                    relative bg-gradient-to-br from-slate-700/80 to-slate-800/80 backdrop-blur-sm
                    rounded-2xl p-4 sm:p-6 border transition-all duration-500 w-full
                    ${selectedIndex === idx
                      ? (isAnimating
                        ? 'border-teal-400/50 shadow-lg transform translate-y-[-2px]'
                        : 'border-teal-400 shadow-xl transform translate-y-[-4px] ring-2 ring-teal-400/30'
                      )
                      : 'border-slate-600/30 shadow-md'
                    }
                  `}>
                    
                    {/* Selection indicator */}
                    {selectedIndex === idx && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <div className={`
                          w-6 h-6 rounded-full border-2 transition-all duration-500 ease-out
                          ${isAnimating 
                            ? 'border-teal-400 border-dashed animate-spin' 
                            : 'border-teal-400 bg-teal-400 shadow-lg shadow-teal-400/50 scale-110'
                          }
                        `}>
                          {!isAnimating && (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                {/* Player avatar */}
                {isValidPhotoUrl(player?.photoUrl) ? (
                  <img
                    src={player.photoUrl}
                    alt={player.name || 'Player'}
                    className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl object-cover`}
                    style={{ borderRadius: '1rem' }}
                    onError={e => (e.currentTarget.style.display = 'none')}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className={`
                    w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-bold transition-all duration-500
                    ${selectedIndex === idx
                      ? 'bg-gradient-to-br from-teal-400/20 to-purple-400/20 text-teal-400 shadow-lg'
                      : 'bg-slate-600/20 text-slate-400'
                    }
                  `}>
                    {(player?.name?.charAt(0) || '?').toUpperCase()}
                  </div>
                )}

                    {/* Player name */}
                    <div className={`
                      text-lg sm:text-xl font-bold transition-all duration-500
                      ${selectedIndex === idx
                        ? 'text-teal-400 drop-shadow-lg'
                        : 'text-slate-300'
                      }
                    `}>
                      {player.name}
                    </div>

                    {/* Player identifier */}
                    <div className="text-xs text-slate-400 mt-1 opacity-70">
                      {idx === 0 ? 'You' : 'Opponent'}
                    </div>

                    {/* Animated selection effect */}
                    {selectedIndex === idx && isAnimating && (
                      <div className="absolute inset-0 rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-400/10 to-transparent transform -skew-x-12 animate-pulse" />
                      </div>
                    )}
                  </div>

                  {/* Particle burst effect on final selection */}
                  {selectedIndex === idx && !isAnimating && (
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2 h-2 bg-teal-400 rounded-full opacity-0 animate-ping"
                          style={{
                            left: '50%',
                            top: '50%',
                            transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-40px)`,
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: '0.8s'
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
                !isAnimating ? 'bg-green-400 animate-bounce' : 'bg-teal-400 animate-pulse'
              }`} />
              <div className={`text-xs sm:text-sm font-medium tracking-wider uppercase transition-all duration-300 ${
                !isAnimating ? 'text-green-400' : 'text-teal-400'
              }`}>
                {isAnimating ? 'Selecting...' : 'Selected!'}
              </div>
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
                !isAnimating ? 'bg-green-400 animate-bounce' : 'bg-teal-400 animate-pulse'
              }`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { memo } from 'react';
export default memo(PlayerSelectionOverlay);

