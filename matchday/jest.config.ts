import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
    dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1', // if you use @/lib, @/components shortcuts
    },
    testEnvironment: 'jsdom',
};

export default createJestConfig(customJestConfig);
