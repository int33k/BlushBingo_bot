import { useState, useCallback, useMemo } from 'react';
import { useGame, useUser } from './index';
import { LINE_PATTERNS, CARD_SIZE } from '../shared-adapter';
import type { Move } from '../types';

export const useGameLogic = () => {
  const { currentGame } = useGame();
  const { user } = useUser();

  // Local state for game UI
  const [bingoCard, setBingoCard] = useState<(number | null)[][]>(() => 
    Array(5).fill(null).map(() => Array(5).fill(0))
  );
  const [moveHistory, setMoveHistory] = useState<Array<{ playerId?: string; number: number; value: number }>>([]);
  const [activeLetters, setActiveLetters] = useState<boolean[]>(Array(5).fill(false));
  const [markedLetters, setMarkedLetters] = useState<boolean[]>(Array(5).fill(false));
  const [completedLinesHistory, setCompletedLinesHistory] = useState<number[]>([]);

  // Memoized player info & game state
  const playerInfo = useMemo(() => {
    if (!currentGame || !user) return { role: null, current: null, opponent: null };
    
    const role = currentGame.players.challenger?.playerId === user.identifier ? 'challenger' 
      : currentGame.players.acceptor?.playerId === user.identifier ? 'acceptor' 
      : null;
    
    const current = role ? currentGame.players[role] : null;
    const opponent = role ? currentGame.players[role === 'challenger' ? 'acceptor' : 'challenger'] : null;

    return { role, current, opponent };
  }, [currentGame, user]);

  // Find all currently completed lines
  const currentCompletedLines = useMemo(() => {
    if (!bingoCard || !playerInfo.current) return [];
    
    const completed: number[] = [];
    
    LINE_PATTERNS.forEach((pattern, index: number) => {
      const isComplete = pattern.cells.every(({ row, col }: { row: number; col: number }) => {
        const cellValue = bingoCard[row][col];
        return cellValue === null; // Cell is marked (null means marked)
      });
      
      if (isComplete) {
        completed.push(index);
      }
    });
    
    return completed;
  }, [bingoCard, playerInfo]);

  // Check if cell is in completed line
  const isCellInCompletedLine = useMemo(() => {
    const markedLineIndices = markedLetters.map((marked, index) => marked ? index : -1).filter(index => index !== -1);
    const completedLineCells = new Set<string>();
    
    markedLineIndices.forEach((letterIndex) => {
      const lineIndex = completedLinesHistory[letterIndex];
      if (lineIndex !== undefined) {
        const pattern = LINE_PATTERNS[lineIndex];
        pattern.cells.forEach(({ row, col }: { row: number; col: number }) => {
          completedLineCells.add(`${row}-${col}`);
        });
      }
    });
    
    return (row: number, col: number) => completedLineCells.has(`${row}-${col}`);
  }, [completedLinesHistory, markedLetters]);

  // Check if cell is clickable
  const isCellClickable = useCallback((row: number, col: number) => {
    const isMyTurn = currentGame?.currentTurn === playerInfo.role;
    return !!(
      bingoCard && 
      row >= 0 && row < CARD_SIZE && 
      col >= 0 && col < CARD_SIZE && 
      bingoCard[row][col] !== null && 
      currentGame?.status === 'playing' && 
      isMyTurn
    );
  }, [bingoCard, currentGame, playerInfo.role]);

  // Update bingo card from game state
  const updateBingoCard = useCallback(() => {
    if (currentGame && playerInfo.current?.card) {
      setBingoCard(playerInfo.current.card.map((row: number[]) => 
        row.map((cell: number) => 
          (playerInfo.current?.markedCells || []).includes(cell) ? null : cell
        )
      ));
    }
  }, [currentGame, playerInfo]);

  // Update move history from game state
  const updateMoveHistory = useCallback(() => {
    if (currentGame?.moves) {
      setMoveHistory(currentGame.moves.map((move: Move) => ({ ...move, number: move.value })));
    }
  }, [currentGame]);

  // Update completed lines tracking
  const updateCompletedLines = useCallback(() => {
    setCompletedLinesHistory(prev => {
      // Compare current completed lines with history
      const newLines = currentCompletedLines.filter(lineIndex => 
        !prev.includes(lineIndex)
      );

      if (newLines.length > 0) {
        return [...prev, ...newLines];
      }
      
      // Reset if no lines are completed but we have history
      if (currentCompletedLines.length === 0 && prev.length > 0) {
        return [];
      }
      
      return prev;
    });
  }, [currentCompletedLines]);

  // Update active letters based on completed lines
  const updateActiveLetters = useCallback(() => {
    setActiveLetters(prev => {
      const newActiveLetters = Array(5).fill(false);
      for (let i = 0; i < Math.min(completedLinesHistory.length, 5); i++) {
        newActiveLetters[i] = true;
      }
      
      // Only update if different
      if (JSON.stringify(prev) !== JSON.stringify(newActiveLetters)) {
        return newActiveLetters;
      }
      return prev;
    });
    
    // Reset marked letters if we have fewer completed lines than marked letters
    if (completedLinesHistory.length === 0) {
      setMarkedLetters(prev => {
        const resetLetters = [false, false, false, false, false];
        return JSON.stringify(prev) !== JSON.stringify(resetLetters) ? resetLetters : prev;
      });
    }
  }, [completedLinesHistory]);

  return {
    // State
    bingoCard,
    setBingoCard,
    moveHistory,
    setMoveHistory,
    activeLetters,
    setActiveLetters,
    markedLetters,
    setMarkedLetters,
    completedLinesHistory,
    setCompletedLinesHistory,
    
    // Computed values
    playerInfo,
    currentCompletedLines,
    isCellInCompletedLine,
    isCellClickable,
    
    // Update functions
    updateBingoCard,
    updateMoveHistory,
    updateCompletedLines,
    updateActiveLetters
  };
};
