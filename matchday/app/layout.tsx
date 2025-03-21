import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Nav } from "@/components/nav"

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
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Nav />
          <main>{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'