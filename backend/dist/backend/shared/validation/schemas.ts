/**
 * Shared Validation Schemas - Cross-platform validation
 * Eliminates validation duplication between frontend and backend
 */

import { CARD_RANGE } from '../constants/game';

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Basic validation functions that work across platforms
export const validateString = (value: unknown, fieldName: string, required = true): ValidationResult => {
  const errors: string[] = [];
  
  if (required && (value === undefined || value === null || value === '')) {
    errors.push(`${fieldName} is required`);
  } else if (value !== undefined && value !== null && typeof value !== 'string') {
    errors.push(`${fieldName} must be a string`);
  }
  
  return { isValid: errors.length === 0, errors };
};

export const validateNumber = (value: unknown, fieldName: string, min?: number, max?: number, required = true): ValidationResult => {
  const errors: string[] = [];
  
  if (required && (value === undefined || value === null)) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }
  
  if (value !== undefined && value !== null) {
    if (typeof value !== 'number' || isNaN(value)) {
      errors.push(`${fieldName} must be a number`);
    } else {
      if (min !== undefined && value < min) {
        errors.push(`${fieldName} must be at least ${min}`);
      }
      if (max !== undefined && value > max) {
        errors.push(`${fieldName} must be at most ${max}`);
      }
    }
  }
  
  return { isValid: errors.length === 0, errors };
};

// Game-specific validation functions
export const validateGameId = (gameId: unknown): ValidationResult => {
  return validateString(gameId, 'gameId');
};

export const validatePlayerId = (playerId: unknown): ValidationResult => {
  return validateString(playerId, 'playerId');
};

export const validatePlayerName = (playerName: unknown): ValidationResult => {
  return validateString(playerName, 'playerName');
};

export const validateGameNumber = (number: unknown): ValidationResult => {
  return validateNumber(number, 'number', CARD_RANGE.min, CARD_RANGE.max);
};

// Composite validation functions for common request types
export const validateCreateGame = (data: any): ValidationResult => {
  const errors: string[] = [];
  
  const playerIdResult = validatePlayerId(data?.playerId);
  const playerNameResult = validatePlayerName(data?.playerName);
  
  errors.push(...playerIdResult.errors, ...playerNameResult.errors);
  
  return { isValid: errors.length === 0, errors };
};

export const validateJoinGame = (data: any): ValidationResult => {
  const errors: string[] = [];
  
  const gameIdResult = validateGameId(data?.gameId);
  const playerIdResult = validatePlayerId(data?.playerId);
  const playerNameResult = validatePlayerName(data?.playerName);
  
  errors.push(...gameIdResult.errors, ...playerIdResult.errors, ...playerNameResult.errors);
  
  return { isValid: errors.length === 0, errors };
};

export const validateMove = (data: any): ValidationResult => {
  const errors: string[] = [];
  
  const playerIdResult = validatePlayerId(data?.playerId);
  const gameIdResult = validateGameId(data?.gameId);
  const numberResult = validateGameNumber(data?.number);
  
  errors.push(...playerIdResult.errors, ...gameIdResult.errors, ...numberResult.errors);
  
  return { isValid: errors.length === 0, errors };
};
