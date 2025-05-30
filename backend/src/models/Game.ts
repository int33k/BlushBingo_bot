import mongoose, { Schema } from 'mongoose';
import { MoveSchema } from './Move';
import * as gameMethods from './gameMethods';
import { GameDocument } from '../types/gameTypes';

// Ultra-compact player schema using smart defaults and type inference
const GamePlayerSchema = new Schema({
  playerId: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  username: { type: String, trim: true, default: null },
  telegramId: { type: String, default: null },
  socketId: { type: String, default: null },
  connected: { type: Boolean, default: true },
  card: { type: [[Number]], default: null },
  markedCells: { type: [Schema.Types.Mixed], default: [] },
  completedLines: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  status: { type: String, enum: ['waiting', 'ready', 'playing', 'disconnected'], default: 'waiting' },
  gameId: { type: String, default: null }
});

// Ultra-compact Game schema with consolidated field definitions
const GameSchema = new Schema({
  gameId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['waiting', 'lobby', 'playing', 'completed'], default: 'waiting' },
  statusMessage: { type: String, default: null },
  players: { challenger: GamePlayerSchema, acceptor: GamePlayerSchema },
  currentTurn: { type: String, enum: ['challenger', 'acceptor', null], default: null },
  moves: [MoveSchema],
  winner: { type: String, enum: ['challenger', 'acceptor', null], default: null },
  winReason: { type: String, enum: ['bingo', 'disconnection', 'forfeit', null], default: null },
  createdAt: { type: Date, default: Date.now, expires: 86400 },
  lastActivityAt: { type: Date, default: Date.now },
  disconnectionTimer: { playerId: String, role: String, startTime: Date, expiryTime: Date },
  connectedPlayers: { type: [String], default: [] },
  rematchRequests: { challenger: { type: Boolean, default: false }, acceptor: { type: Boolean, default: false } },
  rematchGameId: { type: String, default: null },
  lookupTable: { type: [[Number]], default: [] }
});

// Attach methods using functional approach
Object.entries(gameMethods).forEach(([name, fn]) => GameSchema.methods[name] = fn);

export const Game = mongoose.model<GameDocument>('Game', GameSchema);
