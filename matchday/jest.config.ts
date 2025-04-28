import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
    dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Ensures jest.setup.ts runs before tests
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1', // If you use @/lib, @/components shortcuts
    },
    testEnvironment: 'jsdom', // Using jsdom for testing environment
};

export default createJestConfig(customJestConfig);
