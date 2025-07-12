import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame, useSocket, useGameLogic, useSocketHandler, useNavigationHandler } from '../hooks';
import VictoryOverlay from '../components/VictoryOverlay';
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
  const { currentGame, isLoading, fetchGame } = useGame();
  const { on } = useSocket();
  
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
  }>({ 
    showBingoAnimation: false, 
    bingoAnimationComplete: false, 
    showVictoryOverlay: false, 
    rematchStatus: 'none',
    notification: null,
    isNavigating: false
  });
  
  const fetchedRef = useRef<string | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);

  // Utility function for notifications
  const showNotification = useCallback((message: string, type: Notification['type']) => {
    setUIState(prev => ({ ...prev, notification: { message, type } }));
  }, []);

  // Effects with fetch guard and navigation handling
  useEffect(() => {
    if (!gameId) navigate('/');
    else if (fetchedRef.current !== gameId && !isLoading) {
      fetchedRef.current = gameId;
      setFetchFailed(false);
      fetchGame(gameId).catch(() => setFetchFailed(true));
    }
  }, [gameId, navigate, isLoading, fetchGame, setFetchFailed]);

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
        // Set navigation state to prevent overlay from hiding during transition
        setUIState(prev => ({ ...prev, isNavigating: true }));
        // Use setTimeout to ensure state is set before navigation
        setTimeout(() => {
          navigate(`/lobby/${newGameId}`, { replace: true });
        }, 100);
      }
    };

    const unsubscribeRequested = on('game:rematchRequested', handleRematchRequested);
    const unsubscribeAccepted = on('game:rematchAccepted', handleRematchAccepted);

    return () => {
      unsubscribeRequested();
      unsubscribeAccepted();
    };
  }, [on, gameId, navigate, fetchGame, currentGame]);

  // Game action handlers
  const handleCellClick = useCallback((row: number, col: number) => {
    if (!gameLogic.isCellClickable(row, col)) return;
    
    const clickedNumber = gameLogic.bingoCard[row][col];
    if (typeof clickedNumber !== 'number' || clickedNumber < 1 || clickedNumber > 25) return;
    
    const moveData = { gameId, number: clickedNumber, playerId: gameLogic.playerInfo.current?.playerId };
    
    const socketSuccess = sendSocketMessage('game:move', moveData, (ack: unknown) => {
      const acknowledgment = ack as { success?: boolean };
      if (!acknowledgment?.success) {
        setTimeout(() => sendSocketMessage('game:move', { ...moveData, _isRetry: true }), 1000);
      }
    });
    
    if (!socketSuccess) {
      apiCall('/games/move', moveData)
        .then(() => fetchGame(gameId!))
        .catch(() => showNotification('Move failed, will retry...', 'error'));
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
    
    setUIState(prev => ({ ...prev, showBingoAnimation: true }));
    setTimeout(() => {
      setUIState(prev => ({ ...prev, bingoAnimationComplete: true }));
      setTimeout(() => {
        if (!sendSocketMessage('game:claimBingo', { gameId, playerId: gameLogic.playerInfo.current?.playerId })) {
          apiCall(`/players/${gameId}/bingo`, { gameId, playerId: gameLogic.playerInfo.current?.playerId }).catch(console.error);
        }
        setTimeout(() => { 
          if (currentGame?.status === 'playing') {
            setUIState(prev => ({ ...prev, showBingoAnimation: false, bingoAnimationComplete: false })); 
          }
        }, 3000);
      }, 1000);
    }, 1000);
  }, [currentGame, gameLogic.markedLetters, gameLogic.playerInfo, gameId, sendSocketMessage]);

  const handleRematch = useCallback(() => {
    if (!currentGame || !gameLogic.playerInfo.current) return;
    
    const success = sendSocketMessage('game:requestRematch', { 
      gameId: currentGame.gameId, 
      playerId: gameLogic.playerInfo.current.playerId 
    });
    
    if (success) {
      setUIState(prev => ({ ...prev, rematchStatus: 'waiting' }));
    } else {
      apiCall('/games/rematch', { 
        gameId: currentGame.gameId, 
        playerId: gameLogic.playerInfo.current.playerId 
      }).catch(() => showNotification('Rematch request failed', 'error'));
    }
  }, [currentGame, gameLogic.playerInfo, sendSocketMessage, showNotification]);

  const handleVictoryClose = useCallback(() => {
    // Hide overlay and navigate to home
    setUIState(prev => ({ ...prev, showVictoryOverlay: false, isNavigating: true }));
    // Use setTimeout to ensure state update before navigation
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 100);
  }, [navigate]);

  // Victory overlay and rematch status logic
  useEffect(() => {
    const isCompleted = currentGame?.status === 'completed';
    const hasWinner = !!currentGame?.winner;
    const isOpponentConnected = gameLogic.playerInfo.opponent?.connected || false;

    setUIState(prev => ({
      ...prev,
      showVictoryOverlay: isCompleted && hasWinner,
      showBingoAnimation: false,
      bingoAnimationComplete: false
    }));

    // Optimized rematch status calculation
    if (!currentGame?.rematchRequests || !gameLogic.playerInfo.role || !isOpponentConnected) {
      setUIState(prev => ({ ...prev, rematchStatus: 'none' }));
    } else {
      const opponentRole = gameLogic.playerInfo.role === 'challenger' ? 'acceptor' : 'challenger';
      const [iRequested, opponentRequested] = [
        currentGame.rematchRequests[gameLogic.playerInfo.role as keyof typeof currentGame.rematchRequests],
        currentGame.rematchRequests[opponentRole as keyof typeof currentGame.rematchRequests]
      ];
      const newStatus = iRequested && opponentRequested ? 'accepted' : iRequested ? 'waiting' : opponentRequested ? 'requested' : 'none';
      setUIState(prev => ({ ...prev, rematchStatus: newStatus }));
    }
  }, [currentGame, gameLogic.playerInfo]);

  // Loading state
  // Show loading while explicitly loading, or while we have attempted fetch but no result yet
  if (isLoading || (fetchedRef.current === gameId && !currentGame && !fetchFailed)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-x-hidden">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-teal-400/30 border-t-teal-400 rounded-full mx-auto"></div>
            <div className="text-xl font-medium text-teal-400">Loading game...</div>
          </div>
        </div>
      </div>
    );
  }
  
  // Game not found state - only show if fetch failed and we're not loading
  if (!currentGame && fetchFailed && !isLoading) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-x-hidden">
      {/* Notification Banner */}
      {uiState.notification && (
        <NotificationBanner 
          {...uiState.notification} 
          onClose={() => setUIState(prev => ({ ...prev, notification: null }))} 
        />
      )}

      <div className="px-4 pt-7 pb-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* Game Header */}
          <GameHeader
            currentGame={currentGame}
            currentPlayer={gameLogic.playerInfo.current || null}
            opponent={gameLogic.playerInfo.opponent || null}
            currentPlayerRole={gameLogic.playerInfo.role}
          />

          {/* Move History */}
          <MoveHistory
            moveHistory={gameLogic.moveHistory}
            currentPlayerId={gameLogic.playerInfo.current?.playerId}
          />

          {/* Game Bingo Card */}
          <GameBingoCard
            bingoCard={gameLogic.bingoCard}
            onCellClick={handleCellClick}
            isCellInCompletedLine={gameLogic.isCellInCompletedLine}
            currentPlayerRole={gameLogic.playerInfo.role}
            currentGame={currentGame}
          />

          {/* BINGO Letters */}
          <BingoLetters
            activeLetters={gameLogic.activeLetters}
            markedLetters={gameLogic.markedLetters}
            onLetterClick={handleLetterClick}
          />

          {/* BINGO STOP Button */}
          <BingoButton
            currentGame={currentGame}
            markedLetters={gameLogic.markedLetters}
            onBingoStop={handleBingoStop}
          />
        </div>
      </div>

      {/* BINGO Animation */}
      <BingoAnimation
        isVisible={uiState.showBingoAnimation}
        isComplete={uiState.bingoAnimationComplete}
        markedLetters={gameLogic.markedLetters}
      />

      {/* Victory Overlay */}
      <VictoryOverlay
        isVisible={uiState.showVictoryOverlay}
        isWinner={currentGame?.winner === gameLogic.playerInfo.role}
        winnerName={currentGame?.winner === 'challenger' ? currentGame.players.challenger?.name || 'Challenger' : currentGame?.winner === 'acceptor' ? currentGame.players.acceptor?.name || 'Acceptor' : 'Unknown'}
        winnerInitial={currentGame?.winner === 'challenger' ? (currentGame.players.challenger?.name || 'C')[0].toUpperCase() : currentGame?.winner === 'acceptor' ? (currentGame.players.acceptor?.name || 'A')[0].toUpperCase() : '?'}
        winReason={currentGame?.winReason}
        onClose={handleVictoryClose}
        onRematch={handleRematch}
        rematchStatus={uiState.rematchStatus}
        opponentConnected={gameLogic.playerInfo.opponent?.connected || false}
        isNavigating={uiState.isNavigating}
      />
    </div>
  );
};

export default GamePage;
