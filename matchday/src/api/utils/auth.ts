import { User } from "@/types"

export function generateToken(user: User): string {
    // For demo purposes, just create a simple encoded string
    return Buffer.from(JSON.stringify({
        id: user.id,
        role: user.role,
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    })).toString('base64')
}

export function verifyToken(token: string): { id: string; role: string } | null {
    try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
        if (decoded.exp < Date.now()) {
            return null
        }
        return { id: decoded.id, role: decoded.role }
    } catch {
        return null
    }
} 