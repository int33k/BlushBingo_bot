/**
 * Jest setup file
 */

// Import Jest types for global usage
import '@jest/globals';
import { jest, beforeEach } from '@jest/globals';

// Load environment variables from .env.test file
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Keep error and warn for debugging
  error: jest.fn(),
  warn: jest.fn(),
  // Silence info and debug
  info: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
};

// Increase timeout for all tests
jest.setTimeout(10000);

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
