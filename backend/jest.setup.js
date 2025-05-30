// Setup file for Jest
// Add any global setup for tests here

// Mock MongoDB connection
jest.mock('./src/config/db', () => ({
  connectDB: jest.fn().mockResolvedValue(true),
}));
