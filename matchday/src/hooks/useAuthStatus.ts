'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/src/api/services/AuthService'
import Cookies from 'js-cookie'
import { User } from '@/types'

// Create a custom event for auth state changes
const AUTH_STATE_CHANGE = 'authStateChange'

// Create a custom event dispatcher
export const dispatchAuthStateChange = () => {
    window.dispatchEvent(new Event(AUTH_STATE_CHANGE))
}

export function useAuthStatus() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const checkAuth = async () => {
        try {
            const token = Cookies.get('token')
            if (token) {
                const userData = await AuthService.validateToken(token)
                setUser(userData)
            } else {
                setUser(null)
            }
        } catch (error) {
            console.error('Auth check error:', error)
            setUser(null)
            Cookies.remove('token')
        } finally {
            setLoading(false)
        }
    }

    // Check auth on mount and token change
    useEffect(() => {
        checkAuth()
    }, [])

    // Listen for auth state changes
    useEffect(() => {
        window.addEventListener(AUTH_STATE_CHANGE, checkAuth)
        return () => {
            window.removeEventListener(AUTH_STATE_CHANGE, checkAuth)
        }
    }, [])

    const logout = () => {
        AuthService.logout()
        setUser(null)
        router.push('/')
        router.refresh()
        dispatchAuthStateChange()
    }

    return { user, loading, logout, refreshAuth: checkAuth }
} 