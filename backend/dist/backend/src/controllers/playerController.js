"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimBingo = exports.makeMove = exports.setPlayerReady = void 0;
const player_1 = require("../services/player");
const math_1 = require("../utils/math");
const math_2 = require("../utils/math");
const errors_1 = require("../utils/errors");
// Ultra-compact controller exports with destructuring and inline validation
exports.setPlayerReady = (0, math_1.ctrl)()(async (r) => {
    const { gameId, playerId } = (0, math_2.gameParams)(r);
    return { game: await player_1.playerGameService.setPlayerReady(gameId, playerId, (0, math_2.req)(r.body.card, 'Card')) };
});
exports.makeMove = (0, math_1.ctrl)()(async (r) => {
    const { gameId, playerId } = (0, math_2.gameParams)(r), { position, value } = r.body;
    return (!position || value === undefined) && (() => { throw new errors_1.AppError('Position and value are required', errors_1.ErrorCode.MISSING_REQUIRED_FIELD); })(),
        { game: await player_1.playerGameService.makeMove(gameId, playerId, value) };
});
exports.claimBingo = (0, math_1.ctrl)()(async (r) => {
    const { gameId, playerId } = (0, math_2.gameParams)(r);
    return { game: await player_1.playerGameService.claimBingo(gameId, playerId) };
});
