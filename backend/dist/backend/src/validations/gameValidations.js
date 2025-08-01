"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rematchSchema = exports.bingoStopSchema = exports.moveSchema = exports.readySchema = exports.joinGameSchema = exports.createGameSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const game_1 = require("../../../shared/constants/game");
// Core field validators using shared constants to eliminate duplication
const f = {
    id: () => joi_1.default.string().required(),
    name: () => joi_1.default.string().required(),
    game: () => joi_1.default.string().required(),
    num: () => joi_1.default.number().min(game_1.CARD_RANGE.min).max(game_1.CARD_RANGE.max).required(),
    card: () => joi_1.default.array().items(joi_1.default.number().min(game_1.CARD_RANGE.min).max(game_1.CARD_RANGE.max)).length(game_1.CARD_SIZE * game_1.CARD_SIZE).required()
};
// Schema factory using functional composition
const schema = (fields) => joi_1.default.object(Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v()])));
// Schema definitions using shared constants
exports.createGameSchema = schema({ playerId: f.id, playerName: f.name });
exports.joinGameSchema = schema({ gameId: f.game, playerId: f.id, playerName: f.name });
exports.readySchema = schema({ playerId: f.id, gameId: f.game, card: f.card });
exports.moveSchema = schema({ playerId: f.id, gameId: f.game, number: f.num });
exports.bingoStopSchema = schema({ playerId: f.id, gameId: f.game });
exports.rematchSchema = schema({ playerId: f.id, gameId: f.game });
