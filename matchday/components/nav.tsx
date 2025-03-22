"use client"

import Link from "next/link"
import { Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStatus } from "@/src/hooks/useAuthStatus"
import { UserRole } from "@/types"

export function Nav() {
    const { user, loading, logout } = useAuthStatus()

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

    const handleLogout = () => {
        logout()
    }

    return (
        <header className="w-full border-b bg-background">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2">
                        <Trophy className="h-6 w-6" />
                        <span className="text-xl font-bold">Matchday</span>
                    </Link>
                    <nav className="ml-8 hidden md:flex gap-6">
                        <Link href="/tournaments" className="text-sm font-medium hover:underline">
                            Tournaments
                        </Link>
                        <Link href="/teams" className="text-sm font-medium hover:underline">
                            Teams
                        </Link>
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    {user && !loading && (
                        <>
                            <span className="text-sm text-muted-foreground">
                                {user.username}
                            </span>
                            <Link href={getDashboardLink()}>
                                <Button variant="ghost">Dashboard</Button>
                            </Link>
                        </>
                    )}
                    {!loading && (
                        user ? (
                            <Button variant="outline" onClick={handleLogout}>
                                Logout
                            </Button>
                        ) : (
                            <Link href="/login">
                                <Button>Login</Button>
                            </Link>
                        )
                    )}
                </div>
            </div>
        </header>
    )
} 