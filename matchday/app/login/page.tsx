"use client"

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthService } from '@/src/api/services/AuthService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserRole } from '@/types'
import { Toast } from '@/components/ui/toast'
import Cookies from 'js-cookie'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
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

      // Trigger auth state change
      window.dispatchEvent(new Event('authStateChange'))

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
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Login to Matchday</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>

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

