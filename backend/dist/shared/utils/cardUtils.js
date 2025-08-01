"use strict";
// Shared card utilities for frontend and backend
// Move all card-related helpers here for single source of truth
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomCard = exports.validateCard = exports.shuffleArray = void 0;
// Fisher-Yates shuffle
const shuffleArray = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
};
exports.shuffleArray = shuffleArray;
// Card validation
const validateCard = (card) => {
    if (!card?.length || card.length !== 5 || !card.every(row => row?.length === 5))
        return false;
    const nums = card.flat();
    return nums.length === 25 && nums.every(n => n >= 1 && n <= 25) && new Set(nums).size === 25;
};
exports.validateCard = validateCard;
// Card generation (config must be injected)
const generateRandomCard = (S, CS, MIN, MAX, getRandomNumber) => {
    const range = Math.ceil((MAX - MIN + 1) / S);
    const card = Array.from({ length: S }, () => Array(S).fill(0));
    Array.from({ length: S }, (_, col) => {
        const min = MIN + col * range, max = Math.min(min + range - 1, MAX);
        const nums = new Set();
        while (nums.size < CS)
            nums.add(getRandomNumber(min, max));
        [...nums].forEach((num, row) => card[row][col] = num);
    });
    return card;
};
exports.generateRandomCard = generateRandomCard;
