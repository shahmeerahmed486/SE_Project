"use client"

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthService } from '@/src/api/services/AuthService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { UserRole } from '@/types'
import { Toast } from '@/components/ui/toast'
import Cookies from 'js-cookie'
import { dispatchAuthStateChange } from '@/src/hooks/useAuthStatus'
import Link from 'next/link'
import { Trophy } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      console.log('Attempting login with:', { email, password })
      const { user, token } = await AuthService.login(email, password)
      console.log('Login successful:', { user, token })

      // Store token in cookie (expires in 7 days)
      Cookies.set('token', token, { expires: 7 })

      // Show success toast
      setToastMessage('Login successful!')
      setToastType('success')
      setShowToast(true)

      // Notify auth state change
      dispatchAuthStateChange()

      // Get the redirect URL from query params or use default based on role
      const from = searchParams.get('from')
      const defaultPath = user.role === UserRole.ADMIN
        ? '/admin/dashboard'
        : user.role === UserRole.MANAGEMENT
          ? '/management/dashboard'
          : user.role === UserRole.CAPTAIN
            ? '/captain/dashboard'
            : '/dashboard'

      const redirectPath = from || defaultPath
      console.log('Redirecting to:', redirectPath)

      // Wait for the cookie to be set
      await new Promise(resolve => setTimeout(resolve, 100))

      router.push(redirectPath)
      router.refresh()
    } catch (error: any) {
      console.error('Login error:', error)
      setToastMessage(error.message || 'Login failed')
      setToastType('error')
      setShowToast(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Trophy className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400">Sign in to your MatchDay account</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                  placeholder="Enter your email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full"
                  placeholder="Enter your password"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-4 border-t">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Create one now
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  )
}

