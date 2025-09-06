module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
  ],
  
  // Coverage configuration (disabled for now)
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/app.js',
    '!**/node_modules/**',
    '!**/tests/**',
  ],
  
  // Coverage thresholds (lowered for development)
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Transform configuration
  transform: {},
  
  // Test environment variables
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
  ],
  
  // Watch patterns
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
  ],
};
