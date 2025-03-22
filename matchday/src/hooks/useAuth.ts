"use client"

import { useState, useEffect } from "react"
import { User, UserRole, AuthUser, Captain } from "@/types"
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from "firebase/auth"
import {
    collection,
    getDocs,
    query,
    where,
    addDoc,
    doc,
    getDoc,
    setDoc
} from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import { AuthService, UserCreate } from '@/api/services/AuthService'

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        try {
            const token = Cookies.get('token')
            if (!token) {
                setLoading(false)
                return
            }

            const user = await AuthService.validateToken(token)
            setUser(user)
        } catch (error) {
            console.error('Auth check failed:', error)
            Cookies.remove('token')
        } finally {
            setLoading(false)
        }
    }

    const signUp = async (userData: UserCreate) => {
        try {
            const { user, token } = await AuthService.signup(userData)
            Cookies.set('token', token, { expires: 7 })
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
            Cookies.set('token', token, { expires: 7 })
            setUser(user)
            return user
        } catch (error) {
            console.error('Login failed:', error)
            throw error
        }
    }

    const logout = () => {
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
    ): Promise<User> => {
        if (!user || user.role !== UserRole.ADMIN) {
            throw new Error("Unauthorized: Only admins can create management users")
        }

        try {
            return await signUp({
                email,
                password,
                name,
                role: UserRole.MANAGEMENT
            })
        } catch (error: any) {
            throw new Error(error.message || "Failed to create management user")
        }
    }

    const becomeCaptain = async (teamId: string): Promise<User> => {
        if (!user) {
            throw new Error("Must be logged in to become a captain")
        }

        try {
            const userRef = doc(db, "users", user.id)
            const updatedUser: User = {
                ...user,
                role: UserRole.CAPTAIN,
                teamId,
                updatedAt: new Date().toISOString()
            }

            await setDoc(userRef, updatedUser, { merge: true })
            setUser(updatedUser)
            return updatedUser
        } catch (error: any) {
            throw new Error(error.message || "Failed to become captain")
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
        createManagementUser,
        becomeCaptain
    }
} 