import { renderHook, act } from '@testing-library/react';
import { useAuthStatus } from '@/src/hooks/useAuthStatus';
import { AuthService } from '@/src/api/services/AuthService';
import Cookies from 'js-cookie';

jest.mock('@/src/api/services/AuthService');
jest.mock('js-cookie');

// Mock console.error
jest.spyOn(console, 'error').mockImplementation(() => { });

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
        pathname: '/',
        query: {},
        asPath: '/'
    })
}));

describe('useAuthStatus', () => {
    const mockUser = {
        id: 'user1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'ADMIN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    } as const;

    beforeEach(() => {
        jest.clearAllMocks();
        (Cookies.get as jest.Mock).mockReturnValue('mock-token');
    });

    it('initializes with no user when no token exists', async () => {
        (Cookies.get as jest.Mock).mockReturnValue(undefined);

        const { result } = renderHook(() => useAuthStatus());

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('validates token and sets user when token exists', async () => {
        (AuthService.validateToken as jest.Mock).mockResolvedValue(mockUser);

        const { result } = renderHook(() => useAuthStatus());

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(AuthService.validateToken).toHaveBeenCalledWith('mock-token');
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.loading).toBe(false);
    });

    it('handles invalid token', async () => {
        (AuthService.validateToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

        const { result } = renderHook(() => useAuthStatus());

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(AuthService.validateToken).toHaveBeenCalledWith('mock-token');
        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(Cookies.remove).toHaveBeenCalledWith('token');
    });

    it('handles logout correctly', async () => {
        (AuthService.validateToken as jest.Mock).mockResolvedValue(mockUser);
        (AuthService.logout as jest.Mock).mockImplementation(() => {
            Cookies.remove('token');
        });

        const { result } = renderHook(() => useAuthStatus());

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.user).toEqual(mockUser);

        act(() => {
            result.current.logout();
        });

        expect(AuthService.logout).toHaveBeenCalled();
        expect(Cookies.remove).toHaveBeenCalledWith('token');
        expect(result.current.user).toBeNull();
    });
});
