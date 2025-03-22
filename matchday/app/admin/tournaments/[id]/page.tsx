"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onSnapshot, doc, query, collection, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Tournament, Team, Match } from "@/types";

export default function TournamentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params); // Unwrap the params promise

    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Real-time tournament updates
        const unsubTournament = onSnapshot(
            doc(db, "tournaments", id),
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    setTournament({ id: docSnapshot.id, ...docSnapshot.data() } as Tournament);
                } else {
                    router.push("/admin/tournaments");
                }
            }
        );

        // Real-time teams updates
        const unsubTeams = onSnapshot(
            query(collection(db, "teams"), where("tournamentId", "==", id)),
            (snapshot) => {
                const teamsData: Team[] = [];
                snapshot.forEach((doc) => {
                    teamsData.push({ id: doc.id, ...doc.data() } as Team);
                });
                setTeams(teamsData);
            }
        );

        // Real-time matches updates
        const unsubMatches = onSnapshot(
            query(collection(db, "matches"), where("tournamentId", "==", id)),
            (snapshot) => {
                const matchesData: Match[] = [];
                snapshot.forEach((doc) => {
                    matchesData.push({ id: doc.id, ...doc.data() } as Match);
                });
                setMatches(matchesData);
            }
        );

        setLoading(false);

        return () => {
            unsubTournament();
            unsubTeams();
            unsubMatches();
        }
    }, [id, router]);

    // ... rest of your component rendering logic
}
