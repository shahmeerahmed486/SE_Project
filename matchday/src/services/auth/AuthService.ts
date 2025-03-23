import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, UserRole } from '@/types';

interface AuthUser {
    id: string;
    email: string;
    name?: string;
    role: UserRole;
    password: string;
    createdAt: string;
    updatedAt: string;
    phone?: string;
}

export class AuthService {
    static async signUp(email: string, password: string, name: string, role: UserRole = UserRole.CAPTAIN, phone?: string) {
        try {
            // Check if user already exists
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email));
            const existingUsers = await getDocs(q);

            if (!existingUsers.empty) {
                throw new Error('User already exists');
            }

            // Create new user
            const user: AuthUser = {
                id: crypto.randomUUID(),
                email,
                name,
                password,
                role: role,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                phone: phone || ''
            };

            await setDoc(doc(db, 'users', user.id), user);
            localStorage.setItem('userId', user.id);
            return user;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    static async signIn(email: string, password: string) {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email));
            const userDocs = await getDocs(q);

            if (userDocs.empty) {
                throw new Error('User not found');
            }

            const userData = userDocs.docs[0].data() as AuthUser;
            if (userData.password !== password) {
                throw new Error('Invalid password');
            }

            // Store user ID in localStorage for session management
            localStorage.setItem('userId', userData.id);
            return userData;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    static async signOut() {
        localStorage.removeItem('userId');
    }

    static async createManagementUser(email: string, password: string, name: string, tournamentIds: string[]) {
        const user = await this.signUp(email, password, name, UserRole.MANAGEMENT);
        await setDoc(doc(db, 'users', user.id), {
            ...user,
            assignedTournaments: tournamentIds,
            updatedAt: serverTimestamp()
        }, { merge: true });
        return user;
    }

    static async getCurrentUser(): Promise<User | null> {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) return null;

            const userDoc = await getDoc(doc(db, 'users', userId));
            if (!userDoc.exists()) {
                localStorage.removeItem('userId');
                return null;
            }
            return userDoc.data() as User;
        } catch (error) {
            console.error('Error getting current user:', error);
            localStorage.removeItem('userId');
            return null;
        }
    }

    static onAuthStateChange(callback: (user: User | null) => void) {
        const handleStorageChange = () => {
            const userId = localStorage.getItem('userId');
            if (userId) {
                getDoc(doc(db, 'users', userId)).then(doc => {
                    callback(doc.exists() ? doc.data() as User : null);
                });
            } else {
                callback(null);
            }
        };

        // Initial check
        handleStorageChange();

        // Listen for storage changes
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }
} 