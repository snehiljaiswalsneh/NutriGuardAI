import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { AuthLayout } from '@/components/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-light">
            <MailCheck className="h-6 w-6 text-primary-dark" />
          </div>
          <h1 className="mb-1 text-xl font-semibold">Check your inbox</h1>
          <p className="mb-6 text-sm text-neutral-600">
            If an account exists for that email, we've sent a link to reset your password.
          </p>
          <Link to="/login" className="text-sm font-medium text-primary hover:underline">
            Back to log in
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className="mb-1 text-center text-xl font-semibold">Reset your password</h1>
      <p className="mb-6 text-center text-sm text-neutral-600">
        Enter your account email and we'll send you a reset link.
      </p>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input label="Email" type="email" autoComplete="email" required placeholder="you@example.com" />
        <Button type="submit" className="w-full">
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-neutral-600">
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthLayout>
  )
}
