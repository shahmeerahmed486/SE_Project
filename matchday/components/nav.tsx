"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Trophy, Users, Home } from "lucide-react"

export function Nav() {
    const pathname = usePathname()

    const links = [
        { href: "/", label: "Home", icon: Home },
        { href: "/tournaments", label: "Tournaments", icon: Trophy },
        { href: "/teams", label: "Teams", icon: Users },
    ]

    return (
        <nav className="border-b">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-6">
                    {links.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                                    isActive
                                        ? "text-primary"
                                        : "text-muted-foreground"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </Link>
                        )
                    })}
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/login">
                        <Button variant="outline">Login</Button>
                    </Link>
                </div>
            </div>
        </nav>
    )
} 