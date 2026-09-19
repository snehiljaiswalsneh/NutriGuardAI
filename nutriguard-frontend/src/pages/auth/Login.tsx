import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AuthLayout } from '@/components/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { GoogleSignInButton, AppleSignInButton } from '@/components/GoogleSignInButton'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const oauthError = (location.state as { oauthError?: string } | null)?.oauthError
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    login(email)
    setTimeout(() => navigate('/app/home'), 600)
  }

  return (
    <AuthLayout>
      <h1 className="mb-1 text-center text-xl font-semibold">Welcome back</h1>
      <p className="mb-6 text-center text-sm text-neutral-600">Log in to see your scan history and saved reports.</p>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        <div className="-mt-2 text-right">
          <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">
          Log in
        </Button>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs text-neutral-600">
        <div className="h-px flex-1 bg-neutral-100" /> or <div className="h-px flex-1 bg-neutral-100" />
      </div>
      <div className="flex flex-col gap-3">
        <GoogleSignInButton redirectError={oauthError} />
        <AppleSignInButton />
      </div>
      <p className="mt-6 text-center text-sm text-neutral-600">
        New here?{' '}
        <Link to="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  )
}
