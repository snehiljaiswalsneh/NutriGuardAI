import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { GoogleSignInButton, AppleSignInButton } from '@/components/GoogleSignInButton'

export default function Signup() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    login(email, name)
    setTimeout(() => navigate('/app/home'), 600)
  }

  return (
    <AuthLayout>
      <h1 className="mb-1 text-center text-xl font-semibold">Create your account</h1>
      <p className="mb-6 text-center text-sm text-neutral-600">Start analyzing ingredients in under a minute.</p>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          label="Full name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jordan Smith"
        />
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
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
        <Button type="submit" loading={loading} className="w-full">
          Create account
        </Button>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs text-neutral-600">
        <div className="h-px flex-1 bg-neutral-100" /> or <div className="h-px flex-1 bg-neutral-100" />
      </div>
      <div className="flex flex-col gap-3">
        <GoogleSignInButton />
        <AppleSignInButton />
      </div>
      <p className="mt-6 text-center text-sm text-neutral-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}
