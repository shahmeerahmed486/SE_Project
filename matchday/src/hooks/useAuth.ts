"use client"

import { useState, useEffect } from "react"
import { User, UserRole, AuthUser } from "@/types"
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

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    // Check for token and load user data
    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = Cookies.get('token')
                if (!token) {
                    setUser(null)
                    setLoading(false)
                    return
                }

                // Decode token to get user ID (in a real app, verify the token)
                const [userId] = token.split('.')

                // Get user data from Firestore
                const userDoc = await getDoc(doc(db, "users", userId))
                if (userDoc.exists()) {
                    setUser({ id: userDoc.id, ...userDoc.data() } as User)
                } else {
                    setUser(null)
                }
            } catch (error) {
                console.error('Error loading user:', error)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        loadUser()
    }, [])

    const signIn = async (email: string, password: string): Promise<User> => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password)
            const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))

            if (!userDoc.exists()) {
                throw new Error("User data not found")
            }

            const userData = { id: userDoc.id, ...userDoc.data() } as User
            setUser(userData)
            return userData
        } catch (error: any) {
            throw new Error(error.message || "Failed to sign in")
        }
    }

    const signUp = async (userData: AuthUser): Promise<User> => {
        try {
            // Create authentication user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                userData.email,
                userData.password
            )

            // Create user document in Firestore
            const newUser: Omit<User, "id"> = {
                email: userData.email,
                name: userData.name,
                role: userData.role || UserRole.USER, // Default to USER role
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            await setDoc(doc(db, "users", userCredential.user.uid), newUser)

            const createdUser = { id: userCredential.user.uid, ...newUser }
            setUser(createdUser)
            return createdUser
        } catch (error: any) {
            throw new Error(error.message || "Failed to create account")
        }
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

    const signOut = async () => {
        try {
            Cookies.remove('token')
            setUser(null)
        } catch (error: any) {
            throw new Error(error.message || "Failed to sign out")
        }
    }

    return {
        user,
        loading,
        signIn,
        signUp,
        signOut,
        createManagementUser,
        becomeCaptain
    }
} 