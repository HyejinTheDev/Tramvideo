module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: 'test/integration/.*[.]spec[.]ts$',
  transform: { '^.+[.]ts$': 'ts-jest' },
  testEnvironment: 'node',
  testTimeout: 60000,
  setupFiles: ['<rootDir>/test/integration/setup-env.ts'],
  globalSetup: '<rootDir>/test/integration/global-setup.js',
};
