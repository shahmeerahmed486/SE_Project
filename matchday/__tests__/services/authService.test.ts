import { AuthService } from '../../src/services/auth/AuthService';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserRole } from '../../src/types';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    setDoc: jest.fn(),
    getDoc: jest.fn(),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn()
}));

// Mock localStorage
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// TC44: Test AuthService functionality
describe('AuthService', () => {
    const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: UserRole.CAPTAIN,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockLocalStorage.getItem.mockClear();
        mockLocalStorage.setItem.mockClear();
        mockLocalStorage.removeItem.mockClear();
    });

    // TC45: Test successful sign up
    it('signs up user successfully', async () => {
        (getDocs as jest.Mock).mockResolvedValueOnce({ empty: true });

        const result = await AuthService.signUp(
            mockUser.email,
            mockUser.password,
            mockUser.name,
            mockUser.role
        );

        expect(setDoc).toHaveBeenCalledWith(
            doc(db, 'users', expect.any(String)),
            expect.objectContaining({
                email: mockUser.email,
                name: mockUser.name,
                role: mockUser.role
            })
        );
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('userId', expect.any(String));
    });

    // TC46: Test sign up with existing email
    it('handles existing email sign up', async () => {
        (getDocs as jest.Mock).mockResolvedValueOnce({ empty: false });

        await expect(AuthService.signUp(
            mockUser.email,
            mockUser.password,
            mockUser.name,
            mockUser.role
        )).rejects.toThrow('User already exists');
    });

    // TC47: Test successful sign in
    it('signs in user successfully', async () => {
        (getDocs as jest.Mock).mockResolvedValueOnce({
            empty: false,
            docs: [{ data: () => mockUser }]
        });

        const result = await AuthService.signIn(mockUser.email, mockUser.password);

        expect(result).toEqual(mockUser);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('userId', mockUser.id);
    });

    // TC48: Test sign in with invalid credentials
    it('handles invalid sign in credentials', async () => {
        (getDocs as jest.Mock).mockResolvedValueOnce({
            empty: false,
            docs: [{ data: () => ({ ...mockUser, password: 'wrongpassword' }) }]
        });

        await expect(AuthService.signIn(mockUser.email, mockUser.password))
            .rejects.toThrow('Invalid password');
    });

    // TC49: Test successful sign out
    it('signs out successfully', async () => {
        await AuthService.signOut();

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userId');
    });

    // TC50: Test get current user
    it('gets current user successfully', async () => {
        mockLocalStorage.getItem.mockReturnValueOnce(mockUser.id);
        (getDoc as jest.Mock).mockResolvedValueOnce({
            exists: () => true,
            data: () => mockUser
        });

        const result = await AuthService.getCurrentUser();

        expect(result).toEqual(mockUser);
    });

    // TC51: Test get current user when not logged in
    it('returns null when no user is logged in', async () => {
        mockLocalStorage.getItem.mockReturnValueOnce(null);

        const result = await AuthService.getCurrentUser();

        expect(result).toBeNull();
    });

    // TC52: Test create management user
    it('creates management user successfully', async () => {
        const tournamentIds = ['tournament1', 'tournament2'];
        (getDocs as jest.Mock).mockResolvedValueOnce({ empty: true });

        await AuthService.createManagementUser(
            mockUser.email,
            mockUser.password,
            mockUser.name,
            tournamentIds
        );

        expect(setDoc).toHaveBeenCalledWith(
            doc(db, 'users', expect.any(String)),
            expect.objectContaining({
                email: mockUser.email,
                name: mockUser.name,
                role: UserRole.MANAGEMENT,
                assignedTournaments: tournamentIds
            })
        );
    });
}); 