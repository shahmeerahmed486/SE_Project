import { AuthService, UserCreate } from '@/src/api/services/AuthService';
import { UserRole } from '@/src/types';
import { doc, setDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Cookies from 'js-cookie';

// Mock console.error
jest.spyOn(console, 'error').mockImplementation(() => { });

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    setDoc: jest.fn(),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(),
    getDoc: jest.fn()
}));

// Mock js-cookie
jest.mock('js-cookie', () => ({
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn()
}));

describe('AuthService', () => {
    const mockUserData: UserCreate = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('signup', () => {
        it('signs up user successfully', async () => {
            const mockDocRef = { id: 'user1' };
            (doc as jest.Mock).mockReturnValue(mockDocRef);
            (setDoc as jest.Mock).mockResolvedValue(undefined);
            (getDocs as jest.Mock).mockResolvedValue({ empty: true });

            const result = await AuthService.signup(mockUserData);

            expect(doc).toHaveBeenCalledWith(db, 'users', expect.any(String));
            expect(setDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
                email: 'test@example.com',
                username: 'testuser',
                role: UserRole.CAPTAIN
            }));
            expect(result.user).toEqual(expect.objectContaining({
                email: 'test@example.com',
                username: 'testuser',
                role: UserRole.CAPTAIN
            }));
            expect(result.token).toBeDefined();
        });

        it('handles existing email sign up', async () => {
            (getDocs as jest.Mock).mockResolvedValue({ empty: false });

            await expect(AuthService.signup(mockUserData))
                .rejects.toThrow('User already exists');
        });
    });

    describe('login', () => {
        it('logs in user successfully', async () => {
            const mockUserDoc = {
                id: 'user1',
                email: 'test@example.com',
                username: 'testuser',
                role: UserRole.CAPTAIN,
                password: 'password123'
            };
            (getDocs as jest.Mock).mockResolvedValue({
                empty: false,
                docs: [{ data: () => mockUserDoc }]
            });

            const result = await AuthService.login('test@example.com', 'password123');

            expect(result.user).toEqual(expect.objectContaining({
                email: 'test@example.com',
                username: 'testuser',
                role: UserRole.CAPTAIN
            }));
            expect(result.token).toBeDefined();
        });

        it('handles invalid credentials', async () => {
            (getDocs as jest.Mock).mockResolvedValue({ empty: true });

            await expect(AuthService.login('test@example.com', 'wrongpassword'))
                .rejects.toThrow('Invalid credentials');
        });
    });

    describe('createManagementUser', () => {
        it('creates management user successfully', async () => {
            const mockDocRef = { id: 'user1' };
            (doc as jest.Mock).mockReturnValue(mockDocRef);
            (setDoc as jest.Mock).mockResolvedValue(undefined);
            (getDocs as jest.Mock).mockResolvedValue({ empty: true });

            const result = await AuthService.createManagementUser(mockUserData);

            expect(doc).toHaveBeenCalledWith(db, 'users', expect.any(String));
            expect(setDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
                email: 'test@example.com',
                username: 'testuser',
                role: UserRole.MANAGEMENT,
                assignedTournaments: []
            }));
            expect(result.user).toEqual(expect.objectContaining({
                email: 'test@example.com',
                username: 'testuser',
                role: UserRole.MANAGEMENT
            }));
            expect(result.token).toBeDefined();
        });
    });

    describe('logout', () => {
        it('removes token cookie', () => {
            AuthService.logout();
            expect(Cookies.remove).toHaveBeenCalledWith('token');
        });
    });

    describe('validateToken', () => {
        it('validates token successfully', async () => {
            const mockUserDoc = {
                exists: () => true,
                data: () => ({
                    email: 'test@example.com',
                    username: 'testuser',
                    role: UserRole.CAPTAIN
                }),
                id: 'user1'
            };
            (doc as jest.Mock).mockReturnValue({});
            (getDoc as jest.Mock).mockResolvedValue(mockUserDoc);

            const result = await AuthService.validateToken('user1.1234567890.captain');
            expect(result).toEqual(expect.objectContaining({
                email: 'test@example.com',
                username: 'testuser',
                role: UserRole.CAPTAIN
            }));
        });

        it('handles invalid token', async () => {
            const mockUserDoc = {
                exists: () => false
            };
            (doc as jest.Mock).mockReturnValue({});
            (getDoc as jest.Mock).mockResolvedValue(mockUserDoc);

            await expect(AuthService.validateToken('invalid.token'))
                .rejects.toThrow('Invalid token');
        });
    });

    describe('validateUserRole', () => {
        it('validates user role successfully', async () => {
            const mockUserDoc = {
                exists: () => true,
                data: () => ({
                    email: 'test@example.com',
                    username: 'testuser',
                    role: UserRole.MANAGEMENT
                }),
                id: 'user1'
            };
            (doc as jest.Mock).mockReturnValue({});
            (getDoc as jest.Mock).mockResolvedValue(mockUserDoc);

            const result = await AuthService.validateUserRole('user1', [UserRole.MANAGEMENT]);
            expect(result).toEqual(expect.objectContaining({
                email: 'test@example.com',
                username: 'testuser',
                role: UserRole.MANAGEMENT
            }));
        });

        it('handles insufficient permissions', async () => {
            const mockUserDoc = {
                exists: () => true,
                data: () => ({
                    email: 'test@example.com',
                    username: 'testuser',
                    role: UserRole.CAPTAIN
                }),
                id: 'user1'
            };
            (doc as jest.Mock).mockReturnValue({});
            (getDoc as jest.Mock).mockResolvedValue(mockUserDoc);

            await expect(AuthService.validateUserRole('user1', [UserRole.MANAGEMENT]))
                .rejects.toThrow('Unauthorized: Insufficient permissions');
        });
    });
});