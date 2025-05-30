import mongoose, { Schema, Document } from 'mongoose';
import { IMove } from '../types/gameTypes';

// Move schema with inline field definitions
export const MoveSchema = new Schema({
  playerId: { type: String, required: true },
  position: { row: { type: Number, required: true }, col: { type: Number, required: true } },
  value: { type: Schema.Types.Mixed, required: true },
  timestamp: { type: Date, default: Date.now }
});

export interface MoveDocument extends Document, IMove { [key: string]: any; }
export const Move = mongoose.model<MoveDocument>('Move', MoveSchema);