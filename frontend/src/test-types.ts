// Test file to verify module resolution
import type { Player } from './types';

const testPlayer: Player = {
  playerId: '1',
  name: 'Test',
  status: 'ready',
  connected: true
};

console.log(testPlayer);
