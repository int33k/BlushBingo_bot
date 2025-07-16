import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket, useGame } from '../hooks';
import { NotificationBanner } from '../components/NotificationBanner';
import type { Notification } from '../types';

// Simplified constants for faster loading
const NUMBERS = [
  { val: '7', color: '#60A5FA', shadow: '#60A5FA30' }, 
  { val: '12', color: '#EF4444', shadow: '#EF444430' }
];
const BOTTOM_NUMS = [
  { val: '15', color: '#4ADE80', shadow: '#4ADE8030' }, 
  { val: '3', color: '#EF4444', shadow: '#EF444430' }
];

const LaunchPage: React.FC = () => {
  const navigate = useNavigate();
  const { gameId: joinGameId } = useParams();
  const { isConnected, isReconnecting } = useSocket();
  const { createGame, joinGame, leaveGame, fetchGame } = useGame();
  const [state, setState] = useState({ 
    challengeCode: joinGameId || '', 
    animationOffset: 0, 
    notification: null as Notification | null, 
    isLoading: false,
    hasAttemptedJoin: false,
    loadingType: null as 'create' | 'join' | null
  });

  // Clear game state - non-blocking
  useEffect(() => {
    if (leaveGame) leaveGame();
  }, [leaveGame]);

  // Delayed animation to not block initial render
  useEffect(() => { 
    let interval: number;
    const timer = setTimeout(() => {
      interval = setInterval(() => 
        setState(s => ({ ...s, animationOffset: s.animationOffset + 0.03 })), 16);
    }, 200);
    
    return () => {
      clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, []);

  // Handle auto-join - simplified logic
  useEffect(() => {
    if (!joinGameId || !isConnected || state.isLoading || state.hasAttemptedJoin) return;
    setState(s => ({ ...s, challengeCode: joinGameId, isLoading: true, hasAttemptedJoin: true }));
    (async () => {
      try {
        const res = await joinGame(joinGameId);
        if (res.success) {
          await fetchGame(joinGameId);
          navigate(`/lobby/${joinGameId}`);
        } else {
          setState(s => ({
            ...s,
            notification: { message: res.error || 'Failed to join game', type: 'error' },
            isLoading: false
          }));
        }
      } catch (err) {
        setState(s => ({
          ...s,
          notification: { message: (err as Error).message || 'Failed to join game', type: 'error' },
          isLoading: false
        }));
      }
    })();
  }, [joinGameId, isConnected, state.isLoading, state.hasAttemptedJoin, joinGame, fetchGame, navigate]);

  // Simplified handlers - remove heavy computations
  const showNotification = useCallback((message: string, type: Notification['type']) => 
    setState(s => ({ ...s, notification: { message, type } })), []);
    
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => 
    setState(s => ({ ...s, challengeCode: e.target.value })), []);

  const handleCreateGame = useCallback(async () => {
    if (!isConnected) return showNotification('Not connected to server. Please try again.', 'error');
    setState(s => ({ ...s, isLoading: true, loadingType: 'create' }));
    try {
      const response = await createGame();
      if (response.success) {
        const gameId = response.gameId;
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/#/join/${gameId}`);
      } catch {
        // ignore clipboard errors
      }
      // Wait for game data before navigating
      if (typeof gameId === 'string') {
        await fetchGame(gameId);
        navigate(`/lobby/${gameId}`, { state: { fromLaunch: true } });
      }
      } else {
        showNotification(response.error || 'Failed to create game', 'error');
      }
    } catch (error) {
      showNotification((error as Error).message || 'Failed to create game', 'error');
    } finally {
      setState(s => ({ ...s, isLoading: false, loadingType: null }));
    }
  }, [isConnected, createGame, fetchGame, navigate, showNotification]);

  const handleJoinGame = useCallback(async (gameIdToJoin?: string) => {
    const codeToUse = gameIdToJoin || state.challengeCode.trim();
    if (!isConnected) return showNotification('Not connected to server. Please try again.', 'error');
    if (!codeToUse) return showNotification('Please enter a challenge code', 'warning');
    setState(s => ({ ...s, isLoading: true, loadingType: 'join' }));
    try {
      const response = await joinGame(codeToUse);
      if (response.success) {
        // Wait for game data before navigating
        await fetchGame(codeToUse);
        navigate(`/lobby/${codeToUse}`, { state: { fromLaunch: true } });
      } else {
        showNotification(response.error || 'Failed to join game', 'error');
      }
    } catch (error) {
      showNotification((error as Error).message || 'Failed to join game', 'error');
    } finally {
      setState(s => ({ ...s, isLoading: false, loadingType: null }));
    }
  }, [state.challengeCode, isConnected, joinGame, fetchGame, navigate, showNotification]);

  // Animation helper function
  const animatedTransform = useCallback((index: number) => {
    const offset = state.animationOffset + index * 0.5;
    return `translate(${Math.sin(offset) * 3}px, ${Math.cos(offset) * 3}px)`;
  }, [state.animationOffset]);

  // Enhanced styles with premium typography and visual improvements
  const styles = useMemo(() => ({
    container: 'h-screen bg-gradient-to-br from-slate-900 via-black to-purple-900 text-white flex flex-col items-center p-4 overflow-hidden relative',
    content: 'w-full max-w-sm flex flex-col items-center h-full relative z-10',
    logoSection: 'flex-1 flex flex-col items-center justify-center w-full relative',
    logo: 'relative w-full flex flex-col items-center',
    circles: 'flex justify-between w-full my-8',
    circle: 'flex items-center justify-center w-20 h-20 rounded-full bg-transparent relative border-2 backdrop-blur-sm',
    title: 'flex flex-col items-center mb-8 relative',
    titleText: 'text-6xl font-black tracking-wider text-pink-500 text-center leading-none m-0 relative select-none',
    underline: 'absolute bg-gradient-to-r from-pink-500 via-pink-400 to-pink-500',
    inputSection: 'w-full pb-3 mt-auto space-y-3',
    input: 'w-full bg-slate-900/90 backdrop-blur-sm text-white p-4 text-lg border-2 border-red-500/70 rounded-xl outline-none transition-all duration-300 focus:border-red-400 focus:bg-slate-800/90 focus:shadow-lg focus:shadow-red-500/20',
    button: 'w-full py-5 bg-gradient-to-r from-red-600/20 to-pink-600/20 backdrop-blur-sm text-red-400 text-xl font-bold border-2 border-red-500/70 rounded-xl transition-all duration-300 cursor-pointer hover:from-red-600/40 hover:to-pink-600/40 hover:border-red-400 hover:text-red-300 hover:shadow-lg hover:shadow-red-500/30 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed'
  }), []);

  return (
    <div className={styles.container}>
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-pink-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
              transform: `translate(${Math.sin(state.animationOffset + i) * 2}px, ${Math.cos(state.animationOffset + i) * 2}px)`
            }}
          />
        ))}
      </div>

      {/* Notification and reconnection banners */}
      {state.notification && <NotificationBanner {...state.notification} onClose={() => setState(s => ({ ...s, notification: null }))} />}
      {isReconnecting && (
        <div className="fixed top-0 left-0 right-0 z-40">
          <div className="bg-orange-600 text-white text-center py-2 text-sm font-medium">
            Reconnecting to game server...
          </div>
        </div>
      )}

      {/* Loading overlay for actions */}
      {state.isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-800/90 rounded-xl p-6 text-center space-y-4">
            <div className="animate-spin w-8 h-8 border-4 border-pink-400/30 border-t-pink-400 rounded-full mx-auto"></div>
            <div className="text-pink-400 font-medium">
              {state.loadingType === 'join' ? 'Joining game...' : state.loadingType === 'create' ? 'Creating game...' : 'Loading...'}
            </div>
          </div>
        </div>
      )}      <div className={styles.content}>
        <div className={styles.logoSection}>
          <div className={styles.logo}>
            {/* Top Numbers with enhanced glow */}
            <div className={styles.circles}>
              {NUMBERS.map((num, i) => (
                <div 
                  key={i} 
                  className={styles.circle} 
                  style={{ 
                    borderColor: num.color, 
                    transform: animatedTransform(i), 
                    boxShadow: i === 1 
                      ? `0 0 20px ${num.shadow}` // Only outer shadow for 12
                      : `0 0 20px ${num.shadow}, inset 0 0 20px ${num.shadow}` // Keep original for 7
                  }}
                >
                  <span 
                    className="text-5xl font-black" 
                    style={{ 
                      color: i === 1 ? 'transparent' : num.color, // 12 is transparent
                      textShadow: i === 1 ? `0 0 50px ${num.color}, 0 0 100px ${num.color}` : `0 0 12px ${num.color}, 0 0 24px ${num.color}`,
                      WebkitTextStroke: `2px ${num.color}`, // border for 12
                      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                    }}
                  >
                    {num.val}
                  </span>
                  <div 
                    className="absolute inset-0 border-2 rounded-full opacity-30 blur-sm " 
                    style={{ borderColor: num.color }} 
                  />
                </div>
              ))}
            </div>            {/* Enhanced Main Logo with premium typography */}
            <div className={styles.title}>
              <h1 
                className={styles.titleText} 
                style={{ 
                  textShadow: '0 0 10px #FF1493, 0 0 20px #FF149350, 0 0 30px #FF149320',
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  letterSpacing: '0.1em'
                }}
              >
                BLUSH
                {/* Sparkle 1 - Over B of BLUSH (top-left) */}
                <span 
                  className="absolute text-yellow-400 text-2xl pointer-events-none"
                  style={{ 
                    left: '-8px',
                    top: '-12px',
                    transform: `translate(${Math.sin(state.animationOffset) * 4}px, ${Math.cos(state.animationOffset) * 4}px)`, 
                    textShadow: '0 0 8px #facc15, 0 0 16px #facc15',
                    filter: 'drop-shadow(0 0 4px #facc15)'
                  }}
                >
                  ✦
                </span>
                {/* Sparkle 2 - Over H of BLUSH (top-right) */}
                <span 
                  className="absolute text-yellow-400 text-3xl pointer-events-none"
                  style={{ 
                    right: '-8px',
                    top: '-12px',
                    transform: `translate(${Math.sin(state.animationOffset + 0.8) * 4}px, ${Math.cos(state.animationOffset + 0.8) * 4}px)`, 
                    textShadow: '0 0 8px #facc15, 0 0 16px #facc15',
                    filter: 'drop-shadow(0 0 4px #facc15)'
                  }}
                >
                  ✦
                </span>
              </h1>              {/* Enhanced decorative line with gradient glow */}
              <div 
                className={styles.underline} 
                style={{ 
                  filter: 'drop-shadow(0 0 8px #FF1493) drop-shadow(0 0 16px #FF149350)',
                  background: 'linear-gradient(90deg, #FF1493, #FF69B4, #FF1493)',
                  width: '234px',  // Wider than title width
                  height: '5px',   // Make it thicker for visibility
                  left: '-8px',   // Start before the B
                  top: '71px',     // Position between BLUSH and BINGO   
                  transform: 'rotate(-4.5deg)', // Tilt towards top-right
                  transformOrigin: 'left center', // Rotate from left side
                  borderRadius: '2px'
                }} 
              />
              <h1 
                className={styles.titleText} 
                style={{ 
                  textShadow: '0 0 10px #FF1493, 0 0 20px #FF149350, 0 0 30px #FF149320',
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  letterSpacing: '0.1em'
                }}
              >
                BINGO
                {/* Sparkle 3 - Bottom-right of O in BINGO */}
                <span 
                  className="absolute text-yellow-400 text-xl pointer-events-none"
                  style={{ 
                    right: '-4px',
                    bottom: '-8px',
                    transform: `translate(${Math.sin(state.animationOffset + 1.6) * 4}px, ${Math.cos(state.animationOffset + 1.6) * 4}px)`, 
                    textShadow: '0 0 8px #facc15, 0 0 16px #facc15',
                    filter: 'drop-shadow(0 0 4px #facc15)'
                  }}
                >
                  ✦
                </span>
              </h1>
            </div>            {/* Enhanced Bottom Numbers & Heart */}
            <div className={styles.circles} style={{ position: 'relative' }}>
              <div 
                className={styles.circle} 
                style={{ 
                  borderColor: BOTTOM_NUMS[0].color, 
                  transform: animatedTransform(2), 
                  boxShadow: `0 0 20px ${BOTTOM_NUMS[0].shadow}, inset 0 0 20px ${BOTTOM_NUMS[0].shadow}` 
                }}
              >
                <span 
                  className="text-5xl font-black" 
                  style={{ 
                    color: BOTTOM_NUMS[0].color, 
                    textShadow: `0 0 20px ${BOTTOM_NUMS[0].color}, 0 0 24px ${BOTTOM_NUMS[0].color}`,
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                  }}
                >
                  {BOTTOM_NUMS[0].val}
                </span>
                <div className="absolute inset-0 border-2 rounded-full opacity-30 blur-sm" style={{ borderColor: BOTTOM_NUMS[0].color }} />
              </div>
              {/* Empty space for heart positioning */}
              <div style={{ width: '80px', height: '80px', position: 'relative' }}>
                <div 
                  style={{ 
                    position: 'absolute',
                    top: '55%',
                    left: '50%',
                    transform: `translate(-50%, -50%) ${animatedTransform(3)} rotate(-45deg) scale(1.15)`,
                    width: '80px',
                    height: '80px'
                  }}
                >
                  <svg 
                    width="80" 
                    height="80" 
                    viewBox="0 0 24 24" 
                    fill="none"
                    style={{ display: 'block' }}
                  >
                    <path 
                      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                      stroke="#EF4444" 
                      strokeWidth="1.1" 
                      fill="transparent" 
                    />
                  </svg>
                  <span 
                    className="text-4xl font-black text-red-500" 
                    style={{ 
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%) rotate(37deg)',
                      textShadow: '0 0 8px #EF4444, 0 0 16px #EF444450', 
                      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                    }}
                  >
                    3
                  </span>
                  <div 
                    className="w-2 h-2 bg-red-500 rounded-full animate-pulse" 
                    style={{ 
                      position: 'absolute',
                      top: '0px', 
                      right: '8px',
                      boxShadow: '0 0 4px #EF4444'
                    }} 
                  />
                  <div 
                    className="w-1 h-1 bg-red-500 rounded-full animate-pulse" 
                    style={{ 
                      position: 'absolute',
                      top: '4px', 
                      right: '24px',
                      boxShadow: '0 0 3px #EF4444', 
                      animationDelay: '0.5s'
                    }} 
                  />
                </div>
              </div>
            </div>
            
            {/* Heart positioned absolutely outside the flex container */}
            
          </div>
        </div>        {/* Enhanced Input and Button - Always at bottom */}
        <div className={styles.inputSection}>
          <div className="relative">
            <input 
              type="text" 
              id="challenge-code-input"
              name="challengeCode"
              placeholder="Enter challenge code" 
              value={state.challengeCode} 
              onChange={handleInputChange} 
              onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()} 
              className={styles.input} 
              disabled={state.isLoading} 
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 pointer-events-none" />
          </div>
          <button 
            type="button"
            onClick={handleCreateGame} 
            className={styles.button} 
            disabled={state.isLoading || !isConnected}
          >
            <span className="relative z-10 flex items-center justify-center space-x-2">
                <>
                  <span>Create Challenge</span>
                </>
            </span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/5 via-pink-500/5 to-red-500/5 pointer-events-none" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaunchPage;
