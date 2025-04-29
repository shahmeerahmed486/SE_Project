import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
    dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    testEnvironment: 'jsdom',
    collectCoverage: true, // Enable code coverage
    coverageDirectory: './coverage', // Set directory for coverage reports
    coverageReporters: ['text', 'lcov', 'html'], // Report formats
    coveragePathIgnorePatterns: ['/node_modules/'], // Ignore node_modules
};
export default createJestConfig(customJestConfig);
