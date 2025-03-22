import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClientLayout } from "./client-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "Matchday - Tournament Management System",
    description: "Efficiently manage sports tournaments with real-time updates",
    generator: 'v0.dev'
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <ClientLayout>{children}</ClientLayout>
            </body>
        </html>
    )
}
