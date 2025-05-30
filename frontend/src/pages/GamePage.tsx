import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame, useUser, useSocket } from '../hooks';
import ConnectionStatus from '../components/ConnectionStatus';
import VictoryOverlay from '../components/VictoryOverlay';
import type { Notification, Move } from '../types';
import { LINE_PATTERNS } from '../../../shared/game/logic';
import { BINGO_LETTERS, CARD_SIZE } from '../../../shared/constants/game';
import type { LinePattern } from '../../../shared/game/logic';

// Constants & Utils
const CELL_SIZE = 64;
const LETTERS = BINGO_LETTERS;
const generateId = () => `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
const apiCall = async (endpoint: string, data: Record<string, unknown>) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(`API call failed: ${res.status}`);
  return res.json();
};

const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { currentGame, isLoading, fetchGame } = useGame();
  const { user } = useUser();
  const { isConnected, emit } = useSocket();

  // Consolidated state with useMemo for performance
  const [bingoCard, setBingoCard] = useState<(number | null)[][]>(() => Array(5).fill(null).map(() => Array(5).fill(0)));
  const [moveHistory, setMoveHistory] = useState<Array<{ playerId?: string; number: number; value: number }>>([]);
  const [activeLetters, setActiveLetters] = useState<boolean[]>(Array(5).fill(false));
  const [markedLetters, setMarkedLetters] = useState<boolean[]>(Array(5).fill(false));
  const [uiState, setUIState] = useState<{ showBingoAnimation: boolean; bingoAnimationComplete: boolean; showVictoryOverlay: boolean; rematchStatus: 'none' | 'requested' | 'waiting' | 'accepted' }>({ showBingoAnimation: false, bingoAnimationComplete: false, showVictoryOverlay: false, rematchStatus: 'none' });
  const [, setNotifications] = useState<Notification[]>([]);
  const movesContainerRef = useRef<HTMLDivElement>(null);

  // Memoized player info & game state
  const { role: currentPlayerRole, current: currentPlayer, opponent, completedLines, isCellInCompletedLine } = useMemo(() => {
    if (!currentGame || !user) return { role: null, current: null, opponent: null, completedLines: [], isCellInCompletedLine: () => false };
    const role = currentGame.players.challenger?.playerId === user.identifier ? 'challenger' : currentGame.players.acceptor?.playerId === user.identifier ? 'acceptor' : null;
    const current = role ? currentGame.players[role] : null;
    const opponent = role ? currentGame.players[role === 'challenger' ? 'acceptor' : 'challenger'] : null;



    const completedLines = !bingoCard || !current ? [] : LINE_PATTERNS.filter((pattern: LinePattern) => pattern.cells.every(({ row, col }: { row: number; col: number }) => {
      const cellValue = bingoCard[row][col];
      return cellValue === null || (current.markedCells || []).includes(cellValue);
    }));

    const isCellInCompletedLine = (row: number, col: number) => completedLines.some((line: LinePattern) => line.cells.some((cell: { row: number; col: number }) => cell.row === row && cell.col === col));

    return { role, current, opponent, completedLines, isCellInCompletedLine };
  }, [currentGame, user, bingoCard]);

  // Effects with fetch guard
  const fetchedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!gameId) navigate('/');
    else if (fetchedRef.current !== gameId && !isLoading) {
      fetchedRef.current = gameId;
      fetchGame(gameId).catch(() => fetchedRef.current = null);
    }
  }, [gameId, navigate, isLoading, fetchGame]);
  useEffect(() => {
    if (currentGame && currentPlayer?.card) {
      setBingoCard(currentPlayer.card.map((row: number[]) => row.map((cell: number) => (currentPlayer.markedCells || []).includes(cell) ? null : cell)));
    }
    if (currentGame?.moves) setMoveHistory(currentGame.moves.map((move: Move) => ({ ...move, number: move.value })));
  }, [currentGame, currentPlayer]);
  useEffect(() => { const container = movesContainerRef.current; if (container) setTimeout(() => container.scrollLeft = container.scrollWidth, 50); }, [moveHistory]);

  // Handlers
  const sendSocketMessage = useCallback((event: string, data: Record<string, unknown>, callback?: (ack: unknown) => void) => {
    if (emit) { emit(event, { ...data, _messageId: generateId(), _clientTimestamp: Date.now() }, callback); return true; }
    return false;
  }, [emit]);

  const handleCellClick = useCallback((row: number, col: number) => {
    const isMyTurn = currentGame?.currentTurn === currentPlayerRole;
    if (!bingoCard || row < 0 || row >= CARD_SIZE || col < 0 || col >= CARD_SIZE || bingoCard[row][col] === null || currentGame?.status !== 'playing' || !isMyTurn) {
      if (!isMyTurn) setNotifications(prev => [...prev, { id: generateId(), message: "It's not your turn!", type: 'error', duration: 2000 }]);
      return;
    }
    const clickedNumber = bingoCard[row][col];
    if (typeof clickedNumber !== 'number' || clickedNumber < 1 || clickedNumber > 25) return;
    const moveData = { gameId, number: clickedNumber, playerId: currentPlayer?.playerId };
    let socketSuccess = false;
    if (isConnected) {
      socketSuccess = sendSocketMessage('game:move', moveData, (ack: unknown) => {
        const acknowledgment = ack as { success?: boolean };
        if (!acknowledgment?.success) setTimeout(() => sendSocketMessage('game:move', { ...moveData, _isRetry: true }), 1000);
      });
    }
    if (!socketSuccess) {
      apiCall('/games/move', moveData).then(() => fetchGame(gameId!)).catch(() =>
        setNotifications(prev => [...prev, { id: generateId(), message: 'Move failed, will retry...', type: 'error', duration: 3000 }]));
    }
  }, [bingoCard, currentGame, currentPlayerRole, gameId, currentPlayer, isConnected, sendSocketMessage, fetchGame]);

  const handleLetterClick = useCallback((index: number) => {
    if (!activeLetters[index] || markedLetters[index] || index >= completedLines.length || !currentPlayer) return;
    const lineToMark = completedLines[index];
    if (!lineToMark) return;
    const cellsToMark = lineToMark.cells.filter((cell: { row: number; col: number }) => {
      const cellValue = bingoCard[cell.row]?.[cell.col];
      return cellValue !== null && !(currentPlayer.markedCells || []).includes(cellValue);
    });
    if (cellsToMark.length === 0) { setMarkedLetters((prev: boolean[]) => { const updated = [...prev]; updated[index] = true; return updated; }); return; }
    const numbersToMark = cellsToMark.map((cell: { row: number; col: number }) => bingoCard[cell.row][cell.col]).filter((num: unknown): num is number => typeof num === 'number');
    if (numbersToMark.length > 0) {
      if (!sendSocketMessage('game:markLine', { gameId, playerId: currentPlayer.playerId, numbers: numbersToMark, lineIndex: index })) {
        cellsToMark.forEach((cell: { row: number; col: number }, i: number) => setTimeout(() => handleCellClick(cell.row, cell.col), i * 200));
      }
    }
    setMarkedLetters((prev: boolean[]) => { const updated = [...prev]; updated[index] = true; return updated; });
  }, [activeLetters, markedLetters, completedLines, bingoCard, currentPlayer, gameId, sendSocketMessage, handleCellClick]);

  const handleBingoStop = useCallback(() => {
    if (currentGame?.status !== 'playing' || completedLines.length < 5) return;
    setUIState(prev => ({ ...prev, showBingoAnimation: true }));
    setTimeout(() => {
      setUIState(prev => ({ ...prev, bingoAnimationComplete: true }));
      setTimeout(() => {
        if (!sendSocketMessage('game:claimBingo', { gameId, playerId: currentPlayer?.playerId })) {
          apiCall(`/players/${gameId}/bingo`, { gameId, playerId: currentPlayer?.playerId }).catch(console.error);
        }
        setTimeout(() => { if (currentGame?.status === 'playing') setUIState(prev => ({ ...prev, showBingoAnimation: false, bingoAnimationComplete: false })); }, 5000);
      }, 1500);
    }, 1500);
  }, [currentGame, completedLines.length, gameId, currentPlayer, sendSocketMessage]);

  const handleRematch = useCallback(() => {
    if (!currentGame || !currentPlayer || !sendSocketMessage('game:requestRematch', { gameId: currentGame.gameId, playerId: currentPlayer.playerId })) return;
    setUIState(prev => ({ ...prev, rematchStatus: 'waiting' }));
  }, [currentGame, currentPlayer, sendSocketMessage]);

  const handleVictoryClose = useCallback(() => setUIState(prev => ({ ...prev, showVictoryOverlay: false })), []);



  // Consolidated Effects
  useEffect(() => {
    const newActiveLetters = Array(5).fill(false);
    for (let i = 0; i < Math.min(completedLines.length, 5); i++) newActiveLetters[i] = true;
    setActiveLetters(newActiveLetters);
    setMarkedLetters((prev: boolean[]) => prev.map((marked: boolean, i: number) => marked && newActiveLetters[i]));
  }, [completedLines]);

  useEffect(() => {
    // Victory overlay and rematch status logic
    const isCompleted = currentGame?.status === 'completed';
    const hasWinner = !!currentGame?.winner;
    const isOpponentConnected = opponent?.connected || false;

    setUIState(prev => ({
      ...prev,
      showVictoryOverlay: isCompleted && hasWinner,
      showBingoAnimation: false,
      bingoAnimationComplete: false
    }));

    // Optimized rematch status calculation
    if (!currentGame?.rematchRequests || !currentPlayerRole || !isOpponentConnected) {
      setUIState(prev => ({ ...prev, rematchStatus: 'none' }));
    } else {
      const opponentRole = currentPlayerRole === 'challenger' ? 'acceptor' : 'challenger';
      const [iRequested, opponentRequested] = [
        currentGame.rematchRequests[currentPlayerRole as keyof typeof currentGame.rematchRequests],
        currentGame.rematchRequests[opponentRole as keyof typeof currentGame.rematchRequests]
      ];
      const newStatus = iRequested && opponentRequested ? 'accepted' : iRequested ? 'waiting' : opponentRequested ? 'requested' : 'none';
      setUIState(prev => ({ ...prev, rematchStatus: newStatus }));
    }
  }, [currentGame, currentPlayerRole, opponent]);

  if (isLoading) return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center"><div className="text-white text-xl">Loading game...</div></div>;
  if (!currentGame) return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center"><div className="text-white text-xl">Game not found</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-x-hidden">
      <div className="absolute top-2 right-2 z-10"><ConnectionStatus /></div>
      <div className="px-4 pt-4 pb-6"><div className="max-w-md mx-auto space-y-4">
        {/* Player Info */}
        <div className="flex justify-between items-center w-full max-w-[320px] mx-auto">
          <div className="flex items-center gap-2">
            <div className={`w-14 h-14 rounded-full border-2 border-teal-400 ${currentGame.currentTurn === currentPlayerRole ? 'shadow-[0_0_15px_#4FD1C5] scale-110' : ''} bg-slate-700 flex items-center justify-center transition-all duration-300`}>
              <span className="text-teal-400 font-bold text-lg">{currentPlayer?.name?.charAt(0) || 'Y'}</span>
            </div>
            <span className="text-white font-semibold text-sm">{currentPlayer?.name || 'You'}</span>
          </div>
          <div className="text-violet-400 font-bold text-lg">VS</div>
          <div className="flex items-center gap-2 flex-row-reverse">
            <div className={`w-14 h-14 rounded-full border-2 border-purple-400 ${currentGame.currentTurn !== currentPlayerRole ? 'shadow-[0_0_15px_#8B5CF6] scale-110' : ''} bg-slate-700 flex items-center justify-center transition-all duration-300`}>
              <span className="text-purple-400 font-bold text-lg">{opponent?.name?.charAt(0) || 'O'}</span>
            </div>
            <span className="text-white font-semibold text-sm">{opponent?.name || 'Opponent'}</span>
          </div>
        </div>
        {/* Move History */}
        <div className="w-full max-w-[320px] mx-auto"><div className="bg-slate-800/80 rounded-xl p-3 border border-teal-400/30">
          <div ref={movesContainerRef} className="flex gap-2 overflow-x-auto scrollbar-hide h-12 items-center" style={{ scrollBehavior: 'smooth' }}>
            {moveHistory.length > 0 ? moveHistory.map((move, index) => {
              const isUserMove = move.playerId === currentPlayer?.playerId;
              const color = isUserMove ? '#4FD1C5' : '#8B5CF6';
              return <div key={index} className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border" style={{ color, backgroundColor: 'rgba(15,23,42,0.7)', borderColor: color, boxShadow: `0 0 5px ${color}` }}>{move.value || move.number}</div>;
            }) : <div className="text-teal-400 text-sm italic opacity-80 w-full text-center">No moves yet</div>}
          </div>
        </div></div>
        {/* Bingo Card */}
        <div className="w-full max-w-[320px] mx-auto"><div className="bg-slate-800/80 rounded-xl p-3 border-2 border-teal-400/50">
          <div className="grid grid-cols-5 gap-1" style={{ width: CELL_SIZE * 5, height: CELL_SIZE * 5 }}>
            {bingoCard.map((row, rowIndex) => row.map((cell, colIndex) => {
              const isInCompletedLine = isCellInCompletedLine(rowIndex, colIndex);
              return <div key={`${rowIndex}-${colIndex}`} onClick={() => handleCellClick(rowIndex, colIndex)} className={`flex items-center justify-center text-lg font-bold rounded-lg transition-all duration-200 cursor-pointer relative ${cell === null ? (isInCompletedLine ? 'bg-red-500/20 text-red-500 border-2 border-red-500 shadow-[0_0_10px_#EF4444]' : 'bg-slate-600/50 text-red-500 border border-red-500/30') : 'bg-slate-700 text-white border border-teal-400/30 hover:bg-slate-600'} ${currentGame?.currentTurn === currentPlayerRole && cell !== null ? 'hover:scale-105 hover:shadow-lg' : ''}`} style={{ width: CELL_SIZE, height: CELL_SIZE, cursor: currentGame?.currentTurn === currentPlayerRole && cell !== null ? 'pointer' : 'default' }}>
                {cell === null ? '/' : cell}
                {isInCompletedLine && cell === null && <div className="absolute inset-0 bg-red-500/10 border border-red-500/50 rounded-lg" />}
              </div>;
            }))}
          </div>
        </div></div>
        {/* BINGO Letters */}
        <div className="w-full max-w-[320px] mx-auto"><div className="grid grid-cols-5 gap-2">
          {LETTERS.map((letter: string, idx: number) => {
            const active = activeLetters[idx]; const marked = markedLetters[idx];
            return <div key={letter} onClick={() => active && !marked && handleLetterClick(idx)} className={`text-center py-3 rounded-lg font-bold text-2xl transition-all duration-300 relative ${active ? (marked ? 'text-red-500 bg-red-500/20 border-2 border-red-500 shadow-[0_0_15px_#EF4444]' : 'text-red-500 border-2 border-red-500/50 hover:bg-red-500/10 cursor-pointer') : 'text-red-500/40 border border-red-500/20'}`}>
              {letter}
              {active && !marked && <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{idx + 1}</div>}
              {marked && <div className="absolute inset-0 flex items-center justify-center text-red-500 text-4xl font-bold">/</div>}
            </div>;
          })}
        </div></div>
        {/* BINGO STOP Button */}
        {completedLines.length >= 5 && <div className="w-full max-w-[320px] mx-auto">
          <button onClick={handleBingoStop} disabled={currentGame?.status !== 'playing' || completedLines.length < 5} className={`w-full py-4 text-white text-xl font-bold rounded-xl transition-all duration-300 ${currentGame?.status === 'playing' && completedLines.length >= 5 ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-[0_0_20px_#EF4444] hover:shadow-[0_0_30px_#EF4444] animate-pulse cursor-pointer' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}>BINGO STOP!</button>
        </div>}
      </div></div>

      {/* BINGO Animation */}
      {uiState.showBingoAnimation && <div className="fixed inset-0 bg-slate-900/90 flex flex-col items-center justify-center z-50">
        <div className="flex items-center justify-center relative h-24 mb-8 w-80">
          <div className="absolute top-1/2 left-0 h-2 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-[0_0_15px_#EF4444] transition-all duration-1000" style={{ width: uiState.bingoAnimationComplete ? '100%' : '0%', transform: 'translateY(-50%)' }} />
          {LETTERS.map((letter: string, idx: number) => <div key={letter} className="relative z-10 w-16 h-16 mx-2 flex items-center justify-center bg-slate-800/80 rounded-xl border-2 border-red-500 shadow-[0_0_15px_#EF4444]" style={{ animation: `bounce 0.5s ${idx * 0.2}s, pulse 1.5s ${idx * 0.2 + 0.5}s infinite`, fontSize: '2rem', fontWeight: '800', color: '#EF4444', textShadow: '0 0 20px #EF4444' }}>
            {letter}
            {markedLetters[idx] && <div className="absolute inset-0 flex items-center justify-center text-red-500 text-4xl font-bold">/</div>}
          </div>)}
        </div>
        {uiState.bingoAnimationComplete && <div className="text-4xl font-bold text-yellow-400 animate-pulse" style={{ textShadow: '0 0 15px #FCD34D', animation: 'fadeIn 1s ease' }}>🏆 BINGO! 🏆</div>}
        <style>{`@keyframes bounce { 0%, 20%, 50%, 80%, 100% {transform: translateY(0);} 40% {transform: translateY(-30px);} 60% {transform: translateY(-15px);} } @keyframes pulse { 0% {transform: scale(1);} 50% {transform: scale(1.1);} 100% {transform: scale(1);} } @keyframes fadeIn { from {opacity: 0;} to {opacity: 1;} }`}</style>
      </div>}

      {/* Victory Overlay */}
      <VictoryOverlay
        isVisible={uiState.showVictoryOverlay}
        isWinner={currentGame?.winner === currentPlayerRole}
        winnerName={currentGame?.winner === 'challenger' ? currentGame.players.challenger?.name || 'Challenger' : currentGame?.winner === 'acceptor' ? currentGame.players.acceptor?.name || 'Acceptor' : 'Unknown'}
        winnerInitial={currentGame?.winner === 'challenger' ? (currentGame.players.challenger?.name || 'C')[0].toUpperCase() : currentGame?.winner === 'acceptor' ? (currentGame.players.acceptor?.name || 'A')[0].toUpperCase() : '?'}
        onClose={handleVictoryClose}
        onRematch={handleRematch}
        rematchStatus={uiState.rematchStatus}
        opponentConnected={opponent?.connected || false}
      />
    </div>
  );
};

export default GamePage;
