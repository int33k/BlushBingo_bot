// Ultra-optimized card utilities with functional composition and algorithmic optimization
import config from '../config';
import { getRandomNumber } from './math';

// Ultra-compact card generation with functional programming and array methods
export const generateRandomCard = (): number[][] => {
  const { size: S } = config.game.board;
  const { size: CS, minValue: MIN, maxValue: MAX } = config.game.card;
  const range = Math.ceil((MAX - MIN + 1) / S);

  const card = Array.from({ length: S }, () => Array(S).fill(0));
  Array.from({ length: S }, (_, col) => {
    const min = MIN + col * range, max = Math.min(min + range - 1, MAX);
    const nums = new Set<number>();
    while (nums.size < CS) nums.add(getRandomNumber(min, max));
    [...nums].forEach((num, row) => card[row][col] = num);
  });

  return card;
};

// Ultra-compact Fisher-Yates shuffle with destructuring optimization
export const shuffleArray = <T>(arr: T[]): void => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
};

// Ultra-compact validation with functional composition and set optimization
export const validateCard = (card: number[][]): boolean => {
  if (!card?.length || card.length !== 5 || !card.every(row => row?.length === 5)) return false;
  const nums = card.flat();
  return nums.length === 25 && nums.every(n => n >= 1 && n <= 25) && new Set(nums).size === 25;
};
