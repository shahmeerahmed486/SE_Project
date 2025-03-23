"use client"

import { useState, useEffect } from "react"
import { User, UserRole, Admin, ManagementTeam as ManagementUser, Captain } from "@/types"
import { useRouter } from 'next/navigation'
import { AuthService } from '@/src/api/services/AuthService'
import Cookies from 'js-cookie'

// Convert AuthUser to appropriate User type based on role
const convertToUser = (authUser: any): User => {
    const base = {
        ...authUser,
        createdAt: new Date(authUser.createdAt),
        updatedAt: new Date(authUser.updatedAt)
    }

    switch (authUser.role) {
        case UserRole.ADMIN:
            return base as Admin
        case UserRole.MANAGEMENT:
            return {
                ...base,
                assignedTournaments: authUser.assignedTournaments || []
            } as ManagementUser
        case UserRole.CAPTAIN:
            return {
                ...base,
                phone: authUser.phone || '',
                teamId: authUser.teamId
            } as Captain
        default:
            throw new Error(`Invalid user role: ${authUser.role}`)
    }
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const token = Cookies.get('token')
                if (!token) {
                    setUser(null)
                    setLoading(false)
                    return
                }

                const user = await AuthService.validateToken(token)
                setUser(user)
            } catch (error) {
                console.error('Auth initialization failed:', error)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        initializeAuth()
    }, [])

    const signUp = async (email: string, password: string, name: string, role: UserRole = UserRole.CAPTAIN, phone?: string) => {
        if (role === UserRole.CAPTAIN && !phone) {
            throw new Error('Phone number is required for captain registration')
        }

        try {
            const { user, token } = await AuthService.signup({
                email,
                password,
                username: name,
                role,
                phone
            })
            Cookies.set('token', token)
            setUser(user)
            return user
        } catch (error) {
            console.error('Signup failed:', error)
            throw error
        }
    }

    const login = async (email: string, password: string) => {
        try {
            const { user, token } = await AuthService.login(email, password)
            Cookies.set('token', token)
            setUser(user)
            return user
        } catch (error) {
            console.error('Login failed:', error)
            throw error
        }
    }

    const logout = async () => {
        AuthService.logout()
        setUser(null)
        router.push('/login')
    }

    const isAuthenticated = () => {
        return !!user
    }

    const isAdmin = () => {
        return user?.role === UserRole.ADMIN
    }

    const isManagement = () => {
        return user?.role === UserRole.MANAGEMENT
    }

    const isCaptain = () => {
        return user?.role === UserRole.CAPTAIN
    }

    const createManagementUser = async (
        email: string,
        password: string,
        name: string,
        tournamentIds: string[]
    ): Promise<ManagementUser> => {
        if (!user || user.role !== UserRole.ADMIN) {
            throw new Error("Unauthorized: Only admins can create management users")
        }

        try {
            const { user: newUser } = await AuthService.createManagementUser({
                email,
                password,
                username: name,
                role: UserRole.MANAGEMENT
            })
            return newUser as ManagementUser
        } catch (error: any) {
            throw new Error(error.message || "Failed to create management user")
        }
    }

    return {
        user,
        loading,
        signUp,
        login,
        logout,
        isAuthenticated,
        isAdmin,
        isManagement,
        isCaptain,
        createManagementUser
    }
} 