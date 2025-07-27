import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGame, useUser, useSocket } from '../hooks';
import BingoCard from '../components/BingoCard';
import PlayerCard from '../components/PlayerCard';
import { NotificationBanner } from '../components/NotificationBanner';
import PlayerSelectionOverlay from '../components/PlayerSelectionOverlay';
import type { Notification } from '../types';

const LobbyPage: React.FC = () => {
  const { joinGame } = useGame();
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentGame, setPlayerReady, isReadyLoading, fetchGame } = useGame();
  const { user } = useUser();
  const { isConnected, isReconnecting, emit, on } = useSocket();

  const [state, setState] = useState({ 
    playerCard: Array(5).fill(null).map(() => Array(5).fill(0)) as number[][], 
    notification: null as Notification | null, 
    showFirstPlayerOverlay: false, 
    firstPlayerData: null as { currentPlayer: { id: string; name: string }; opponent: { id: string; name: string }; firstPlayerId: string } | null,
    isNavigating: false,
    overlayShown: false // Flag to prevent multiple overlay triggers
  });
  const fetchedRef = useRef<string | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);

  // Ultra-compact memoized helpers with consolidated logic and optimized validation
  const { currentPlayerRole, currentPlayer, opponent, isCardComplete, shouldShowRoomCode, getStatusMessage } = useMemo(() => {
    const role = currentGame?.players.challenger?.playerId === user?.identifier ? 'challenger' : 'acceptor';
    const current = currentGame?.players[role];
    let opp = currentGame?.players[role === 'challenger' ? 'acceptor' : 'challenger'];
    // Debug: Log opponent photoUrl at mapping
    console.log('[PHOTOURL FLOW] Mapping opponent:', {
      opp,
      oppPhotoUrl: opp?.photoUrl,
      backendPhotoUrl: currentGame?.players[role === 'challenger' ? 'acceptor' : 'challenger']?.photoUrl
    });
    if (opp && !opp.photoUrl && currentGame?.players[role === 'challenger' ? 'acceptor' : 'challenger']?.photoUrl) {
      const oppPlayer = currentGame.players[role === 'challenger' ? 'acceptor' : 'challenger'];
      if (oppPlayer && oppPlayer.photoUrl) {
        opp = { ...opp, photoUrl: oppPlayer.photoUrl };
      }
    }
    
    // Optimized card validation with early return and bitwise operations
    const isComplete = () => {
      if (state.playerCard.length !== 5) return false;
      
      // Use bitwise operations for faster validation
      let cellCount = 0;
      const usedNumbers = new Set<number>();
      
      for (let i = 0; i < 5; i++) {
        const row = state.playerCard[i];
        if (!row || row.length !== 5) return false;
        
        for (let j = 0; j < 5; j++) {
          const cell = row[j];
          if (cell <= 0 || cell > 25) return false;
          if (usedNumbers.has(cell)) return false;
          
          usedNumbers.add(cell);
          cellCount++;
        }
      }
      
      return cellCount === 25;
    };
    
    return {
      currentPlayerRole: role,
      currentPlayer: current,
      opponent: opp,
      isCardComplete: isComplete,
      shouldShowRoomCode: () => !currentGame?.players.acceptor,
      getStatusMessage: () => {
        // Hide status during game start transition and when overlay is showing
        if (currentGame?.status === 'playing' || state.showFirstPlayerOverlay) {
          return '';
        }
        return currentGame?.statusMessage || 'Loading game status...';
      }
    };
  }, [currentGame, user, state.playerCard, state.showFirstPlayerOverlay]);

  // Consolidated effects with ultra-compact logic
  useEffect(() => { if (!gameId) navigate('/'); }, [gameId, navigate]);
  useEffect(() => {
    if (!gameId || !isConnected || !user || fetchedRef.current === gameId) return;
    fetchedRef.current = gameId;
    setFetchFailed(false);
    // Try to fetch game first
    fetchGame(gameId)
      .then((gameResponse) => {
        const players = gameResponse.game?.players;
        const isPlayer = players && (players.challenger?.playerId === user.identifier || players.acceptor?.playerId === user.identifier);
        if (!isPlayer) {
          emit('connection:reconnect', { gameId, playerId: user.identifier });
          joinGame(gameId).then(() => fetchGame(gameId));
        } else {
          emit('connection:reconnect', { gameId, playerId: user.identifier });
        }
      })
      .catch((error: Error) => {
        console.error('Failed to fetch game:', error);
        setFetchFailed(true);
        setState(s => ({ ...s, notification: { message: 'Failed to load game. Please check the game code.', type: 'error' } }));
        setTimeout(() => navigate('/'), 3000);
      });
  }, [gameId, currentGame, isConnected, user, fetchGame, navigate, emit, setFetchFailed, joinGame]);

  // Prevent back navigation during lobby and ensure disconnection
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (currentGame?.status === 'lobby' || currentGame?.status === 'waiting') {
        event.preventDefault();
        // Send disconnect signal to other player
        if (emit && currentPlayer) {
          emit('game:disconnect', { 
            gameId, 
            playerId: currentPlayer.playerId 
          });
        }
        // Navigate to launch screen (home) with replace to prevent back button issues
        setTimeout(() => navigate('/', { replace: true }), 100);
      }
    };

    const handleBeforeUnload = () => {
      if (currentGame?.status === 'lobby' || currentGame?.status === 'waiting') {
        if (emit && currentPlayer) {
          emit('game:disconnect', {
            gameId,
            playerId: currentPlayer.playerId
          });
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentGame?.status, emit, currentPlayer, gameId, navigate]);

  // Show overlay when game transitions to playing and we haven't shown it yet
  useEffect(() => {
    if (currentGame?.status === 'playing' && 
        currentGame?.currentTurn && 
        !state.overlayShown) {
      
      const { challenger, acceptor } = currentGame.players;
      if (!challenger || !acceptor) return;
      
      const firstPlayerRole = currentGame.currentTurn;
      const current = currentPlayerRole === 'challenger' ? challenger : acceptor;
      const opp = currentPlayerRole === 'challenger' ? acceptor : challenger;
      
      // console.log('[DEBUG] Setting up PlayerSelectionOverlay:', {
      //   gameStatus: currentGame.status,
      //   currentTurn: currentGame.currentTurn,
      //   challenger: challenger?.name,
      //   acceptor: acceptor?.name,
      //   currentPlayerRole,
      //   firstPlayerRole,
      //   overlayShown: state.overlayShown
      // });
      
      // Show overlay instantly when game transitions to playing
      setState(s => ({ 
        ...s, 
        firstPlayerData: { 
          currentPlayer: { id: current.playerId, name: current.name || 'You', photoUrl: current.photoUrl || currentGame?.players?.challenger?.photoUrl || currentGame?.players?.acceptor?.photoUrl || '' }, 
          opponent: { id: opp.playerId, name: opp.name || 'Opponent', photoUrl: opp.photoUrl || currentGame?.players?.acceptor?.photoUrl || currentGame?.players?.challenger?.photoUrl || '' }, 
          firstPlayerId: firstPlayerRole === 'challenger' ? challenger.playerId : acceptor.playerId 
        }, 
        showFirstPlayerOverlay: true,
        overlayShown: true // Mark as shown to prevent re-triggers
      }));
    }
  }, [currentGame?.status, currentGame?.currentTurn, currentGame?.players, currentPlayerRole, state.overlayShown]);

  // Restore player's card when game state updates (for reconnection)
  // Skip restoration for fresh rematch games
  useEffect(() => {
    if (currentGame?.status === 'waiting' && currentPlayer?.status === 'waiting') {
      // This is a fresh rematch game - don't restore old cards
      console.log(`[DEBUG] Fresh rematch game detected - keeping empty card`);
      return;
    }
    
    if (currentPlayer?.card && currentPlayer.card.length === 5 && currentPlayer.card[0].length === 5) {
      // Only restore if the current card is empty or different
      const currentCardEmpty = state.playerCard.every(row => row.every(cell => cell === 0));
      const cardsDifferent = !currentCardEmpty && JSON.stringify(state.playerCard) !== JSON.stringify(currentPlayer.card);
      
      if (currentCardEmpty || cardsDifferent) {
        console.log(`[DEBUG] Restoring player card from game state:`, currentPlayer.card);
        setState(s => ({ ...s, playerCard: currentPlayer.card! }));
      }
    }
  }, [currentPlayer?.card, state.playerCard, currentGame?.status, currentPlayer?.status]);

  // Socket event listeners for real-time lobby updates
  useEffect(() => {
    if (!gameId || !on) return;

    let fetchTimeout: number | null = null;
    
    const debouncedFetch = () => {
      if (fetchTimeout) clearTimeout(fetchTimeout);
      fetchTimeout = setTimeout(() => {
        console.log('[DEBUG] Executing debounced fetchGame');
        fetchGame(gameId);
      }, 100); // Small delay to batch rapid updates
    };

    const handlePlayerJoined = (data: unknown) => {
      console.log('[DEBUG] Received game:playerJoined event in LobbyPage:', data);
      const { game } = data as { game?: typeof currentGame };
      if (game && game.gameId === gameId) {
        console.log('[DEBUG] Fetching updated game state after player joined');
        debouncedFetch();
      }
    };

    const handlePlayerReadyStatus = (data: unknown) => {
      console.log('[DEBUG] Received player:readyStatus event in LobbyPage:', data);
      const { game } = data as { game?: typeof currentGame };
      if (game && game.gameId === gameId) {
        console.log('[DEBUG] Fetching updated game state after ready status change');
        debouncedFetch();
      }
    };

    const handleGameStarted = (data: unknown) => {
      console.log('[DEBUG] Received game:started event in LobbyPage:', data);
      const { game } = data as { game?: typeof currentGame };
      if (game && game.gameId === gameId) {
        console.log('[DEBUG] Game started, fetching updated game state');
        // Don't navigate immediately - let the PlayerSelectionOverlay show first
        // The overlay will handle navigation when it finishes
        debouncedFetch();
      }
    };

    // Listen for lobby events and opponent disconnect
    const unsubscribePlayerJoined = on('game:playerJoined', handlePlayerJoined);
    const unsubscribePlayerReady = on('player:readyStatus', handlePlayerReadyStatus);
    const unsubscribeGameStarted = on('game:started', handleGameStarted);
    
    // Handle opponent disconnect in lobby
    const handleOpponentDisconnect = (data: unknown) => {
      const disconnectData = data as { playerId: string; game?: { gameId: string } };
      
      // Check if the disconnecting player is our opponent
      if (opponent && disconnectData.playerId === opponent.playerId) {
        console.log(`Opponent ${disconnectData.playerId} disconnected from lobby ${gameId}`);
        // Force refresh the game state to reflect opponent disconnection
        debouncedFetch();
      }
    };
    
    const unsubscribeOpponentDisconnect = on('player:disconnected', handleOpponentDisconnect);

    return () => {
      if (fetchTimeout) clearTimeout(fetchTimeout);
      unsubscribePlayerJoined();
      unsubscribePlayerReady();
      unsubscribeGameStarted();
      unsubscribeOpponentDisconnect();
    };
  }, [on, gameId, fetchGame, navigate, currentGame, opponent]);

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
    container: 'min-h-screen bg-gray-900 text-white relative flex flex-col overflow-y-auto',
    content: `flex-1 flex flex-col px-2 pt-4`,
    maxWidth: 'w-full max-w-[400px] mx-auto flex flex-col h-full',
    playerGrid: 'grid grid-cols-2 gap-4',
    roomCode: 'text-center p-3 border-2 border-pink-400 rounded-lg bg-pink-400/10 shadow-lg shadow-pink-400/30',
    roomCodeLabel: 'text-pink-400 font-semibold mb-1 text-xs tracking-wider',
    roomCodeValue: 'text-xl font-bold text-pink-400 tracking-wider',
    readyButton: 'w-full py-3 rounded-lg font-semibold transition-all duration-300 border shadow-lg text-base flex items-center justify-center gap-2',
    readyButtonActive: 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white border-emerald-400/30 shadow-emerald-400/30 hover:shadow-emerald-400/50 hover:scale-105',
    readyButtonDone: 'bg-gradient-to-r from-green-300 to-emerald-200 text-green-900 border-green-200/60 shadow-green-200/30 cursor-not-allowed opacity-70 ring-2 ring-green-200/40',
    statusText: 'text-center text-amber-400 italic text-sm pb-6',
    reconnecting: 'fixed top-0 left-0 right-0 z-40',
    reconnectingBanner: 'bg-orange-600 text-white text-center py-2 text-sm'
  }), []);


  // Loading & Error states
  // Show loading while explicitly loading, or while we have attempted fetch but no result yet, or while dependencies aren't ready
  if (!location.state?.fromLaunch && ((fetchedRef.current === gameId && !currentGame && !fetchFailed) || (!isConnected || !user))) {
    return <div className={`${styles.container} flex items-center justify-center`}><div className="text-white text-xl">Loading game...</div></div>;
  }
  // Show "Game not found" only if fetch failed and dependencies are ready
  if (!currentGame && fetchFailed && isConnected && user) return (
    <div className={`${styles.container} flex items-center justify-center`}>
      <div className="text-center">
        <div className="text-white text-xl mb-4">Game not found</div>
        <div className="text-gray-400">Game ID: {gameId}</div>
        <button 
          type="button" 
          onClick={() => navigate('/')} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
        >
          Back to Home
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      {state.notification && <NotificationBanner {...state.notification} onClose={() => setState(s => ({ ...s, notification: null }))} />}
      {isReconnecting && <div className={styles.reconnecting}><div className={styles.reconnectingBanner}>Reconnecting to game server...</div></div>}
      {/* Debug and render overlay */}
      {(() => {
        console.log('[DEBUG] Overlay render check:', {
          showFirstPlayerOverlay: state.showFirstPlayerOverlay,
          hasFirstPlayerData: !!state.firstPlayerData,
          isNavigating: state.isNavigating,
          overlayShown: state.overlayShown,
          gameStatus: currentGame?.status
        });
        
        return state.showFirstPlayerOverlay && state.firstPlayerData ? (
          <PlayerSelectionOverlay 
            {...state.firstPlayerData} 
            isNavigating={state.isNavigating}
            onFinish={() => { 
              console.log('[DEBUG] PlayerSelectionOverlay finished, navigating to game');
              // Prevent multiple navigation calls
              if (state.isNavigating) {
                console.log('[DEBUG] Already navigating, ignoring onFinish call');
                return;
              }
              
              console.log('[DEBUG] Starting navigation process');
              // Set navigation state and start navigation
              setState(s => ({ ...s, isNavigating: true }));
              
              // Navigate with a slight delay to ensure overlay completes
              setTimeout(() => {
                console.log('[DEBUG] Executing navigation to game page');
                navigate(`/game/${gameId}`);
                // Reset overlay state after navigation
                setTimeout(() => {
                  console.log('[DEBUG] Cleaning up overlay state');
                  setState(s => ({ ...s, showFirstPlayerOverlay: false, isNavigating: false }));
                }, 300);
              }, 100);
            }} 
          />
        ) : null;
      })()}

      <div className={styles.content}>
        <div className="min-h-screen flex flex-col">
          {/* Top Section: Player Info and Room Code */}
          <div className="w-full">
            <div className="grid grid-cols-2 gap-4 w-full max-w-[360px] mx-auto">
              <PlayerCard player={currentPlayer ? { ...currentPlayer, photoUrl: user?.photoUrl } : undefined} isCurrentUser={true} />
              <PlayerCard
                player={currentPlayerRole === 'challenger'
                  ? currentGame?.players?.acceptor
                  : currentGame?.players?.challenger}
                isCurrentUser={false}
              />
            </div>
            {shouldShowRoomCode() && (
              <div className={styles.roomCode + ' w-full max-w-[360px] mx-auto mt-4'}>
                <div className={styles.roomCodeLabel}>ROOM CODE</div>
                <div className={styles.roomCodeValue}>{gameId}</div>
              </div>
            )}
          </div>

          {/* Middle Section: Bingo Card (flex-1 for vertical centering) */}
          <div className="flex-1 flex justify-center items-center w-full">
            <BingoCard
              card={state.playerCard}
              onCardChange={handleCardChange}
              isEditable={(currentGame?.status === 'waiting' || currentGame?.status === 'lobby') && (!currentPlayer || currentPlayer?.status !== 'ready')}
              className="w-full max-w-[360px] mx-auto"
            />
          </div>

          {/* Bottom Section: Ready Button and Status */}
          <div className="w-full max-w-md mx-auto px-4 pb-2 flex flex-col items-center">
            {isCardComplete() && (
              <button
                type="button"
                onClick={currentPlayer?.status !== 'ready' ? handleSetReady : undefined}
                disabled={isReadyLoading || !isConnected || currentPlayer?.status === 'ready'}
                className={`w-full max-w-[360px] mx-auto ${styles.readyButton} ${currentPlayer?.status === 'ready' ? styles.readyButtonDone : styles.readyButtonActive}`}
                style={{ marginBottom: 0.3 }}
              >
                {currentPlayer?.status === 'ready' ? (
                  <>
                    <svg className="w-5 h-5 mr-1 text-white inline-block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Ready!
                  </>
                ) : (
                  isReadyLoading ? 'Setting Ready...' : 'READY'
                )}
              </button>
            )}
            <div className={styles.statusText + ' w-full max-w-[360px] mx-auto'} style={{ marginBottom: 0 }}>{getStatusMessage()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;
