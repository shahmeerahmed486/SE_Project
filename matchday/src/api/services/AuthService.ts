import { User, UserCreate, UserRole } from '../models/User';
import { store } from '../store/inMemoryStore';
import { generateToken, verifyToken } from '../utils/auth';

export class AuthService {
    static async signup(userData: UserCreate): Promise<{ user: User; token: string }> {
        const existingUser = await store.getUserByEmail(userData.email);
        if (existingUser) {
            throw new Error('User already exists');
        }

        const user: User = {
            id: crypto.randomUUID(),
            email: userData.email,
            name: userData.name,
            role: userData.role || UserRole.USER,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await store.createUser(user);
        const token = generateToken(user);

        return { user, token };
    }

    static async login(email: string, password: string): Promise<{ user: User; token: string }> {
        // In real implementation, verify password hash
        const user = await store.getUserByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const token = generateToken(user);
        return { user, token };
    }
} 