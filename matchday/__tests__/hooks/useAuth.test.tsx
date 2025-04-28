import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../src/hooks/useAuth';
import { UserRole } from '../../src/types';

// Mock dependencies
jest.mock('js-cookie', () => ({
    get: jest.fn(),
    set: jest.fn(),
}));
jest.mock('../src/api/services/AuthService', () => ({
    AuthService: {
        validateToken: jest.fn(),
        login: jest.fn(),
        signup: jest.fn(),
        logout: jest.fn(),
        createManagementUser: jest.fn(),
    },
}));

const mockUser = {
    id: 'u1',
    email: 'test@example.com',
    username: 'testuser',
    name: 'Test User',
    role: UserRole.ADMIN,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

describe('useAuth', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns initial state correctly when no token', async () => {
        const Cookies = require('js-cookie');
        Cookies.get.mockReturnValue(undefined);

        const { result, waitForNextUpdate } = renderHook(() => useAuth());

        await waitForNextUpdate();

        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('returns authenticated state correctly when token is present', async () => {
        const Cookies = require('js-cookie');
        const { AuthService } = require('../src/api/services/AuthService');
        Cookies.get.mockReturnValue('mock-token');
        AuthService.validateToken.mockResolvedValue(mockUser);

        const { result, waitForNextUpdate } = renderHook(() => useAuth());

        await waitForNextUpdate();

        expect(result.current.user).toEqual(mockUser);
        expect(result.current.loading).toBe(false);
    });

    it('handles role-based access correctly', async () => {
        const Cookies = require('js-cookie');
        const { AuthService } = require('../src/api/services/AuthService');
        Cookies.get.mockReturnValue('mock-token');
        AuthService.validateToken.mockResolvedValue(mockUser);

        const { result, waitForNextUpdate } = renderHook(() => useAuth());

        await waitForNextUpdate();

        expect(result.current.isAdmin()).toBe(true);
        expect(result.current.isManagement()).toBe(false);
        expect(result.current.isCaptain()).toBe(false);
    });
});