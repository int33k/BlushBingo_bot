/**
 * Ultra-optimized game controller (23→15 lines, 35% reduction)
 */

import { Request } from 'express';
import { gameService, gameCreationService } from '../services/game';
import { ctrl } from '../utils/math';
import { req, userData } from '../utils/math';
import { AppError, ErrorCode } from '../utils/errors';

// Ultra-compact controller exports with functional composition
export const createGame = ctrl(201)(async (r: Request) => {
  const game = await gameCreationService.createGame(userData(r.body.name, req(r.body.identifier, 'Player identifier')));
  return { gameId: game.gameId, game };
});

export const getGameById = ctrl()(async (r: Request) => ({
  game: await gameService.getGameById(req(r.params.gameId, 'Game ID')) || (() => { throw new AppError('Game not found', ErrorCode.GAME_NOT_FOUND); })()
}));

export const joinGame = ctrl()(async (r: Request) => ({
  game: await gameCreationService.joinGame(req(r.params.gameId, 'Game ID'), userData(r.body.name, req(r.body.identifier, 'Player identifier')))
}));
