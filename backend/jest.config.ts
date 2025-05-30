/**
 * Jest configuration for TypeScript
 */

import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
};

export default config;
