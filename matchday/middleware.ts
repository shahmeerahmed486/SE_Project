import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // List of protected routes that require authentication
    const protectedRoutes = [
        '/admin',
        '/management',
        '/captain',
        '/tournaments/create',
        '/tournaments/edit',
    ]

    // Check if the current path matches any protected route
    const isProtectedRoute = protectedRoutes.some(route =>
        request.nextUrl.pathname.startsWith(route)
    )

    if (!isProtectedRoute) {
        return NextResponse.next()
    }

    const token = request.cookies.get('token')?.value

    if (!token) {
        const url = new URL('/login', request.url)
        url.searchParams.set('from', request.nextUrl.pathname)
        return NextResponse.redirect(url)
    }

    // Check role-based access
    const [, , role] = token.split('.')
    const path = request.nextUrl.pathname

    if (path.startsWith('/admin') && role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    if (path.startsWith('/management') && role !== 'management') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    if (path.startsWith('/captain') && role !== 'captain') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/management/:path*',
        '/captain/:path*',
        '/tournaments/create',
        '/tournaments/edit/:path*',
    ]
} 