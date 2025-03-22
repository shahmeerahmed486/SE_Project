import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adminAuth } from './app/api/firebase-admin'

export async function middleware(request: NextRequest) {
    const token = request.headers.get('Authorization')?.split('Bearer ')[1]

    if (!token) {
        return NextResponse.json(
            { error: 'Missing authentication token' },
            { status: 401 }
        )
    }

    try {
        const decodedToken = await adminAuth.verifyIdToken(token)
        const userRecord = await adminAuth.getUser(decodedToken.uid)

        // Add user info to request headers
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('X-User-ID', userRecord.uid)
        requestHeaders.set('X-User-Role', decodedToken.role || 'USER')

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        })
    } catch (error) {
        return NextResponse.json(
            { error: 'Invalid authentication token' },
            { status: 401 }
        )
    }
}

export const config = {
    matcher: ['/api/:path*']
} 