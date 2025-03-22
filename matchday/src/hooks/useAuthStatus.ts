'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/src/api/services/AuthService'
import Cookies from 'js-cookie'
import { User } from '@/types'

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
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        checkAuth()
    }, [])

    // Add event listener for auth state changes
    useEffect(() => {
        window.addEventListener('authStateChange', checkAuth)
        return () => {
            window.removeEventListener('authStateChange', checkAuth)
        }
    }, [])

    const logout = () => {
        AuthService.logout()
        setUser(null)
        router.push('/')
        router.refresh()
        window.dispatchEvent(new Event('authStateChange'))
    }

    return { user, loading, logout, refreshAuth: checkAuth }
} 