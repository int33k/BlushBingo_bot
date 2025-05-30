/**
 * Shared Game Logic - Consolidated from frontend and backend
 * Eliminates duplication between LINE_PATTERNS and game logic
 */

import { CARD_SIZE, BINGO_LETTERS } from '../constants/game';

// Type definitions for line patterns
export interface CellPosition {
  row: number;
  col: number;
}

export interface LinePattern {
  cells: CellPosition[];
}

// Helper function to create line patterns
function createLinePatterns(): LinePattern[] {
  const patterns: LinePattern[] = [];
  
  // Rows
  for (let i = 0; i < CARD_SIZE; i++) {
    const cells: CellPosition[] = [];
    for (let j = 0; j < CARD_SIZE; j++) {
      cells.push({ row: i, col: j });
    }
    patterns.push({ cells });
  }
  
  // Columns
  for (let i = 0; i < CARD_SIZE; i++) {
    const cells: CellPosition[] = [];
    for (let j = 0; j < CARD_SIZE; j++) {
      cells.push({ row: j, col: i });
    }
    patterns.push({ cells });
  }
  
  // Main diagonal
  const mainDiag: CellPosition[] = [];
  for (let i = 0; i < CARD_SIZE; i++) {
    mainDiag.push({ row: i, col: i });
  }
  patterns.push({ cells: mainDiag });
  
  // Anti-diagonal
  const antiDiag: CellPosition[] = [];
  for (let i = 0; i < CARD_SIZE; i++) {
    antiDiag.push({ row: i, col: CARD_SIZE - 1 - i });
  }
  patterns.push({ cells: antiDiag });
  
  return patterns;
}

// Optimized line patterns - consolidated from frontend GamePage.tsx
export const LINE_PATTERNS: LinePattern[] = createLinePatterns();

// Optimized line checking functions - consolidated from backend gameLogic.ts
export const generateLines = (card: number[][]): number[][] => {
  const lines: number[][] = [];
  
  // Rows - use spread operator for better performance
  lines.push(...card.map(row => [...row]));
  
  // Columns - more efficient column extraction
  for (let j = 0; j < CARD_SIZE; j++) {
    lines.push(card.map(row => row[j]));
  }
  
  // Main diagonal - single pass
  lines.push(card.map((row, i) => row[i]));
  
  // Anti-diagonal - single pass
  lines.push(card.map((row, i) => row[CARD_SIZE - 1 - i]));
  
  return lines;
};

export const isLineComplete = (line: number[], markedCells: Array<string | number>): boolean => {
  // Convert markedCells to lookup object for O(1) lookup instead of O(n) search
  const markedLookup: Record<string | number, boolean> = {};
  for (let i = 0; i < markedCells.length; i++) {
    markedLookup[markedCells[i]] = true;
  }
  
  return line.every(cell => markedLookup[cell]);
};

export const checkCompletedLines = (card: number[][], markedCells: Array<string | number>) => {
  if (!card?.length || !markedCells?.length) {
    return { completedLines: 0, markedLetters: [] };
  }
  
  const lines = generateLines(card);
  const completedCount = lines.filter(line => isLineComplete(line, markedCells)).length;
  
  return {
    completedLines: completedCount,
    markedLetters: BINGO_LETTERS.slice(0, Math.min(completedCount, 5))
  };
};

// Position lookup utilities
export const generatePositionMap = (card: number[][]) => {
  const positionMap: Record<number, [number, number]> = {};
  card.forEach((row, r) => {
    row.forEach((num, c) => {
      positionMap[num] = [r, c];
    });
  });
  return positionMap;
};

export const generateLookupTable = (card1: number[][], card2: number[][]): number[][] => {
  const map1 = generatePositionMap(card1);
  const map2 = generatePositionMap(card2);
  
  const result: number[][] = [];
  for (let i = 0; i < 75; i++) {
    const number = i + 1;
    const pos1 = map1[number] || [-1, -1];
    const pos2 = map2[number] || [-1, -1];
    result.push([pos1[0], pos1[1], pos2[0], pos2[1]]);
  }
  return result;
};
