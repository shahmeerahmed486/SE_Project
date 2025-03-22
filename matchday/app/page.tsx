import { Trophy, Calendar, Users, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Manage Your Sports Tournaments with Ease
                </h1>
                <p className="text-muted-foreground md:text-xl">
                  Matchday is a comprehensive tournament management system that helps you organize, track, and share
                  your sports events in real-time.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/tournaments">
                    <Button>
                      View Tournaments
                    </Button>
                  </Link>
                  <Link href="/teams">
                    <Button variant="outline">View Teams</Button>
                  </Link>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-md aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-6 flex items-center justify-center">
                  <Trophy className="h-24 w-24 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Features</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Everything you need to run successful tournaments
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
              <div className="grid gap-6">
                <div className="flex items-start gap-4">
                  <Trophy className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="text-xl font-bold">Tournament Creation</h3>
                    <p className="text-muted-foreground">
                      Create and customize tournaments with different formats including knockout, league, and
                      round-robin.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="text-xl font-bold">Team Management</h3>
                    <p className="text-muted-foreground">
                      Easily manage team registrations, approvals, and player information.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-6">
                <div className="flex items-start gap-4">
                  <Calendar className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="text-xl font-bold">Match Scheduling</h3>
                    <p className="text-muted-foreground">
                      Create and manage match schedules with real-time updates for participants and spectators.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Shield className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="text-xl font-bold">Real-time Results</h3>
                    <p className="text-muted-foreground">
                      Update match results instantly and automatically generate tournament standings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="container flex flex-col gap-2 sm:flex-row py-6 w-full items-center justify-between">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Matchday. All rights reserved.</p>
          <nav className="flex gap-4 sm:gap-6">
            <Link href="#" className="text-xs hover:underline underline-offset-4">
              Terms of Service
            </Link>
            <Link href="#" className="text-xs hover:underline underline-offset-4">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

