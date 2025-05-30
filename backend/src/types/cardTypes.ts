/**
 * Card-related type definitions - Ultra-optimized
 * Using simple number[][] format as standardized across codebase
 */

// Card type alias for semantic clarity
export type BingoCard = number[][];

// Card validation constants
export const CARD_SIZE = 5;
export const CARD_RANGE = { min: 1, max: 25 } as const;
