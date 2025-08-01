"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameRepository = exports.playerRepository = void 0;
/**
 * Ultra-optimized repositories with singleton instances and consolidated exports
 */
const PlayerRepository_1 = require("./PlayerRepository");
const GameRepository_1 = require("./GameRepository");
// Singleton instances with immediate export
exports.playerRepository = new PlayerRepository_1.PlayerRepository();
exports.gameRepository = new GameRepository_1.GameRepository();
// Consolidated exports for all repository types and implementations
__exportStar(require("./BaseRepository"), exports);
__exportStar(require("./IPlayerRepository"), exports);
__exportStar(require("./PlayerRepository"), exports);
__exportStar(require("./IGameRepository"), exports);
__exportStar(require("./GameRepository"), exports);
