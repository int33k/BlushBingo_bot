/**
 * Performance optimization utilities for game operations
 */
import { GameDocument } from '../types/gameTypes';

// Delta update system for efficient socket communication
export interface GameDelta {
  moves?: any[];
  currentTurn?: string | null;
  status?: string;
  winner?: string | null;
  lastMove?: any;
  playerUpdates?: {
    challenger?: Partial<any>;
    acceptor?: Partial<any>;
  };
}

// Calculate only what changed in game state
export const calculateGameDelta = (oldGame: GameDocument | null, newGame: GameDocument): GameDelta => {
  if (!oldGame) {
    // First time - send minimal essential data
    return {
      currentTurn: newGame.currentTurn,
      status: newGame.status,
      moves: newGame.moves?.slice(-1) || [], // Only last move
      winner: newGame.winner
    };
  }

  const delta: GameDelta = {};

  // Check for new moves (only send new ones)
  if (newGame.moves && oldGame.moves) {
    const newMoves = newGame.moves.slice(oldGame.moves.length);
    if (newMoves.length > 0) {
      delta.moves = newMoves;
      delta.lastMove = newMoves[newMoves.length - 1];
    }
  }

  // Check for turn changes
  if (newGame.currentTurn !== oldGame.currentTurn) {
    delta.currentTurn = newGame.currentTurn;
  }

  // Check for status changes
  if (newGame.status !== oldGame.status) {
    delta.status = newGame.status;
  }

  // Check for winner
  if (newGame.winner !== oldGame.winner) {
    delta.winner = newGame.winner;
  }

  // Check for player updates
  const playerUpdates: any = {};
  if (newGame.players.challenger?.completedLines !== oldGame.players.challenger?.completedLines) {
    playerUpdates.challenger = { completedLines: newGame.players.challenger?.completedLines };
  }
  if (newGame.players.acceptor?.completedLines !== oldGame.players.acceptor?.completedLines) {
    playerUpdates.acceptor = { completedLines: newGame.players.acceptor?.completedLines };
  }
  
  if (Object.keys(playerUpdates).length > 0) {
    delta.playerUpdates = playerUpdates;
  }

  return delta;
};

// Compress game data for transmission
export const compressGameData = (data: any): any => {
  // Remove unnecessary fields for socket transmission
  const compressed = { ...data };
  
  // Remove large fields that don't change often
  if (compressed.lookupTable && compressed.moves?.length > 10) {
    delete compressed.lookupTable; // Can be regenerated on client
  }
  
  // Compress player data
  if (compressed.players) {
    Object.keys(compressed.players).forEach(role => {
      const player = compressed.players[role];
      if (player) {
        // Remove card data if moves exist (can be reconstructed)
        if (compressed.moves?.length > 0 && player.card) {
          delete player.card;
        }
      }
    });
  }

  return compressed;
};

// Memory pool for reusable objects
class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;

  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn());
    }
  }

  get(): T {
    return this.pool.pop() || this.createFn();
  }

  release(obj: T): void {
    this.resetFn(obj);
    if (this.pool.length < 50) { // Prevent memory bloat
      this.pool.push(obj);
    }
  }
}

// Pre-created object pools for common operations
export const movePool = new ObjectPool(
  () => ({ playerId: '', position: { row: 0, col: 0 }, value: 0, timestamp: new Date() }),
  (obj) => { obj.playerId = ''; obj.value = 0; obj.timestamp = new Date(); }
);

export const deltaPool = new ObjectPool(
  () => ({}),
  (obj) => Object.keys(obj).forEach(key => delete (obj as any)[key])
);

// Batch processing for multiple operations
export const batchOperations = <T>(operations: (() => T)[], batchSize = 10): T[] => {
  const results: T[] = [];
  
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    results.push(...batch.map(op => op()));
  }
  
  return results;
};
