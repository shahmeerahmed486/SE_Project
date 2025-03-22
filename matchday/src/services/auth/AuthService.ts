import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, UserRole } from '@/types';

export class AuthService {
    static async signUp(email: string, password: string, name: string, role: UserRole = UserRole.USER) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user: User = {
                id: userCredential.user.uid,
                email,
                name,
                role,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await setDoc(doc(db, 'users', user.id), user);
            return user;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    static async signIn(email: string, password: string) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

            if (!userDoc.exists()) {
                throw new Error('User data not found');
            }

            return userDoc.data() as User;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    static async signOut() {
        try {
            await signOut(auth);
        } catch (error: any) {
            throw new Error(error.message);
        }
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
        const currentUser = auth.currentUser;
        if (!currentUser) return null;

        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        return userDoc.exists() ? userDoc.data() as User : null;
    }

    static onAuthStateChange(callback: (user: User | null) => void) {
        return onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                callback(userDoc.exists() ? userDoc.data() as User : null);
            } else {
                callback(null);
            }
        });
    }
} 