"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playerConnectionService = exports.playerGameService = exports.PlayerService = exports.playerService = void 0;
const PlayerService_1 = require("./PlayerService");
Object.defineProperty(exports, "PlayerService", { enumerable: true, get: function () { return PlayerService_1.PlayerService; } });
const playerService = new PlayerService_1.PlayerService();
exports.playerService = playerService;
// Backward compatibility exports
exports.playerGameService = playerService;
exports.playerConnectionService = playerService;
