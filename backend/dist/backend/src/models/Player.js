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
exports.Player = exports.PlayerSchema = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Player schema using shared types to eliminate duplication
exports.PlayerSchema = new mongoose_1.Schema({
    playerId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    username: { type: String, trim: true, default: null },
    telegramId: { type: String, default: null },
    photoUrl: { type: String, default: null },
    socketId: { type: String, default: null },
    connected: { type: Boolean, default: true },
    card: { type: [[Number]], default: null },
    markedCells: { type: [mongoose_1.Schema.Types.Mixed], default: [] },
    completedLines: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    status: { type: String, enum: ['waiting', 'ready', 'playing', 'disconnected'], default: 'waiting' },
    gameId: { type: String, default: null }
});
exports.Player = mongoose_1.default.model('Player', exports.PlayerSchema);
