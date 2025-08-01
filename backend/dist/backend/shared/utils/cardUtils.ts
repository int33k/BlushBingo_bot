// Shared card utilities for frontend and backend
// Move all card-related helpers here for single source of truth

// Fisher-Yates shuffle
export const shuffleArray = <T>(arr: T[]): void => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
};

// Card validation
export const validateCard = (card: number[][]): boolean => {
  if (!card?.length || card.length !== 5 || !card.every(row => row?.length === 5)) return false;
  const nums = card.flat();
  return nums.length === 25 && nums.every(n => n >= 1 && n <= 25) && new Set(nums).size === 25;
};

// Card generation (config must be injected)
export const generateRandomCard = (
  S: number,
  CS: number,
  MIN: number,
  MAX: number,
  getRandomNumber: (min: number, max: number) => number
): number[][] => {
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
