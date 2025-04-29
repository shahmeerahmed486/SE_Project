import { User, UserRole, Admin, ManagementUser, Captain } from '@/src/types'
import { store } from '../store/inMemoryStore'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, Firestore } from 'firebase/firestore'
import { AuthService } from './AuthService'

export interface UserCreate {
    username: string
    email: string
    password: string
}

export class UserService {
    private static db: Firestore

    static initialize(dbInstance: Firestore) {
        this.db = dbInstance
    }

    static async createAdmin(userData: UserCreate): Promise<Admin> {
        const existingAdmin = await this.getAdminUser()
        if (existingAdmin) {
            throw new Error('Admin user already exists')
        }

        const admin: Admin = {
            id: crypto.randomUUID(),
            username: userData.username,
            email: userData.email,
            role: UserRole.ADMIN,
            password: userData.password,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        await setDoc(doc(this.db, 'users', admin.id), admin)
        await store.createUser(admin)
        return admin
    }

    static async createManagementUser(userData: UserCreate, adminId: string): Promise<ManagementUser> {
        await this.validateUserRole(adminId, [UserRole.ADMIN])

        const managementUser: ManagementUser = {
            id: crypto.randomUUID(),
            username: userData.username,
            email: userData.email,
            role: UserRole.MANAGEMENT,
            password: userData.password,
            assignedTournaments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        await setDoc(doc(this.db, 'users', managementUser.id), managementUser)
        await store.createUser(managementUser)
        return managementUser
    }

    static async registerCaptain(userData: UserCreate): Promise<Captain> {
        const captain: Captain = {
            id: crypto.randomUUID(),
            username: userData.username,
            email: userData.email,
            role: UserRole.CAPTAIN,
            password: userData.password,
            phone: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        await setDoc(doc(this.db, 'users', captain.id), captain)
        await store.createUser(captain)
        return captain
    }

    static async login(email: string, password: string): Promise<User> {
        const userDoc = await getDoc(doc(this.db, 'users', email))

        if (!userDoc.exists()) {
            throw new Error('User not found')
        }

        return userDoc.data() as User
    }

    static async logout(): Promise<void> {
        // Implementation depends on your authentication method
    }

    static async validateUserRole(userId: string, allowedRoles: UserRole[]): Promise<User> {
        const userDoc = await getDoc(doc(this.db, 'users', userId))
        if (!userDoc.exists()) {
            throw new Error('User not found')
        }

        const user = userDoc.data() as User
        if (!allowedRoles.includes(user.role)) {
            throw new Error('Unauthorized: Insufficient permissions')
        }

        return user
    }

    static async getAdminUser(): Promise<Admin | null> {
        const users = await store.getAllUsers()
        return users.find(user => user.role === UserRole.ADMIN) as Admin || null
    }

    static async assignTournamentToManagement(
        managementId: string,
        tournamentId: string,
        adminId: string
    ): Promise<ManagementUser> {
        await this.validateUserRole(adminId, [UserRole.ADMIN])
        const user = await this.validateUserRole(managementId, [UserRole.MANAGEMENT]) as ManagementUser

        if (user.assignedTournaments.includes(tournamentId)) {
            throw new Error('Tournament already assigned to this management user')
        }

        const updatedUser: ManagementUser = {
            ...user,
            assignedTournaments: [...user.assignedTournaments, tournamentId],
            updatedAt: new Date().toISOString()
        }

        await setDoc(doc(this.db, 'users', updatedUser.id), updatedUser)
        await store.updateUser(updatedUser.id, updatedUser)
        return updatedUser
    }
} 