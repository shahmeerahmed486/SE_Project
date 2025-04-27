import { NextResponse } from 'next/server';
import { MatchService } from '@/src/api/services/MatchService';
import { verifyToken } from '@/src/api/utils/auth';

export async function POST(req: Request) {
    try {
        const token = req.headers.get('Authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Authorization token missing' }, { status: 401 });
        }

        const user = await verifyToken(token);
        if (!user) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        const data = await req.json();
        const match = await MatchService.scheduleMatch(data, user.id);
        return NextResponse.json(match);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}