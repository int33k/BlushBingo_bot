import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket, useGame } from '../hooks';
import { NotificationBanner } from '../components/NotificationBanner';
import type { Notification } from '../types';

// Constants - Ultra-compact data structures
const [SPARKLES, NUMBERS, BOTTOM_NUMS] = [['sparkle1', 'sparkle2', 'sparkle3'], [{ val: '7', color: '#60A5FA', shadow: 'rgba(59, 130, 246, 0.5)' }, { val: '12', color: '#EF4444', shadow: 'rgba(239, 68, 68, 0.5)' }], [{ val: '15', color: '#4ADE80', shadow: 'rgba(74, 222, 128, 0.5)' }, { val: '3', color: '#EF4444', shadow: 'rgba(239, 68, 68, 0.5)' }]] as const;

const LaunchPage: React.FC = () => {
  const navigate = useNavigate();
  const { gameId: joinGameId } = useParams();
  const { isConnected, isReconnecting } = useSocket();
  const { createGame, joinGame } = useGame();
  const [state, setState] = useState({ challengeCode: '', animationOffset: 0, notification: null as Notification | null, isLoading: false });

  // Consolidated effects & handlers
  useEffect(() => { const interval = setInterval(() => setState(s => ({ ...s, animationOffset: s.animationOffset + 0.03 })), 16); return () => clearInterval(interval); }, []);
  useEffect(() => {
    if (!joinGameId || !isConnected || state.isLoading) return;
    setState(s => ({ ...s, challengeCode: joinGameId, isLoading: true }));
    joinGame(joinGameId).then(res => res.success ? navigate(`/lobby/${joinGameId}`) : setState(s => ({ ...s, notification: { message: res.error || 'Failed to join game', type: 'error' }, isLoading: false }))).catch(err => setState(s => ({ ...s, notification: { message: (err as Error).message || 'Failed to join game', type: 'error' }, isLoading: false })));
  }, [joinGameId, isConnected, state.isLoading, joinGame, navigate]);

  const [animatedTransform, showNotification, handleInputChange] = [
    useCallback((offset: number) => `translate(${Math.sin(state.animationOffset + offset) * 3}px, ${Math.cos(state.animationOffset + offset) * 3}px)`, [state.animationOffset]),
    useCallback((message: string, type: Notification['type']) => setState(s => ({ ...s, notification: { message, type } })), []),
    useCallback((e: React.ChangeEvent<HTMLInputElement>) => setState(s => ({ ...s, challengeCode: e.target.value })), [])
  ];

  const [handleCreateGame, handleJoinGame] = [
    useCallback(async () => {
      if (!isConnected) return showNotification('Not connected to server. Please try again.', 'error');
      setState(s => ({ ...s, isLoading: true }));
      try {
        const response = await createGame();
        if (response.success) {
          const challengeLink = `${window.location.origin}/#/join/${response.gameId}`;
          try {
            await navigator.clipboard.writeText(challengeLink);
            showNotification('Challenge link copied to clipboard!', 'success');
          } catch {
            showNotification('Game created! Share code: ' + response.gameId, 'success');
          }
          navigate(`/lobby/${response.gameId}`);
        } else {
          showNotification(response.error || 'Failed to create game', 'error');
        }
      } catch (error) {
        showNotification((error as Error).message || 'Failed to create game', 'error');
      } finally {
        setState(s => ({ ...s, isLoading: false }));
      }
    }, [isConnected, createGame, navigate, showNotification]),
    useCallback(async (gameIdToJoin?: string) => {
      const codeToUse = gameIdToJoin || state.challengeCode.trim();
      if (!isConnected) return showNotification('Not connected to server. Please try again.', 'error');
      if (!codeToUse) return showNotification('Please enter a challenge code', 'warning');
      setState(s => ({ ...s, isLoading: true }));
      try {
        const response = await joinGame(codeToUse);
        if (response.success) {
          navigate(`/lobby/${codeToUse}`);
        } else {
          showNotification(response.error || 'Failed to join game', 'error');
        }
      } catch (error) {
        showNotification((error as Error).message || 'Failed to join game', 'error');
      } finally {
        setState(s => ({ ...s, isLoading: false }));
      }
    }, [state.challengeCode, isConnected, joinGame, navigate, showNotification])
  ];

  // Memoized styles
  const styles = useMemo(() => ({
    container: 'min-h-screen bg-black text-white flex flex-col items-center justify-between p-4 overflow-hidden',
    content: 'w-full max-w-md flex flex-col items-center h-full justify-between',
    logo: 'relative w-full flex flex-col items-center',
    circles: 'flex justify-between w-full my-6',
    circle: 'flex items-center justify-center w-20 h-20 rounded-full bg-transparent relative border-2',
    title: 'flex flex-col items-center mb-6',
    titleText: 'text-6xl font-bold tracking-wide text-pink-500 text-center leading-none m-0',
    underline: 'w-64 h-1 bg-pink-500 transform -rotate-2 my-2',
    input: 'w-full bg-black/80 text-white p-4 text-lg border-2 border-red-500 rounded-lg outline-none',
    button: 'w-full py-5 bg-black/80 text-red-500 text-xl font-bold border-2 border-red-500 rounded-lg mt-2 transition-all duration-300 cursor-pointer hover:bg-red-800 hover:text-white hover:scale-105'
  }), []);

  return (
    <div className={styles.container}>
      {state.notification && <NotificationBanner {...state.notification} onClose={() => setState(s => ({ ...s, notification: null }))} />}
      {isReconnecting && <div className="fixed top-0 left-0 right-0 z-40"><div className="bg-orange-600 text-white text-center py-2 text-sm">Reconnecting to game server...</div></div>}

      <div className={styles.content}>
        <div className={styles.logo}>
          {/* Top Numbers */}
          <div className={styles.circles}>
            {NUMBERS.map((num, i) => (
              <div key={i} className={styles.circle} style={{ borderColor: num.color, transform: animatedTransform(i), boxShadow: `0 0 12px ${num.shadow}` }}>
                <span className="text-5xl font-bold" style={{ color: num.color, textShadow: `0 0 8px ${num.color}` }}>{num.val}</span>
              </div>
            ))}
          </div>

          {/* Main Logo */}
          <div className={styles.title}>
            <h1 className={styles.titleText} style={{ textShadow: '0 0 7px #FF1493' }}>BLUSH</h1>
            <div className={styles.underline} style={{ filter: 'drop-shadow(0 0 6px #FF1493)' }} />
            <h1 className={styles.titleText} style={{ textShadow: '0 0 7px #FF1493' }}>BINGO</h1>
          </div>

          {/* Bottom Numbers & Heart */}
          <div className={styles.circles}>
            <div className={styles.circle} style={{ borderColor: BOTTOM_NUMS[0].color, transform: animatedTransform(2), boxShadow: `0 0 12px ${BOTTOM_NUMS[0].shadow}` }}>
              <span className="text-5xl font-bold" style={{ color: BOTTOM_NUMS[0].color, textShadow: `0 0 6px ${BOTTOM_NUMS[0].color}` }}>{BOTTOM_NUMS[0].val}</span>
              <div className="absolute inset-0 border-2 rounded-full opacity-50 blur-sm" style={{ borderColor: BOTTOM_NUMS[0].color }} />
            </div>
            <div className="relative w-20 h-20 flex items-center justify-center" style={{ transform: `${animatedTransform(3)} rotate(-45deg) scale(1.15)` }}>
              <svg width="150%" height="150%" viewBox="0 0 24 24" fill="none">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="#EF4444" strokeWidth="1.1" fill="transparent" style={{ filter: 'drop-shadow(0 0 1.2px #EF4444)' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold text-red-500" style={{ textShadow: '0 0 5px #EF4444', transform: 'rotate(37deg)' }}>3</span>
              </div>
              <div className="absolute top-0 right-1 w-2 h-2 bg-red-500 rounded-full" style={{ boxShadow: '0 0 5px #EF4444' }} />
              <div className="absolute top-1 right-3 w-1 h-1 bg-red-500 rounded-full" style={{ boxShadow: '0 0 5px #EF4444' }} />
            </div>
          </div>

          {/* Sparkles */}
          {SPARKLES.map((className) => (
            <div key={className} className={`absolute text-yellow-400 ${className === 'sparkle1' ? 'top-1/3 left-1/4 text-2xl' : className === 'sparkle2' ? 'top-1/3 right-1/4 text-3xl' : 'top-2/5 right-1/4 text-xl'}`} style={{ transform: `translate(${Math.sin(state.animationOffset + 2.5) * 4}px, ${Math.cos(state.animationOffset + 2.5) * 4}px)`, textShadow: '0 0 6px #facc15' }}>✦</div>
          ))}
        </div>

        {/* Input and Button */}
        <div className="w-full px-2 mt-4">
          <div className="mb-2" style={{ boxShadow: '0 0 4px #EF4444' }}>
            <input type="text" placeholder="Enter challenge code" value={state.challengeCode} onChange={handleInputChange} onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()} className={styles.input} disabled={state.isLoading} />
          </div>
          <button onClick={handleCreateGame} className={styles.button} style={{ boxShadow: '0 0 4px #EF4444', textShadow: '0 0 4px #EF4444' }} disabled={state.isLoading || !isConnected}>
            {state.isLoading ? 'Creating...' : 'Create Challenge'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaunchPage;
