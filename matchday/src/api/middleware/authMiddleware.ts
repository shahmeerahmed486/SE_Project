import { NextResponse } from 'next/server';
import { validateToken } from '../utils/auth';
import { UserRole } from '../models/User';

export async function withAuth(
    handler: Function,
    allowedRoles: UserRole[] = []
) {
    return async (req: Request) => {
        try {
            const token = req.headers.get('Authorization')?.split(' ')[1];
            if (!token) {
                return NextResponse.json(
                    { error: 'Authentication required' },
                    { status: 401 }
                );
            }

            const user = await validateToken(token);

            if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                return NextResponse.json(
                    { error: 'Insufficient permissions' },
                    { status: 403 }
                );
            }

            return handler(req, user);
        } catch (error: any) {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            );
        }
    };
} 