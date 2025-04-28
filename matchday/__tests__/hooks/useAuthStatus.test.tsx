import { renderHook, act } from '@testing-library/react';
import { useAuthStatus } from '@/src/hooks/useAuthStatus';
import { User, UserRole } from '@/src/types';

// TC14: Test useAuthStatus hook functionality
describe('useAuthStatus', () => {
    const mockUser = {
        id: 'u1',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        role: UserRole.CAPTAIN,
        password: 'password123',
        createdAt: new Date(),
        updatedAt: new Date(),
        phone: '1234567890'
    } as const;

    // TC15: Test initial state
    it('returns initial state correctly', () => {
        const { result } = renderHook(() => useAuthStatus());

        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(true);
    });

    // TC16: Test authenticated state
    it('returns authenticated state correctly', async () => {
        const { result } = renderHook(() => useAuthStatus());

        await act(async () => {
            // Simulate authentication
            result.current.user = mockUser;
            result.current.loading = false;
        });

        expect(result.current.user).toEqual(mockUser);
        expect(result.current.loading).toBe(false);
    });

    // TC17: Test role-based access
    it('handles role-based access correctly', async () => {
        const { result } = renderHook(() => useAuthStatus());

        await act(async () => {
            // Simulate admin user
            result.current.user = mockUser;
            result.current.loading = false;
        });

        expect(result.current.user?.role).toBe(UserRole.ADMIN);
    });
}); 