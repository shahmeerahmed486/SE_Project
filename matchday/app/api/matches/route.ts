import { NextResponse } from 'next/server';
import { MatchService } from '@/src/api/services/MatchService';
import { validateToken } from '@/src/api/utils/auth';

export async function POST(req: Request) {
    try {
        const token = req.headers.get('Authorization')?.split(' ')[1];
        const user = await validateToken(token);
        const data = await req.json();

        const match = await MatchService.scheduleMatch(data, user.id);
        return NextResponse.json(match);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
} 