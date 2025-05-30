import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame, useUser, useSocket } from '../hooks';
import BingoCard from '../components/BingoCard';
import PlayerCard from '../components/PlayerCard';
import { NotificationBanner } from '../components/NotificationBanner';
import PlayerSelectionOverlay from '../components/PlayerSelectionOverlay';
import type { Notification } from '../types';

const LobbyPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { currentGame, setPlayerReady, isLoading, fetchGame } = useGame();
  const { user } = useUser();
  const { isConnected, isReconnecting, emit } = useSocket();

  const [state, setState] = useState({ playerCard: Array(5).fill(null).map(() => Array(5).fill(0)) as number[][], notification: null as Notification | null, showFirstPlayerOverlay: false, firstPlayerData: null as { currentPlayer: { id: string; name: string }; opponent: { id: string; name: string }; firstPlayerId: string } | null });
  const fetchedRef = useRef<string | null>(null);

  // Ultra-compact memoized helpers with consolidated logic
  const { currentPlayerRole, currentPlayer, opponent, isCardComplete, shouldShowRoomCode, getStatusMessage } = useMemo(() => {
    const role = currentGame?.players.challenger?.playerId === user?.identifier ? 'challenger' : 'acceptor';
    const current = currentGame?.players[role];
    const opp = currentGame?.players[role === 'challenger' ? 'acceptor' : 'challenger'];
    return {
      currentPlayerRole: role,
      currentPlayer: current,
      opponent: opp,
      isCardComplete: () => state.playerCard.length === 5 && state.playerCard.every(row => row.length === 5 && row.every(cell => cell > 0)),
      shouldShowRoomCode: () => !currentGame?.players.acceptor,
      getStatusMessage: () => currentGame?.statusMessage || 'Loading game status...'
    };
  }, [currentGame, user, state.playerCard]);

  // Consolidated effects with ultra-compact logic
  useEffect(() => { if (!gameId) navigate('/'); }, [gameId, navigate]);
  useEffect(() => {
    if (!gameId || currentGame || !isConnected || !user || fetchedRef.current === gameId) return;
    fetchedRef.current = gameId;
    emit('connection:reconnect', { gameId, playerId: user.identifier });
    fetchGame(gameId).catch(error => {
      console.error('Failed to fetch game:', error);
      fetchedRef.current = null;
      setState(s => ({ ...s, notification: { message: 'Failed to load game. Please check the game code.', type: 'error' } }));
      setTimeout(() => navigate('/'), 3000);
    });
  }, [gameId, currentGame, isConnected, user, fetchGame, navigate, emit]);

  useEffect(() => {
    if (currentGame?.status !== 'playing' || !currentGame?.currentTurn) return;
    const { challenger, acceptor } = currentGame.players;
    if (!challenger || !acceptor) return;
    const firstPlayerRole = currentGame.currentTurn;
    const current = currentPlayerRole === 'challenger' ? challenger : acceptor;
    const opp = currentPlayerRole === 'challenger' ? acceptor : challenger;
    setState(s => ({ ...s, firstPlayerData: { currentPlayer: { id: current.playerId, name: current.name || 'You' }, opponent: { id: opp.playerId, name: opp.name || 'Opponent' }, firstPlayerId: firstPlayerRole === 'challenger' ? challenger.playerId : acceptor.playerId }, showFirstPlayerOverlay: true }));
  }, [currentGame?.status, currentGame?.currentTurn, currentGame?.players, currentPlayerRole]);

  // Ultra-compact handlers
  const [handleCardChange, handleSetReady] = [
    useCallback((card: number[][]) => setState(s => ({ ...s, playerCard: card })), []),
    useCallback(async () => {
      if (!isCardComplete()) return setState(s => ({ ...s, notification: { message: 'Please complete your bingo card first', type: 'warning' } }));
      try {
        const response = await setPlayerReady(state.playerCard);
        if (response.game) setTimeout(() => setState(s => ({ ...s, notification: null })), 100);
      } catch (error) {
        setState(s => ({ ...s, notification: { message: (error as Error).message || 'Failed to set ready status', type: 'error' } }));
      }
    }, [isCardComplete, setPlayerReady, state.playerCard])
  ];

  // Styles
  const styles = useMemo(() => ({
    container: 'min-h-screen bg-gray-900 text-white relative',
    content: `px-4 ${isReconnecting ? 'pt-12' : 'pt-4'} pb-6`,
    maxWidth: 'max-w-md mx-auto space-y-4',
    playerGrid: 'grid grid-cols-2 gap-3',
    roomCode: 'text-center p-3 border-2 border-pink-400 rounded-lg bg-pink-400/10 shadow-lg shadow-pink-400/30',
    roomCodeLabel: 'text-pink-400 font-semibold mb-1 text-xs tracking-wider',
    roomCodeValue: 'text-xl font-bold text-pink-400 tracking-wider',
    readyButton: 'w-full py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-2 border-teal-400 shadow-lg shadow-teal-400/30',
    statusText: 'text-center text-amber-400 italic text-sm pb-2',
    reconnecting: 'fixed top-0 left-0 right-0 z-40',
    reconnectingBanner: 'bg-orange-600 text-white text-center py-2 text-sm'
  }), [isReconnecting]);


  // Loading & Error states
  if (isLoading) return <div className={`${styles.container} flex items-center justify-center`}><div className="text-white text-xl">Loading game...</div></div>;
  if (!currentGame) return (
    <div className={`${styles.container} flex items-center justify-center`}>
      <div className="text-center">
        <div className="text-white text-xl mb-4">Game not found</div>
        <div className="text-gray-400">Game ID: {gameId}</div>
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500">Back to Home</button>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      {state.notification && <NotificationBanner {...state.notification} onClose={() => setState(s => ({ ...s, notification: null }))} />}
      {isReconnecting && <div className={styles.reconnecting}><div className={styles.reconnectingBanner}>Reconnecting to game server...</div></div>}
      {state.showFirstPlayerOverlay && state.firstPlayerData && (
        <PlayerSelectionOverlay {...state.firstPlayerData} onFinish={() => { setState(s => ({ ...s, showFirstPlayerOverlay: false })); navigate(`/game/${gameId}`); }} />
      )}

      <div className={styles.content}>
        <div className={styles.maxWidth}>
          {/* Player Status */}
          <div className="space-y-3">
            <div className={styles.playerGrid}>
              <PlayerCard player={currentPlayer || undefined} isCurrentUser={true} />
              <PlayerCard player={opponent} isCurrentUser={false} />
            </div>
            {shouldShowRoomCode() && (
              <div className={styles.roomCode}>
                <div className={styles.roomCodeLabel}>ROOM CODE</div>
                <div className={styles.roomCodeValue}>{gameId}</div>
              </div>
            )}
          </div>

          {/* Bingo Card */}
          <div className="py-2">
            <BingoCard
              card={state.playerCard}
              onCardChange={handleCardChange}
              isEditable={(currentGame?.status === 'waiting' || currentGame?.status === 'lobby') && (!currentPlayer || currentPlayer?.status !== 'ready')}
            />
          </div>

          {/* Action Button and Status */}
          <div className="space-y-3">
            {currentPlayer?.status !== 'ready' && isCardComplete() && (
              <button onClick={handleSetReady} disabled={isLoading || !isConnected} className={styles.readyButton}>
                {isLoading ? 'Setting Ready...' : 'READY'}
              </button>
            )}
            <div className={styles.statusText}>{getStatusMessage()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;
