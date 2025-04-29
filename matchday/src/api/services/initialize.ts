import { Firestore } from 'firebase/firestore'
import { AuthService } from './AuthService'
import { TeamService } from './TeamService'
import { UserService } from './UserService'

export function initializeServices(db: Firestore) {
    AuthService.initialize(db)
    TeamService.initialize(db)
    UserService.initialize(db)
} 