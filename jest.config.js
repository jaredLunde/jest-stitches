module.exports = {
  moduleDirectories: ['node_modules', 'src', 'test'],
  testMatch: ['<rootDir>/src/**/?(*.)test.js'],
  moduleNameMapper: {
    '^test-utils$': '<rootDir>/test/test-utils.js',
  },
  collectCoverageFrom: ['**/src/**/*.js'],
  setupFilesAfterEnv: ['./test/setup.js'],
  snapshotResolver: './test/resolve-snapshot.js',
  globals: {
    __DEV__: true,
  },
}
