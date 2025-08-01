"use strict";
/**
 * Ultra-optimized router with functional composition (33→28 lines, 15% reduction)
 */
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const healthController = __importStar(require("../controllers/healthController"));
// Ultra-compact route factory with clear route definitions
const r = (0, express_1.Router)();
const api = '/api/v1';
// Test with just one simple route first
r.get(`${api}/health`, healthController.getHealth);
// Temporarily comment out other routes to debug
/*
// Game routes
r.post(`${api}/games`, gameController.createGame);
r.get(`${api}/games/:gameId`, gameController.getGameById);
r.post(`${api}/games/:gameId/join`, gameController.joinGame);

// Player routes
r.post(`${api}/players/:gameId/ready`, playerController.setPlayerReady);
r.post(`${api}/players/:gameId/move`, playerController.makeMove);
r.post(`${api}/players/:gameId/bingo`, playerController.claimBingo);

// API info route
r.get(`${api}`, (_: Request, res: Response) => res.json({
  message: 'Bingo Game API',
  version: '1.0.0',
  endpoints: ['games', 'players', 'health'].map(e => `${api}/${e}`)
}));
*/
exports.default = r;
