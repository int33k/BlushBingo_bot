import Joi from 'joi';
import { CARD_SIZE, CARD_RANGE } from '../../../shared/constants/game';

// Core field validators using shared constants to eliminate duplication
const f = {
  id: () => Joi.string().required(),
  name: () => Joi.string().required(),
  game: () => Joi.string().required(),
  num: () => Joi.number().min(CARD_RANGE.min).max(CARD_RANGE.max).required(),
  card: () => Joi.array().items(Joi.number().min(CARD_RANGE.min).max(CARD_RANGE.max)).length(CARD_SIZE * CARD_SIZE).required()
};

// Schema factory using functional composition
const schema = (fields: Record<string, () => Joi.Schema>) => Joi.object(Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v()])));

// Schema definitions using shared constants
export const createGameSchema = schema({ playerId: f.id, playerName: f.name });
export const joinGameSchema = schema({ gameId: f.game, playerId: f.id, playerName: f.name });
export const readySchema = schema({ playerId: f.id, gameId: f.game, card: f.card });
export const moveSchema = schema({ playerId: f.id, gameId: f.game, number: f.num });
export const bingoStopSchema = schema({ playerId: f.id, gameId: f.game });
export const rematchSchema = schema({ playerId: f.id, gameId: f.game });
