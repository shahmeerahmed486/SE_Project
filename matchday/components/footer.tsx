"use client"

import Link from "next/link"
import { Facebook, Twitter, Instagram, Github } from "lucide-react"

const footerLinks = {
    product: [
        { name: "Tournaments", href: "/tournaments" },
        { name: "Teams", href: "/teams" },
        { name: "Features", href: "/features" },
    ],
    company: [
        { name: "About Us", href: "/about" },
        { name: "Contact", href: "/contact" },
        { name: "Privacy Policy", href: "/privacy" },
    ],
    resources: [
        { name: "Documentation", href: "/docs" },
        { name: "Help Center", href: "/help" },
        { name: "Terms of Service", href: "/terms" },
    ],
}

const socialLinks = [
    {
        name: "Facebook",
        href: "https://facebook.com",
        icon: Facebook,
    },
    {
        name: "Twitter",
        href: "https://twitter.com",
        icon: Twitter,
    },
    {
        name: "Instagram",
        href: "https://instagram.com",
        icon: Instagram,
    },
    {
        name: "GitHub",
        href: "https://github.com",
        icon: Github,
    },
]

export function Footer() {
    return (
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center space-x-2">
                            <span className="text-xl font-bold">MatchDay</span>
                        </Link>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Empowering sports communities through seamless tournament management.
                        </p>
                    </div>

                    {/* Links Sections */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Product</h3>
                        <ul className="space-y-2">
                            {footerLinks.product.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Company</h3>
                        <ul className="space-y-2">
                            {footerLinks.company.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Resources</h3>
                        <ul className="space-y-2">
                            {footerLinks.resources.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <div className="flex space-x-6">
                            {socialLinks.map((item) => {
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <span className="sr-only">{item.name}</span>
                                        <Icon className="h-5 w-5" />
                                    </Link>
                                )
                            })}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            © {new Date().getFullYear()} MatchDay. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
} 