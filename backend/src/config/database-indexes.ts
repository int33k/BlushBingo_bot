// Database indexes for performance optimization
import { Game } from '../models/Game';

// Ensure indexes for frequently queried fields
Game.collection.createIndex({ gameId: 1 }, { unique: true });
Game.collection.createIndex({ 'players.challenger.playerId': 1 });
Game.collection.createIndex({ 'players.acceptor.playerId': 1 });
Game.collection.createIndex({ status: 1 });
Game.collection.createIndex({ createdAt: -1 });
