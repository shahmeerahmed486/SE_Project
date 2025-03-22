"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Trophy, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStatus } from "@/src/hooks/useAuthStatus"
import { UserRole } from "@/types"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet"

export function Nav() {
    const { user, loading, logout } = useAuthStatus()
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Handle initial mount to prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    const getDashboardLink = () => {
        if (!user) return "/dashboard"
        switch (user.role) {
            case UserRole.ADMIN:
                return "/admin/dashboard"
            case UserRole.MANAGEMENT:
                return "/management/dashboard"
            case UserRole.CAPTAIN:
                return "/captain/dashboard"
            default:
                return "/dashboard"
        }
    }

    const handleLogout = async () => {
        await logout()
        setIsOpen(false)
    }

    // Listen for auth state changes
    useEffect(() => {
        const handleAuthChange = () => {
            // Force a re-render when auth state changes
            setIsOpen(false)
        }

        window.addEventListener('authStateChange', handleAuthChange)
        return () => window.removeEventListener('authStateChange', handleAuthChange)
    }, [])

    const NavLinks = () => (
        <>
            <Link
                href="/tournaments"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => setIsOpen(false)}
            >
                Tournaments
            </Link>
            <Link
                href="/teams"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => setIsOpen(false)}
            >
                Teams
            </Link>
            {mounted && user && !loading && (
                <Link
                    href={getDashboardLink()}
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    onClick={() => setIsOpen(false)}
                >
                    Dashboard
                </Link>
            )}
        </>
    )

    const AuthButtons = () => {
        if (!mounted) return null // Don't render anything until mounted

        if (loading) {
            return (
                <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" />
            )
        }

        return user ? (
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {user.username}
                </span>
                <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                    Logout
                </Button>
            </div>
        ) : (
            <Link href="/login" onClick={() => setIsOpen(false)}>
                <Button className="bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                    Login
                </Button>
            </Link>
        )
    }

    return (
        <header className="sticky top-0 z-50 w-full bg-white dark:bg-gray-900 shadow-sm">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-xl">
                                <Trophy className="h-6 w-6" />
                            </div>
                            <span className="text-xl font-bold">MatchDay</span>
                        </Link>
                        <nav className="ml-8 hidden md:flex space-x-8">
                            <NavLinks />
                        </nav>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        <AuthButtons />
                    </div>
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild className="md:hidden">
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                            <nav className="flex flex-col gap-4 mt-8">
                                <NavLinks />
                                <div className="mt-4">
                                    <AuthButtons />
                                </div>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
} 