"use strict";
/**
 * Shared Game Logic - Consolidated from frontend and backend
 * Eliminates duplication between LINE_PATTERNS and game logic
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLookupTable = exports.generatePositionMap = exports.checkCompletedLines = exports.isLineComplete = exports.generateLines = exports.LINE_PATTERNS = void 0;
var game_1 = require("../constants/game");
// Helper function to create line patterns
function createLinePatterns() {
    var patterns = [];
    // Rows
    for (var i = 0; i < game_1.CARD_SIZE; i++) {
        var cells = [];
        for (var j = 0; j < game_1.CARD_SIZE; j++) {
            cells.push({ row: i, col: j });
        }
        patterns.push({ cells: cells });
    }
    // Columns
    for (var i = 0; i < game_1.CARD_SIZE; i++) {
        var cells = [];
        for (var j = 0; j < game_1.CARD_SIZE; j++) {
            cells.push({ row: j, col: i });
        }
        patterns.push({ cells: cells });
    }
    // Main diagonal
    var mainDiag = [];
    for (var i = 0; i < game_1.CARD_SIZE; i++) {
        mainDiag.push({ row: i, col: i });
    }
    patterns.push({ cells: mainDiag });
    // Anti-diagonal
    var antiDiag = [];
    for (var i = 0; i < game_1.CARD_SIZE; i++) {
        antiDiag.push({ row: i, col: game_1.CARD_SIZE - 1 - i });
    }
    patterns.push({ cells: antiDiag });
    return patterns;
}
// Optimized line patterns - consolidated from frontend GamePage.tsx
exports.LINE_PATTERNS = createLinePatterns();
// Optimized line checking functions - consolidated from backend gameLogic.ts
var generateLines = function (card) {
    var lines = [];
    // Rows - use spread operator for better performance
    lines.push.apply(lines, card.map(function (row) { return __spreadArray([], row, true); }));
    var _loop_1 = function (j) {
        lines.push(card.map(function (row) { return row[j]; }));
    };
    // Columns - more efficient column extraction
    for (var j = 0; j < game_1.CARD_SIZE; j++) {
        _loop_1(j);
    }
    // Main diagonal - single pass
    lines.push(card.map(function (row, i) { return row[i]; }));
    // Anti-diagonal - single pass
    lines.push(card.map(function (row, i) { return row[game_1.CARD_SIZE - 1 - i]; }));
    return lines;
};
exports.generateLines = generateLines;
var isLineComplete = function (line, markedCells) {
    // Convert markedCells to lookup object for O(1) lookup instead of O(n) search
    var markedLookup = {};
    for (var i = 0; i < markedCells.length; i++) {
        markedLookup[markedCells[i]] = true;
    }
    return line.every(function (cell) { return markedLookup[cell]; });
};
exports.isLineComplete = isLineComplete;
var checkCompletedLines = function (card, markedCells) {
    if (!(card === null || card === void 0 ? void 0 : card.length) || !(markedCells === null || markedCells === void 0 ? void 0 : markedCells.length)) {
        return { completedLines: 0, markedLetters: [] };
    }
    var lines = (0, exports.generateLines)(card);
    var completedCount = lines.filter(function (line) { return (0, exports.isLineComplete)(line, markedCells); }).length;
    return {
        completedLines: completedCount,
        markedLetters: game_1.BINGO_LETTERS.slice(0, Math.min(completedCount, 5))
    };
};
exports.checkCompletedLines = checkCompletedLines;
// Position lookup utilities
var generatePositionMap = function (card) {
    var positionMap = {};
    card.forEach(function (row, r) {
        row.forEach(function (num, c) {
            positionMap[num] = [r, c];
        });
    });
    return positionMap;
};
exports.generatePositionMap = generatePositionMap;
var generateLookupTable = function (card1, card2) {
    var map1 = (0, exports.generatePositionMap)(card1);
    var map2 = (0, exports.generatePositionMap)(card2);
    var result = [];
    for (var i = 0; i < 75; i++) {
        var number = i + 1;
        var pos1 = map1[number] || [-1, -1];
        var pos2 = map2[number] || [-1, -1];
        result.push([pos1[0], pos1[1], pos2[0], pos2[1]]);
    }
    return result;
};
exports.generateLookupTable = generateLookupTable;
