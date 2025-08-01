"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Database indexes for performance optimization
const Game_1 = require("../models/Game");
// Ensure indexes for frequently queried fields
Game_1.Game.collection.createIndex({ gameId: 1 }, { unique: true });
Game_1.Game.collection.createIndex({ 'players.challenger.playerId': 1 });
Game_1.Game.collection.createIndex({ 'players.acceptor.playerId': 1 });
Game_1.Game.collection.createIndex({ status: 1 });
Game_1.Game.collection.createIndex({ createdAt: -1 });
