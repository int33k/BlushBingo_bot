"use strict";
/**
 * Ultra-optimized game controller (23→15 lines, 35% reduction)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinGame = exports.getGameById = exports.createGame = void 0;
const game_1 = require("../services/game");
const math_1 = require("../utils/math");
const math_2 = require("../utils/math");
const errors_1 = require("../utils/errors");
// Ultra-compact controller exports with functional composition
exports.createGame = (0, math_1.ctrl)(201)(async (r) => {
    const game = await game_1.gameCreationService.createGame((0, math_2.userData)(r.body.name, (0, math_2.req)(r.body.identifier, 'Player identifier')));
    return { gameId: game.gameId, game };
});
exports.getGameById = (0, math_1.ctrl)()(async (r) => ({
    game: await game_1.gameService.getGameById((0, math_2.req)(r.params.gameId, 'Game ID')) || (() => { throw new errors_1.AppError('Game not found', errors_1.ErrorCode.GAME_NOT_FOUND); })()
}));
exports.joinGame = (0, math_1.ctrl)()(async (r) => ({
    game: await game_1.gameCreationService.joinGame((0, math_2.req)(r.params.gameId, 'Game ID'), (0, math_2.userData)(r.body.name, (0, math_2.req)(r.body.identifier, 'Player identifier')))
}));
