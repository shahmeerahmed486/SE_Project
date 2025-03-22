"use client"

import { useState, useEffect } from "react"
import { User, UserRole } from "@/types"
import { collection, getDocs, query, where, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    // Demo authentication
    const signIn = async (email: string, password: string): Promise<User> => {
        // Demo user with ADMIN role
        const demoUser: User = {
            id: "demo-user-1",
            email: email,
            name: "Demo User",
            role: UserRole.ADMIN,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        // Store the demo user in localStorage for persistence
        localStorage.setItem("demoUser", JSON.stringify(demoUser))
        setUser(demoUser)
        return demoUser
    }

    const signOut = async () => {
        localStorage.removeItem("demoUser")
        setUser(null)
    }

    // Check for stored demo user on mount
    useEffect(() => {
        const storedUser = localStorage.getItem("demoUser")
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        }
        setLoading(false)
    }, [])

    // Demo function to create management users (still uses Firestore)
    const createManagementUser = async (
        email: string,
        password: string,
        name: string,
        tournamentIds: string[]
    ): Promise<User> => {
        try {
            // Check if user already exists
            const usersRef = collection(db, "users")
            const q = query(usersRef, where("email", "==", email))
            const querySnapshot = await getDocs(q)

            if (!querySnapshot.empty) {
                throw new Error("User already exists")
            }

            // Create new user in Firestore
            const newUser: Omit<User, "id"> = {
                email,
                name,
                role: UserRole.MANAGEMENT,
                tournamentIds,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            const docRef = await addDoc(usersRef, newUser)
            return { ...newUser, id: docRef.id }
        } catch (error: any) {
            throw new Error(error.message || "Failed to create management user")
        }
    }

    return {
        user,
        loading,
        signIn,
        signOut,
        createManagementUser
    }
} 