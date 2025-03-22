import { NextResponse } from 'next/server';
import { TournamentService } from '@/src/api/services/TournamentService';
import { validateToken } from '@/src/api/utils/auth';

export async function POST(req: Request) {
    try {
        const token = req.headers.get('Authorization')?.split(' ')[1];
        const user = await validateToken(token);
        const data = await req.json();

        const tournament = await TournamentService.createTournament(data, user.id);
        return NextResponse.json(tournament);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function GET() {
    try {
        const tournaments = await store.getAllTournaments();
        return NextResponse.json(tournaments);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
} 