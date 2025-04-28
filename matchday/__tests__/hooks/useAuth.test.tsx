import { renderHook, act } from '@testing-library/react'
import { useAuth } from '@/src/hooks/useAuth'
import { AuthService } from '@/src/api/services/AuthService'
import Cookies from 'js-cookie'

jest.mock('@/src/api/services/AuthService', () => ({
    AuthService: {
        validateToken: jest.fn(),
        signup: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        createManagementUser: jest.fn()
    }
}))

jest.mock('js-cookie', () => ({
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn()
}))

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn()
    })
}))

describe('useAuth', () => {
    const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'ADMIN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // 🛡️ Mock and store the original console.error
    const originalConsoleError = console.error;
    beforeAll(() => {
        console.error = jest.fn();
    });

    afterAll(() => {
        console.error = originalConsoleError; // Restore after all tests
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('initializes with no user when no token exists', async () => {
        (Cookies.get as jest.Mock).mockReturnValue(undefined);

        let result: any;
        await act(async () => {
            result = renderHook(() => useAuth()).result;
        });

        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('initializes with user when valid token exists', async () => {
        (Cookies.get as jest.Mock).mockReturnValue('valid-token');
        (AuthService.validateToken as jest.Mock).mockResolvedValue(mockUser);

        let result: any;
        await act(async () => {
            result = renderHook(() => useAuth()).result;
        });

        expect(AuthService.validateToken).toHaveBeenCalledWith('valid-token');
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.loading).toBe(false);
    });

    it('handles token validation failure', async () => {
        (Cookies.get as jest.Mock).mockReturnValue('invalid-token');
        (AuthService.validateToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

        let result: any;
        await act(async () => {
            result = renderHook(() => useAuth()).result;
            await Promise.resolve();
        });

        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('logs out correctly', async () => {
        (Cookies.get as jest.Mock).mockReturnValue('valid-token');
        (AuthService.validateToken as jest.Mock).mockResolvedValue(mockUser);

        let result: any;
        await act(async () => {
            result = renderHook(() => useAuth()).result;
            await Promise.resolve();
        });

        expect(result.current.user).toEqual(mockUser);

        act(() => {
            result.current.logout();
        });

        expect(AuthService.logout).toHaveBeenCalled();
        expect(result.current.user).toBeNull();
    });
});
