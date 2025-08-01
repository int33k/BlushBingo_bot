"use strict";
/**
 * Shared Game Logic - Consolidated from frontend and backend
 * Eliminates duplication between LINE_PATTERNS and game logic
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLookupTable = exports.generatePositionMap = exports.checkCompletedLines = exports.isLineComplete = exports.generateLines = exports.LINE_PATTERNS = void 0;
const game_1 = require("../constants/game");
// Pre-computed static line patterns for better performance
const STATIC_LINE_PATTERNS = (() => {
    const patterns = [];
    // Rows - pre-computed
    for (let i = 0; i < game_1.CARD_SIZE; i++) {
        const cells = [];
        for (let j = 0; j < game_1.CARD_SIZE; j++) {
            cells.push({ row: i, col: j });
        }
        patterns.push({ cells });
    }
    // Columns - pre-computed
    for (let i = 0; i < game_1.CARD_SIZE; i++) {
        const cells = [];
        for (let j = 0; j < game_1.CARD_SIZE; j++) {
            cells.push({ row: j, col: i });
        }
        patterns.push({ cells });
    }
    // Main diagonal - pre-computed
    const mainDiag = [];
    for (let i = 0; i < game_1.CARD_SIZE; i++) {
        mainDiag.push({ row: i, col: i });
    }
    patterns.push({ cells: mainDiag });
    // Anti-diagonal - pre-computed
    const antiDiag = [];
    for (let i = 0; i < game_1.CARD_SIZE; i++) {
        antiDiag.push({ row: i, col: game_1.CARD_SIZE - 1 - i });
    }
    patterns.push({ cells: antiDiag });
    return patterns;
})();
// Helper function to create line patterns
function createLinePatterns() {
    return STATIC_LINE_PATTERNS;
}
// Optimized line patterns - consolidated from frontend GamePage.tsx
exports.LINE_PATTERNS = createLinePatterns();
// Optimized line checking functions - consolidated from backend gameLogic.ts
const generateLines = (card) => {
    const lines = [];
    // Rows - use spread operator for better performance
    lines.push(...card.map(row => [...row]));
    // Columns - more efficient column extraction
    for (let j = 0; j < game_1.CARD_SIZE; j++) {
        lines.push(card.map(row => row[j]));
    }
    // Main diagonal - single pass
    lines.push(card.map((row, i) => row[i]));
    // Anti-diagonal - single pass
    lines.push(card.map((row, i) => row[game_1.CARD_SIZE - 1 - i]));
    return lines;
};
exports.generateLines = generateLines;
const isLineComplete = (line, markedCells) => {
    // Convert markedCells to lookup object for O(1) lookup instead of O(n) search
    const markedLookup = {};
    for (let i = 0; i < markedCells.length; i++) {
        markedLookup[markedCells[i]] = true;
    }
    // Check all cells in line with O(1) lookup
    for (let i = 0; i < line.length; i++) {
        if (!markedLookup[line[i]]) {
            return false;
        }
    }
    return true;
};
exports.isLineComplete = isLineComplete;
const checkCompletedLines = (card, markedCells) => {
    if (!card?.length || !markedCells?.length) {
        return { completedLines: 0, markedLetters: [] };
    }
    const lines = (0, exports.generateLines)(card);
    const completedCount = lines.filter(line => (0, exports.isLineComplete)(line, markedCells)).length;
    return {
        completedLines: completedCount,
        markedLetters: game_1.BINGO_LETTERS.slice(0, Math.min(completedCount, 5))
    };
};
exports.checkCompletedLines = checkCompletedLines;
// Position lookup utilities
const generatePositionMap = (card) => {
    const positionMap = {};
    card.forEach((row, r) => {
        row.forEach((num, c) => {
            positionMap[num] = [r, c];
        });
    });
    return positionMap;
};
exports.generatePositionMap = generatePositionMap;
const generateLookupTable = (card1, card2) => {
    const map1 = (0, exports.generatePositionMap)(card1);
    const map2 = (0, exports.generatePositionMap)(card2);
    const result = [];
    for (let i = 0; i < 75; i++) {
        const number = i + 1;
        const pos1 = map1[number] || [-1, -1];
        const pos2 = map2[number] || [-1, -1];
        result.push([pos1[0], pos1[1], pos2[0], pos2[1]]);
    }
    return result;
};
exports.generateLookupTable = generateLookupTable;
