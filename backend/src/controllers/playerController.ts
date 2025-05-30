import { Request } from 'express';
import { playerGameService } from '../services/player';
import { ctrl } from '../utils/math';
import { req, gameParams } from '../utils/math';
import { AppError, ErrorCode } from '../utils/errors';

// Ultra-compact controller exports with destructuring and inline validation
export const setPlayerReady = ctrl()(async (r: Request) => {
  const { gameId, playerId } = gameParams(r);
  return { game: await playerGameService.setPlayerReady(gameId, playerId, req(r.body.card, 'Card')) };
});

export const makeMove = ctrl()(async (r: Request) => {
  const { gameId, playerId } = gameParams(r), { position, value } = r.body;
  return (!position || value === undefined) && (() => { throw new AppError('Position and value are required', ErrorCode.MISSING_REQUIRED_FIELD); })(),
    { game: await playerGameService.makeMove(gameId, playerId, value) };
});

export const claimBingo = ctrl()(async (r: Request) => {
  const { gameId, playerId } = gameParams(r);
  return { game: await playerGameService.claimBingo(gameId, playerId) };
});
