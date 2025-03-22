import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { clientDb, adminDb } from "@/lib/firebase"
import { Tournament, Team, Match, Announcement } from "@/types"

export class FirebaseService {
    // Tournament operations
    static async createTournament(data: Omit<Tournament, "id">): Promise<Tournament> {
        const docRef = await addDoc(collection(clientDb, "tournaments"), {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        return { id: docRef.id, ...data } as Tournament
    }

    static async getTournaments(): Promise<Tournament[]> {
        const querySnapshot = await getDocs(collection(clientDb, "tournaments"))
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Tournament[]
    }

    static async updateTournament(id: string, data: Partial<Tournament>): Promise<void> {
        const docRef = doc(clientDb, "tournaments", id)
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date()
        })
    }

    // Team operations
    static async createTeam(data: Omit<Team, "id">): Promise<Team> {
        const docRef = await addDoc(collection(clientDb, "teams"), {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        return { id: docRef.id, ...data } as Team
    }

    static async getTeamsByTournament(tournamentId: string): Promise<Team[]> {
        const q = query(
            collection(clientDb, "teams"),
            where("tournamentId", "==", tournamentId)
        )
        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Team[]
    }

    // Match operations
    static async createMatch(data: Omit<Match, "id">): Promise<Match> {
        const docRef = await addDoc(collection(clientDb, "matches"), {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        return { id: docRef.id, ...data } as Match
    }

    static async updateMatchResult(
        id: string,
        scoreA: number,
        scoreB: number
    ): Promise<void> {
        const docRef = doc(clientDb, "matches", id)
        await updateDoc(docRef, {
            scoreA,
            scoreB,
            status: "completed",
            updatedAt: new Date()
        })
    }

    // Announcement operations
    static async createAnnouncement(data: Omit<Announcement, "id">): Promise<Announcement> {
        const docRef = await addDoc(collection(clientDb, "announcements"), {
            ...data,
            createdAt: new Date()
        })
        return { id: docRef.id, ...data } as Announcement
    }
} 