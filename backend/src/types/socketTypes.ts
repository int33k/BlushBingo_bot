/**
 * Socket-related type definitions - Ultra-optimized with consolidated event types
 */

import { Socket, Server } from 'socket.io';
import { IGame } from './gameTypes';

// Base socket event data with generic typing
export interface SocketEventData { gameId?: string; playerId?: string; identifier?: string; name?: string; [key: string]: any; }

// Consolidated event data types using intersection types
export interface AuthEventData extends SocketEventData { identifier: string; name?: string; }
export interface ReconnectEventData extends SocketEventData { gameId: string; playerId?: string; }
export interface GameCreateEventData extends SocketEventData { identifier?: string; name?: string; }
export interface GameJoinEventData extends SocketEventData { gameId: string; identifier?: string; name?: string; }
export interface PlayerReadyEventData extends SocketEventData { gameId?: string; playerId?: string; name?: string; card?: number[][]; }
export interface GameMoveEventData extends SocketEventData { gameId?: string; playerId?: string; number: number; }
export interface MarkLineEventData extends SocketEventData { gameId?: string; playerId?: string; numbers: number[]; lineIndex: number; }
export interface ClaimBingoEventData extends SocketEventData { gameId: string; }
export interface RequestRematchEventData extends SocketEventData { gameId: string; }
export interface ServerShutdownEventData { message: string; reconnectAfter?: number; }

// Socket handler and response types with generic optimization
export type SocketEventHandler<T extends SocketEventData = SocketEventData> = (socket: Socket, io: Server, data: T, callback?: (response: any) => void) => Promise<void>;
export interface SocketEventResponse { success: boolean; game?: IGame; error?: string; message?: string; [key: string]: any; }
export interface ReconnectResponse extends SocketEventResponse { playerId?: string; }
export interface ErrorResponse { message: string; code?: string; details?: Record<string, any>; }
