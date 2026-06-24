import { defaults } from 'jest-config';

/** @type {import('jest').Config} */
const config = {
  collectCoverage: true,
  transform: {},
  testPathIgnorePatterns: [
    ...defaults.testPathIgnorePatterns,
    "/tests/node",
    "/tests/e2e"
  ]
};

export default config;