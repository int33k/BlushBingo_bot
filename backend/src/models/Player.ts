import mongoose, { Schema, Document } from 'mongoose';

// Player schema with inline field definitions
export const PlayerSchema = new Schema({
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

// interface with essential properties
export interface PlayerDocument extends Document {
  playerId: string; name: string; username?: string; telegramId?: string; socketId: string;
  connected: boolean; card?: number[][]; score: number; markedCells?: Array<string | number>;
  status: 'waiting' | 'ready' | 'playing' | 'disconnected'; completedLines?: number;
  markedLetters?: string[]; gameId?: string; [key: string]: any;
}

export const Player = mongoose.model<PlayerDocument>('Player', PlayerSchema);