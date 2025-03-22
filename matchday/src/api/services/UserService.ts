import { User, UserRole, Admin, ManagementTeam, Captain } from '@/types'
import { store } from '../store/inMemoryStore'
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { AuthService } from './AuthService'

export interface UserCreate {
    username: string
    email: string
    password: string
}

export class UserService {
    static async createAdmin(userData: UserCreate): Promise<Admin> {
        const existingAdmin = await this.getAdminUser()
        if (existingAdmin) {
            throw new Error('Admin user already exists')
        }

        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)

        const admin: Admin = {
            id: userCredential.user.uid,
            username: userData.username,
            email: userData.email,
            role: UserRole.ADMIN,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        await setDoc(doc(db, 'users', admin.id), admin)
        await store.createUser(admin)
        return admin
    }

    static async createManagementUser(userData: UserCreate, adminId: string): Promise<ManagementTeam> {
        await this.validateUserRole(adminId, [UserRole.ADMIN])

        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)

        const managementUser: ManagementTeam = {
            id: userCredential.user.uid,
            username: userData.username,
            email: userData.email,
            role: UserRole.MANAGEMENT,
            assignedTournaments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        await setDoc(doc(db, 'users', managementUser.id), managementUser)
        await store.createUser(managementUser)
        return managementUser
    }

    static async registerCaptain(userData: UserCreate): Promise<Captain> {
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)

        const captain: Captain = {
            id: userCredential.user.uid,
            username: userData.username,
            email: userData.email,
            role: UserRole.CAPTAIN,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        await setDoc(doc(db, 'users', captain.id), captain)
        await store.createUser(captain)
        return captain
    }

    static async login(email: string, password: string): Promise<User> {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))

        if (!userDoc.exists()) {
            throw new Error('User not found')
        }

        return userDoc.data() as User
    }

    static async logout(): Promise<void> {
        await signOut(auth)
    }

    static async validateUserRole(userId: string, allowedRoles: UserRole[]): Promise<User> {
        const userDoc = await getDoc(doc(db, 'users', userId))
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
    ): Promise<ManagementTeam> {
        await this.validateUserRole(adminId, [UserRole.ADMIN])
        const user = await this.validateUserRole(managementId, [UserRole.MANAGEMENT]) as ManagementTeam

        if (user.assignedTournaments.includes(tournamentId)) {
            throw new Error('Tournament already assigned to this management user')
        }

        const updatedUser: ManagementTeam = {
            ...user,
            assignedTournaments: [...user.assignedTournaments, tournamentId],
            updatedAt: new Date().toISOString()
        }

        await setDoc(doc(db, 'users', updatedUser.id), updatedUser)
        await store.updateUser(updatedUser.id, updatedUser)
        return updatedUser
    }
} 