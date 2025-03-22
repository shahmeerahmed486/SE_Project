import { User, UserRole } from '@/types'
import { store } from '../store/inMemoryStore'
import { generateToken } from '../utils/auth'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Cookies from 'js-cookie'

const DEFAULT_ADMIN = {
    email: "admin@matchday.com",
    password: "admin123", // In production, this should be hashed
    username: "Admin"
}

export interface UserCreate {
    email: string
    password: string
    username: string
    role?: UserRole
}

export class AuthService {
    static async initializeAdmin(): Promise<void> {
        try {
            const usersRef = collection(db, 'users')
            const q = query(usersRef, where('email', '==', DEFAULT_ADMIN.email))
            const querySnapshot = await getDocs(q)

            if (!querySnapshot.empty) {
                return // Admin already exists
            }

            const admin: User = {
                id: crypto.randomUUID(),
                email: DEFAULT_ADMIN.email,
                username: DEFAULT_ADMIN.username,
                role: UserRole.ADMIN,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            // Store admin in Firestore with password
            await setDoc(doc(db, 'users', admin.id), {
                ...admin,
                password: DEFAULT_ADMIN.password // In production, this should be hashed
            })
            console.log('Admin user created successfully')
        } catch (error) {
            console.error('Error initializing admin:', error)
            throw new Error('Failed to initialize admin')
        }
    }

    static async signup(userData: UserCreate): Promise<{ user: User; token: string }> {
        // Check if user already exists
        const usersRef = collection(db, 'users')
        const q = query(usersRef, where('email', '==', userData.email))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
            throw new Error('User already exists')
        }

        const baseUser = {
            id: crypto.randomUUID(),
            email: userData.email,
            username: userData.username,
            role: userData.role || UserRole.CAPTAIN,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        const user: User = baseUser.role === UserRole.CAPTAIN
            ? { ...baseUser, role: UserRole.CAPTAIN }
            : baseUser.role === UserRole.MANAGEMENT
                ? { ...baseUser, role: UserRole.MANAGEMENT, assignedTournaments: [] }
                : { ...baseUser, role: UserRole.ADMIN }

        // Store user in Firestore with password
        await setDoc(doc(db, 'users', user.id), {
            ...user,
            password: userData.password // In production, this should be hashed
        })

        const token = `${user.id}.${Date.now()}.${user.role.toLowerCase()}`
        return { user, token }
    }

    static async login(email: string, password: string): Promise<{ user: User; token: string }> {
        try {
            // Check for admin first
            if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
                await this.initializeAdmin()

                const usersRef = collection(db, 'users')
                const q = query(usersRef, where('email', '==', DEFAULT_ADMIN.email))
                const querySnapshot = await getDocs(q)

                if (querySnapshot.empty) {
                    throw new Error('Admin user not found')
                }

                const adminDoc = querySnapshot.docs[0]
                const admin = { id: adminDoc.id, ...adminDoc.data() } as User
                const token = `${admin.id}.${Date.now()}.admin`
                return { user: admin, token }
            }

            // Check other users
            const usersRef = collection(db, 'users')
            const q = query(usersRef, where('email', '==', email))
            const querySnapshot = await getDocs(q)

            if (querySnapshot.empty) {
                throw new Error('Invalid credentials')
            }

            const userDoc = querySnapshot.docs[0]
            const userData = userDoc.data()

            // Check if password exists in the document
            if (!userData.password) {
                throw new Error('User account is not properly set up')
            }

            if (userData.password !== password) { // In production, use proper password comparison
                throw new Error('Invalid credentials')
            }

            const user = { id: userDoc.id, ...userData } as User
            const token = `${user.id}.${Date.now()}.${user.role.toLowerCase()}`
            return { user, token }
        } catch (error) {
            console.error('Login error:', error)
            throw error
        }
    }

    static async validateToken(token: string): Promise<User> {
        try {
            const [userId] = token.split('.')
            const userDoc = await getDoc(doc(db, 'users', userId))

            if (!userDoc.exists()) {
                throw new Error('Invalid token')
            }

            const userData = userDoc.data()
            delete userData.password // Don't send password to client
            return { id: userDoc.id, ...userData } as User
        } catch (error) {
            throw new Error('Invalid token')
        }
    }

    static async validateUserRole(userId: string, allowedRoles: UserRole[]): Promise<User> {
        const userDoc = await getDoc(doc(db, "users", userId))
        if (!userDoc.exists()) {
            throw new Error("User not found")
        }

        const user = { id: userDoc.id, ...userDoc.data() } as User
        if (!allowedRoles.includes(user.role)) {
            throw new Error("Unauthorized: Insufficient permissions")
        }

        return user
    }

    static async createManagementUser(userData: UserCreate): Promise<{ user: User; token: string }> {
        return this.signup({
            ...userData,
            role: UserRole.MANAGEMENT
        })
    }

    static async createCaptainUser(userData: UserCreate): Promise<{ user: User; token: string }> {
        return this.signup({
            ...userData,
            role: UserRole.CAPTAIN
        })
    }

    static logout(): void {
        Cookies.remove('token')
    }
} 