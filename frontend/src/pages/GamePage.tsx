import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket, useUser, useGame, useGameLogic, useSocketHandler, useNavigationHandler } from '../hooks';
import VictoryOverlay from '../components/VictoryOverlay';
import PlayerSelectionOverlay from '../components/PlayerSelectionOverlay';
import GameHeader from '../components/GameHeader';
import MoveHistory from '../components/MoveHistory';
import GameBingoCard from '../components/GameBingoCard';
import BingoLetters from '../components/BingoLetters';
import BingoButton from '../components/BingoButton';
import BingoAnimation from '../components/BingoAnimation';
import { NotificationBanner } from '../components/NotificationBanner';
import type { Notification } from '../types';
import { LINE_PATTERNS } from '../shared-adapter';

// API utility
const apiCall = async (endpoint: string, data: Record<string, unknown>) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}${endpoint}`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(data) 
  });
  if (!res.ok) throw new Error(`API call failed: ${res.status}`);
  return res.json();
};

const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { currentGame, fetchGame } = useGame();
  const { on, isConnected } = useSocket();
  const { user } = useUser();
  
  // Use modular hooks
  const gameLogic = useGameLogic();
  const { sendSocketMessage } = useSocketHandler();
  
  // Extract specific functions and values to avoid dependency issues
  const {
    updateBingoCard,
    updateMoveHistory,
    updateCompletedLines,
    updateActiveLetters,
    currentCompletedLines,
    completedLinesHistory
  } = gameLogic;
  
  // Use navigation handler
  useNavigationHandler({ 
    currentGame, 
    currentPlayer: gameLogic.playerInfo.current || null, 
    gameId 
  });

  // UI state
  const [uiState, setUIState] = useState<{ 
    showBingoAnimation: boolean; 
    bingoAnimationComplete: boolean; 
    showVictoryOverlay: boolean; 
    rematchStatus: 'none' | 'requested' | 'waiting' | 'accepted';
    notification: Notification | null;
    isNavigating: boolean;
    opponentConnected: boolean;
    showFirstPlayerOverlay: boolean;
  }>({ 
    showBingoAnimation: false, 
    bingoAnimationComplete: false, 
    showVictoryOverlay: false, 
    rematchStatus: 'none',
    notification: null,
    isNavigating: false,
    opponentConnected: false,
    showFirstPlayerOverlay: false
  });
  // Show first player selection overlay when both players are ready and game is not yet playing
  useEffect(() => {
    if (!currentGame) return;
    const bothReady = currentGame.players?.challenger?.status === 'ready' && currentGame.players?.acceptor?.status === 'ready';
    if (bothReady && currentGame.status === 'lobby' && !uiState.showFirstPlayerOverlay) {
      setUIState(prev => ({ ...prev, showFirstPlayerOverlay: true }));
    }
    if (currentGame.status === 'playing' && uiState.showFirstPlayerOverlay) {
      setUIState(prev => ({ ...prev, showFirstPlayerOverlay: false }));
    }
  }, [currentGame, uiState.showFirstPlayerOverlay]);
  
  const fetchedRef = useRef<string | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  // Utility function for notifications
  const showNotification = useCallback((message: string, type: Notification['type']) => {
    setUIState(prev => ({ ...prev, notification: { message, type } }));
  }, []);

  // Effects with fetch guard and navigation handling
useEffect(() => {
  let cancelled = false;
  if (!gameId) navigate('/');
  else if (fetchedRef.current !== gameId) {
    fetchedRef.current = gameId;
    setInitialLoading(true);
    setFetchFailed(false);
    fetchGame(gameId)
      .catch(() => { if (!cancelled) setFetchFailed(true); })
      .finally(() => { if (!cancelled) setInitialLoading(false); });
  }
  return () => { cancelled = true; };
}, [gameId, navigate, fetchGame]);

  // Update game logic when game state changes
  useEffect(() => {
    updateBingoCard();
    updateMoveHistory();
  }, [currentGame, updateBingoCard, updateMoveHistory]);

  // Update completed lines tracking
  useEffect(() => {
    updateCompletedLines();
  }, [currentCompletedLines, updateCompletedLines]);

  // Update active letters
  useEffect(() => {
    updateActiveLetters();
  }, [completedLinesHistory, updateActiveLetters]);

  // Update opponent connection status in UI state
  useEffect(() => {
    const isOpponentConnected = gameLogic.playerInfo.opponent?.connected || false;
    setUIState(prev => ({ ...prev, opponentConnected: isOpponentConnected }));
  }, [gameLogic.playerInfo.opponent?.connected]);

  // Socket event listeners for rematch events
  useEffect(() => {
    if (!currentGame) return;

    const handleRematchRequested = (data: unknown) => {
      const { game } = data as { game?: typeof currentGame };
      if (game && game.gameId === gameId) {
        fetchGame(gameId);
      }
    };

    const handleRematchAccepted = (data: unknown) => {
      const { newGameId } = data as { newGameId?: string };
      if (newGameId) {
        // IMMEDIATE UI BLOCKING: Hide all game content and show loading state
        setUIState(prev => ({ 
          ...prev, 
          isNavigating: true,
          showVictoryOverlay: false // Hide victory overlay immediately
        }));
        
        // Navigate immediately - the backend has already handled the migration
        navigate(`/lobby/${newGameId}`, { replace: true });
      }
    };

    const unsubscribeRequested = on('game:rematchRequested', handleRematchRequested);
    const unsubscribeAccepted = on('game:rematchAccepted', handleRematchAccepted);

    return () => {
      unsubscribeRequested();
      unsubscribeAccepted();
    };
  }, [on, gameId, navigate, fetchGame, currentGame]);

  // Listen for opponent disconnect
  useEffect(() => {
    const handleOpponentDisconnect = (data: unknown) => {
      if (!currentGame || !gameLogic.playerInfo.opponent) return;
      const disconnectData = data as { playerId: string; game?: { gameId: string } };
      
      // Update UI if the disconnecting player is our opponent
      // Accept disconnection from any game context (original game or rematch lobby)
      if (disconnectData.playerId === gameLogic.playerInfo.opponent.playerId) {
        setUIState(prev => ({ ...prev, opponentConnected: false }));
        // ...removed debug log...
      }
    };
    
    const unsubscribeOpponentDisconnect = on('player:disconnected', handleOpponentDisconnect);
    const unsubscribeOpponentLeft = on('player:left', handleOpponentDisconnect);
    
    return () => {
      unsubscribeOpponentDisconnect();
      unsubscribeOpponentLeft();
    };
  }, [on, currentGame, gameLogic.playerInfo.opponent]);

  // Socket event listeners for game updates
  useEffect(() => {
    if (!currentGame) return;

    const handleGameUpdate = (data: unknown) => {
      // ...removed debug log...
      const { game } = data as { game?: typeof currentGame };
      if (game && game.gameId === gameId) {
        // ...removed debug log...
        fetchGame(gameId);
      }
    };

    const handlePlayerReadyStatus = (data: unknown) => {
      // ...removed debug log...
      const { game } = data as { game?: typeof currentGame };
      if (game && game.gameId === gameId) {
        // ...removed debug log...
        fetchGame(gameId);
      }
    };

    // Listen for game updates (moves, turn changes)
    const unsubscribeGameUpdate = on('game:updated', handleGameUpdate);
    const unsubscribePlayerReady = on('player:readyStatus', handlePlayerReadyStatus);

    return () => {
      unsubscribeGameUpdate();
      unsubscribePlayerReady();
    };
  }, [on, gameId, fetchGame, currentGame]);

  // Socket event listeners for bingo completion - critical for instant win
  useEffect(() => {
    if (!currentGame) return;

    const handleBingoClaimed = (data: unknown) => {
      // ...removed debug log...
      const { game } = data as { game?: typeof currentGame };
      if (game && game.gameId === gameId && game.status === 'completed') {
        // ...removed debug log...
        const hasWinner = !!game.winner;
        const isWinner = game.winner === gameLogic.playerInfo.role;
        
        if (hasWinner) {
          if (isWinner) {
            // Winner: Show overlay only after animation completes (existing logic handles this)
            // ...removed debug log...
          } else {
            // Loser: Show victory overlay immediately 
            // ...removed debug log...
            setUIState(prev => ({
              ...prev,
              showVictoryOverlay: true,
              showBingoAnimation: false,
              bingoAnimationComplete: false
            }));
          }
        }
        
        // Update game state in context as well
        fetchGame(gameId);
      }
    };

    const unsubscribeBingoClaimed = on('game:bingoClaimedBy', handleBingoClaimed);

    return () => {
      unsubscribeBingoClaimed();
    };
  }, [on, gameId, fetchGame, currentGame, gameLogic.playerInfo.role]);

  // Game action handlers
  const handleCellClick = useCallback((row: number, col: number) => {
    if (!gameLogic.isCellClickable(row, col)) return;
    const clickedNumber = gameLogic.bingoCard[row][col];
    if (typeof clickedNumber !== 'number' || clickedNumber < 1 || clickedNumber > 25) return;
    const moveData = { gameId, number: clickedNumber, playerId: gameLogic.playerInfo.current?.playerId };
    // Optimistically mark the cell for instant UI feedback
    gameLogic.optimisticMarkCell(row, col);
    const socketSuccess = sendSocketMessage('game:move', moveData, (ack: unknown) => {
      const acknowledgment = ack as { game?: unknown; error?: string };
      if (acknowledgment?.error) {
        console.error('[DEBUG] Move failed with error:', acknowledgment.error);
        showNotification('Move failed, please try again', 'error');
        // Revert optimistic update by fetching fresh game state
        fetchGame(gameId!);
      }
      // No need to update on success since game:updated event will handle it
    });
    if (!socketSuccess) {
      // Fallback to API if socket not available
      apiCall('/games/move', moveData)
        .then(() => fetchGame(gameId!))
        .catch(() => {
          showNotification('Move failed, please try again', 'error');
          fetchGame(gameId!);
        });
    }
  }, [gameLogic, gameId, sendSocketMessage, fetchGame, showNotification]);

  const handleLetterClick = useCallback((index: number) => {
    if (!gameLogic.activeLetters[index] || gameLogic.markedLetters[index] || index >= gameLogic.completedLinesHistory.length || !gameLogic.playerInfo.current) return;
    
    const lineIndex = gameLogic.completedLinesHistory[index];
    if (lineIndex === undefined || !gameLogic.playerInfo.current.card) return;
    
    // Mark the letter first
    gameLogic.setMarkedLetters((prev: boolean[]) => { 
      const updated = [...prev]; 
      updated[index] = true; 
      return updated; 
    });
    
    // Get the numbers in the completed line
    const linePattern = LINE_PATTERNS[lineIndex];
    const numbers = linePattern.cells.map(cell => gameLogic.playerInfo.current!.card![cell.row][cell.col]);
    
    sendSocketMessage('game:markLine', { 
      gameId, 
      playerId: gameLogic.playerInfo.current.playerId, 
      lineIndex,
      numbers 
    });
  }, [gameLogic, gameId, sendSocketMessage]);

  const handleBingoStop = useCallback(() => {
    const allLettersMarked = gameLogic.markedLetters.filter(Boolean).length >= 5;
    if (currentGame?.status !== 'playing' || !allLettersMarked) return;
    
    // Start bingo animation FIRST before any API calls
    setUIState(prev => ({ ...prev, showBingoAnimation: true, bingoAnimationComplete: false }));
    
    // THEN claim bingo to change game status for both players
    if (!sendSocketMessage('game:claimBingo', { gameId, playerId: gameLogic.playerInfo.current?.playerId })) {
      apiCall(`/players/${gameId}/bingo`, { gameId, playerId: gameLogic.playerInfo.current?.playerId }).catch(console.error);
    }
    
    // Set animation complete after actual animation duration (2 seconds total)
    // This matches when main visible components complete: letters + text + early celebration
    setTimeout(() => {
      setUIState(prev => ({ ...prev, bingoAnimationComplete: true }));
    }, 2000); // Wait for actual animation completion
  }, [currentGame, gameLogic.markedLetters, gameLogic.playerInfo, gameId, sendSocketMessage]);

  // ...existing code...

  const handleRematch = useCallback(() => {
    if (!currentGame || !gameLogic.playerInfo.current) return;
    
    const success = sendSocketMessage('game:requestRematch', { 
      gameId: currentGame.gameId, 
      playerId: gameLogic.playerInfo.current.playerId 
    });
    
    if (!success) {
      apiCall('/games/rematch', { 
        gameId: currentGame.gameId, 
        playerId: gameLogic.playerInfo.current.playerId 
      }).catch(() => showNotification('Rematch request failed', 'error'));
    }
    // Don't set waiting state here - let the socket response handle it naturally
  }, [currentGame, gameLogic.playerInfo, sendSocketMessage, showNotification]);

  const handleVictoryClose = useCallback(() => {
    // Notify other players that this player is leaving the game
    if (currentGame && gameLogic.playerInfo.current) {
      sendSocketMessage('game:playerLeaving', {
        gameId: currentGame.gameId,
        playerId: gameLogic.playerInfo.current.playerId
      });
    }
    
    // Direct navigation to home - no loading state, no delays
    navigate('/', { replace: true });
  }, [navigate, currentGame, gameLogic.playerInfo, sendSocketMessage]);

  // Victory overlay logic - unified for both winner and loser - SIMPLIFIED
  useEffect(() => {
    const isCompleted = currentGame?.status === 'completed';
    const hasWinner = !!currentGame?.winner;
    const isWinner = currentGame?.winner === gameLogic.playerInfo.role;

    // ...removed debug log...

    if (isCompleted && hasWinner && !uiState.showVictoryOverlay) {
      if (isWinner && uiState.showBingoAnimation && !uiState.bingoAnimationComplete) {
        // Winner: Wait for animation to complete
        return;
      }
      // Show victory overlay for both players
      setUIState(prev => ({
        ...prev,
        showVictoryOverlay: true,
        showBingoAnimation: false,
      }));
    } else if (!isCompleted) {
      // Game not completed - reset victory overlay
      setUIState(prev => ({
        ...prev,
        showVictoryOverlay: false
      }));
    }

    // Update effect dependencies to fix lint warnings and include all necessary values
  }, [currentGame?.status, currentGame?.winner, gameLogic.playerInfo.role, uiState.bingoAnimationComplete, uiState.showBingoAnimation, uiState.showVictoryOverlay]);

  // Optimized rematch status calculation - skip if navigating
  useEffect(() => {
    const isOpponentConnected = uiState.opponentConnected; // Use UI state value, don't override with game logic
    
    if (!currentGame?.rematchRequests || !gameLogic.playerInfo.role || !isOpponentConnected || uiState.isNavigating) {
      if (!uiState.isNavigating) {
        setUIState(prev => ({ ...prev, rematchStatus: 'none' }));
      }
    } else {
      const opponentRole = gameLogic.playerInfo.role === 'challenger' ? 'acceptor' : 'challenger';
      const [iRequested, opponentRequested] = [
        currentGame.rematchRequests[gameLogic.playerInfo.role as keyof typeof currentGame.rematchRequests],
        currentGame.rematchRequests[opponentRole as keyof typeof currentGame.rematchRequests]
      ];
      // Don't set to 'accepted' - just keep previous status to avoid button flickering
      const newStatus = iRequested && opponentRequested ? (uiState.rematchStatus === 'requested' ? 'requested' : 'waiting') : iRequested ? 'waiting' : opponentRequested ? 'requested' : 'none';
      setUIState(prev => ({ ...prev, rematchStatus: newStatus }));
    }
  }, [currentGame, gameLogic.playerInfo, uiState.isNavigating, uiState.rematchStatus, uiState.opponentConnected]);

  // Cleanup effect to handle navigation away / tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Don't send playerLeaving if we're navigating to a rematch
      if (uiState.isNavigating) return;
      
      // Notify server that player is leaving
      if (currentGame && gameLogic.playerInfo.current) {
        sendSocketMessage('game:playerLeaving', {
          gameId: currentGame.gameId,
          playerId: gameLogic.playerInfo.current.playerId
        });
      }
    };

    const handleVisibilityChange = () => {
      // Don't send playerInactive if we're navigating to a rematch or if game is completed
      if (document.hidden && currentGame && gameLogic.playerInfo.current && 
          !uiState.isNavigating && currentGame.status !== 'completed') {
        // Player switched tabs or minimized window
        sendSocketMessage('game:playerInactive', {
          gameId: currentGame.gameId,
          playerId: gameLogic.playerInfo.current.playerId
        });
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function - runs when component unmounts or dependencies change
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // DON'T send playerLeaving on component unmount - this happens during normal navigation
      // Only send playerLeaving on actual tab close (beforeunload event handles this)
    };
  }, [currentGame, gameLogic.playerInfo, sendSocketMessage, uiState.isNavigating]);

  // Loading state
  // Optimized loading state: show only if initial fetch is running or not connected
  if (!isConnected || !user || initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-x-hidden">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="text-xl font-semibold text-teal-400">Loading game...</div>
          </div>
        </div>
      </div>
    );
  }
  
  // Game not found state - only show if fetch failed and we're not loading
  if (!currentGame && fetchFailed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-x-hidden">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <div className="text-xl font-medium text-red-400">Game not found</div>
            <button 
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-2xl font-semibold hover:from-teal-500 hover:to-teal-400 transition-all duration-300 shadow-lg"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-x-hidden flex flex-col"
      style={{ minHeight: '100vh', height: '100vh', maxHeight: '100vh' }}
    >
      {/* Notification Banner */}
      {uiState.notification && (
        <NotificationBanner 
          {...uiState.notification} 
          onClose={() => setUIState(prev => ({ ...prev, notification: null }))} 
        />
      )}

      {/* First Player Selection Overlay */}
      {uiState.showFirstPlayerOverlay && currentGame?.players?.challenger && currentGame?.players?.acceptor && gameLogic.playerInfo.role && (
        <PlayerSelectionOverlay
          currentPlayer={currentGame.players[gameLogic.playerInfo.role as 'challenger' | 'acceptor'] || { playerId: '', name: '', status: 'waiting', connected: false }}
          opponent={currentGame.players[gameLogic.playerInfo.role === 'challenger' ? 'acceptor' : 'challenger'] || { playerId: '', name: '', status: 'waiting', connected: false }}
          firstPlayerId={currentGame.currentTurn || ''}
          onFinish={() => setUIState(prev => ({ ...prev, showFirstPlayerOverlay: false }))}
          isNavigating={uiState.isNavigating}
        />
      )}

      {/* Rematch Transition Loading Overlay */}
      {uiState.isNavigating && (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 z-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="text-xl font-semibold text-teal-400">Starting Rematch...</div>
          </div>
        </div>
      )}

      {!uiState.showFirstPlayerOverlay && (
        <div className="flex-1 flex flex-col justify-between px-4" style={{ minHeight: '0' }}>
          <div className="w-full mx-auto" style={{ maxWidth: '96vw' }}>
            {/* Game Header */}
            <div className="w-full" style={{ marginTop: '1vh' }}>
              <GameHeader
                currentGame={currentGame}
                currentPlayer={currentGame?.players?.[gameLogic.playerInfo.role as 'challenger' | 'acceptor' || 'challenger'] || null}
                opponent={currentGame?.players?.[gameLogic.playerInfo.role === 'challenger' ? 'acceptor' : 'challenger'] || null}
                currentPlayerRole={gameLogic.playerInfo.role}
              />
            </div>

            {/* Move History */}
            <div className="w-full" style={{ maxWidth: '96vw', marginBottom: '3vh' }}>
              <MoveHistory
                moveHistory={gameLogic.moveHistory}
                currentPlayerId={gameLogic.playerInfo.current?.playerId}
                className="py-1"
              />
            </div>

            {/* Game Bingo Card */}
            <GameBingoCard
              bingoCard={gameLogic.bingoCard}
              onCellClick={handleCellClick}
              isCellInCompletedLine={gameLogic.isCellInCompletedLine}
              currentPlayerRole={gameLogic.playerInfo.role}
              currentGame={currentGame}
              className="w-full mx-auto"
              cellPadding="py-[2vw] px-[2vw]"
            />

            {/* BINGO Progress Bar (BINGO Letters) */}
            <div className="w-full" style={{ maxWidth: '96vw', marginTop: '1vh', marginBottom: '1vh' }}>
              <BingoLetters
                activeLetters={gameLogic.activeLetters}
                markedLetters={gameLogic.markedLetters}
                onLetterClick={handleLetterClick}
                containerClassName="grid grid-cols-5 gap-[2vw]"
                letterClassName="text-center py-[2.5vw] rounded-xl font-bold text-xl transition-all duration-300 relative border-2 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* BINGO STOP Button at the bottom */}
          <div className="w-full" style={{ maxWidth: '96vw', marginBottom: '2vh' }}>
            <BingoButton
              currentGame={currentGame}
              markedLetters={gameLogic.markedLetters}
              onBingoStop={handleBingoStop}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* BINGO Animation */}
      <BingoAnimation
        isVisible={uiState.showBingoAnimation}
        isComplete={uiState.showBingoAnimation}
        markedLetters={gameLogic.markedLetters}
      />

      {/* Victory Overlay */}
      {!uiState.isNavigating && currentGame?.winner && (
      <VictoryOverlay
        isVisible={uiState.showVictoryOverlay}
        isWinner={currentGame?.winner === gameLogic.playerInfo.role}
        winnerName={
          !currentGame?.winner ? 'Unknown' :
          currentGame.winner === 'challenger' ? (currentGame.players.challenger?.name || 'Challenger') :
          currentGame.winner === 'acceptor' ? (currentGame.players.acceptor?.name || 'Acceptor') :
          'Unknown'
        }
        winnerInitial={
          !currentGame?.winner ? '?' :
          currentGame.winner === 'challenger' ? (currentGame.players.challenger?.name || 'C')[0].toUpperCase() :
          currentGame.winner === 'acceptor' ? (currentGame.players.acceptor?.name || 'A')[0].toUpperCase() :
          '?'
        }
        winnerPhotoUrl={
          !currentGame?.winner ? undefined :
          currentGame.winner === 'challenger' ? currentGame.players.challenger?.photoUrl :
          currentGame.winner === 'acceptor' ? currentGame.players.acceptor?.photoUrl :
          undefined
        }
        winReason={currentGame?.winReason}
        onClose={handleVictoryClose}
        onRematch={handleRematch}
        rematchStatus={uiState.rematchStatus}
        opponentConnected={uiState.opponentConnected}
        isNavigating={uiState.isNavigating}
      />
      )}
    </div>
  );
};

export default GamePage;
