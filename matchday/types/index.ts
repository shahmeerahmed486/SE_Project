export interface Tournament {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  location: string
  format: string
  status: "draft" | "active" | "completed" | "cancelled"
  teamCount: number
  maxTeams: number
  createdAt: Date
  createdBy: string
  rules?: string[]
  announcements?: Announcement[]
}

export interface Team {
  id: string
  name: string
  tournamentId: string
  captain: {
    name: string
    email: string
    phone: string
  }
  players: Player[]
  status: "pending" | "approved" | "rejected" | "eliminated"
  createdAt: Date
}

export interface Player {
  name: string
  email?: string
  position?: string
  number?: number
}

export interface Match {
  id: string
  tournamentId: string
  teamA: string
  teamB: string
  scoreA: number | null
  scoreB: number | null
  date: string
  time: string
  location: string
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  round?: string
  updatedBy?: string
  updatedAt?: Date
}

export interface Announcement {
  id: string
  tournamentId: string
  title: string
  content: string
  createdAt: Date
  createdBy: string
  priority: "low" | "medium" | "high"
}