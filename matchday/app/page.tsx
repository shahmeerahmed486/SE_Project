"use client"

import Link from "next/link"
import { Trophy, Users, Calendar, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  {
    name: "Tournament Management",
    description: "Create and manage tournaments with ease. Set up brackets, schedules, and rules in minutes.",
    icon: Trophy,
  },
  {
    name: "Team Registration",
    description: "Simple team registration process with customizable forms and automatic roster management.",
    icon: Users,
  },
  {
    name: "Match Scheduling",
    description: "Intelligent match scheduling system that considers team availability and venue capacity.",
    icon: Calendar,
  },
  {
    name: "Secure Platform",
    description: "Built with security in mind, ensuring your tournament data is safe and protected.",
    icon: Shield,
  },
]

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Simplify Your Tournament Management
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Organize tournaments, manage teams, and track matches all in one place.
              Built for sports organizers who want to focus on the game.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/tournaments">
                <Button size="lg" className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700">
                  Browse Tournaments
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Everything You Need to Run Successful Tournaments
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Our platform provides all the tools you need to organize and manage tournaments efficiently.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.name}
                  className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 dark:bg-blue-900">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-white">
              Ready to Start Your Tournament?
            </h2>
            <p className="text-xl text-blue-100">
              Join thousands of organizers who trust MatchDay for their tournaments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100">
                  Get Started
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-blue-700">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

