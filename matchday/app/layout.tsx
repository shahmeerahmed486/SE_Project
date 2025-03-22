import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Nav } from "@/components/nav"
import { Footer } from "@/components/footer"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "MatchDay - Tournament Management System",
    description: "Organize and manage sports tournaments with ease",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <Providers>
                    <div className="flex min-h-screen flex-col bg-background">
                        <Nav />
                        {children}
                        <Footer />
                    </div>
                </Providers>
            </body>
        </html>
    )
}
