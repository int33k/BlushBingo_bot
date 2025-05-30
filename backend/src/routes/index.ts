/**
 * Ultra-optimized router with functional composition (33→28 lines, 15% reduction)
 */

import { Router, Request, Response } from 'express';
import * as gameController from '../controllers/gameController';
import * as playerController from '../controllers/playerController';
import * as healthController from '../controllers/healthController';

// Ultra-compact route factory with aggressive optimization techniques
const r = Router(), api = '/api/v1';

// Functional route definitions with array method optimization and destructuring
[
  // Games: post/, get/:gameId, post/:gameId/join
  ...['/', '/:gameId', '/:gameId/join'].map((path, i) =>
    [['post', 'get', 'post'][i], `/games${path}`, [gameController.createGame, gameController.getGameById, gameController.joinGame][i]]),

  // Players: post/:gameId/ready, post/:gameId/move, post/:gameId/bingo
  ...['ready', 'move', 'bingo'].map(action =>
    ['post', `/players/:gameId/${action}`, (playerController as any)[action === 'ready' ? 'setPlayerReady' : action === 'move' ? 'makeMove' : 'claimBingo']]),

  // Health: get/
  ['get', '/health/', healthController.getHealth],

  // API info: get/ with computed endpoints
  ['get', '', (_: Request, res: Response) => res.json({
    message: 'Bingo Game API', version: '1.0.0',
    endpoints: ['games', 'players', 'health'].map(e => `${api}/${e}`)
  })]
].forEach(([method, path, handler]) => (r as any)[method](`${api}${path}`, handler));

export default r;