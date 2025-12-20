export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    'reference/**/*.js',
    '!src/**/index.jsx',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      statements: 30,
      branches: 35,
      functions: 20,
      lines: 30
    },
    // Core testable backend functions
    './src/index.js': {
      statements: 29,
      branches: 35,
      functions: 17,
      lines: 29
    },
    // Hash chain utilities (security-critical)
    './src/hashChain.js': {
      statements: 50,
      branches: 65,
      functions: 65,
      lines: 50
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  moduleNameMapper: {
    '^@forge/api$': '<rootDir>/tests/__mocks__/forge-api.js',
    '^@forge/bridge$': '<rootDir>/tests/__mocks__/forge-bridge.js',
    '^@forge/resolver$': '<rootDir>/tests/__mocks__/forge-resolver.js'
  }
};
