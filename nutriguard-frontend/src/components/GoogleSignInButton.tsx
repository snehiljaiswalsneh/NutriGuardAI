import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'

function GoogleIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.69 9c0-.59.1-1.17.26-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 814 1000">
      <path
        fill="currentColor"
        d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-120.7C159.5 751.5 126 658.5 126 571.5c0-144.4 94.2-220.5 185.7-220.5 49.6 0 90.7 32.6 121.9 32.6 29.8 0 76.2-35.1 133.9-35.1 54.3-.1 108.2 20.1 148.2 82.5zm-107.4-102.1c20.1-24.9 34.2-59.5 34.2-94.2 0-5.1-.5-10.3-1.5-14.4-32.2 1.3-70.6 21.6-93.6 50.1-18.3 22-35.8 56.1-35.8 91.2 0 5.8.9 11.5 1.3 13.3 2.5.4 6.5 1 10.5 1 29.5 0 65.5-19.9 84.9-47z"
      />
    </svg>
  )
}

export function GoogleSignInButton({ redirectError }: { redirectError?: string | null }) {
  const { signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(redirectError ?? null)

  async function handleGoogleSignIn() {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
      navigate('/app/home')
    } catch (err) {
      setLoading(false)
      setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="secondary" className="w-full" loading={loading} onClick={handleGoogleSignIn}>
        {!loading && <GoogleIcon />}
        Continue with Google
      </Button>
      {error && (
        <p role="alert" className="text-center text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

export function AppleSignInButton() {
  const { signInWithApple } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAppleSignIn() {
    setError(null)
    setLoading(true)
    try {
      await signInWithApple()
      navigate('/app/home')
    } catch (err) {
      setLoading(false)
      setError(err instanceof Error ? err.message : 'Apple sign-in failed. Please try again.')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="secondary" className="w-full" loading={loading} onClick={handleAppleSignIn}>
        {!loading && <AppleIcon />}
        Continue with Apple
      </Button>
      {error && (
        <p role="alert" className="text-center text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
