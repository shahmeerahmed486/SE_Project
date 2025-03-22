'use client'

import { useEffect } from 'react'
import { AuthService } from '@/src/api/services/AuthService'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Nav } from "@/components/nav"

export function ClientLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        AuthService.initializeAdmin().catch(console.error)
    }, [])

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <Nav />
            {children}
            <Toaster />
        </ThemeProvider>
    )
} 