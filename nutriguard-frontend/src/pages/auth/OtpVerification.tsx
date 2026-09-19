import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/AuthLayout'
import { Button } from '@/components/ui/Button'

export default function OtpVerification() {
  const navigate = useNavigate()
  const [digits, setDigits] = useState(Array(6).fill(''))
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  function handleChange(index: number, value: string) {
    if (!/^[0-9]?$/.test(value)) return
    const next = [...digits]
    next[index] = value
    setDigits(next)
    if (value && index < 5) inputsRef.current[index + 1]?.focus()
    if (next.every((d) => d !== '')) {
      setTimeout(() => navigate('/app/home'), 500)
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('')
    if (pasted.length) {
      e.preventDefault()
      setDigits(pasted.concat(Array(6 - pasted.length).fill('')))
      if (pasted.length === 6) setTimeout(() => navigate('/app/home'), 500)
    }
  }

  return (
    <AuthLayout>
      <h1 className="mb-1 text-center text-xl font-semibold">Verify your email</h1>
      <p className="mb-6 text-center text-sm text-neutral-600">Enter the 6-digit code we sent to your email.</p>
      <div className="mb-6 flex justify-center gap-2" onPaste={handlePaste} role="group" aria-label="One time passcode">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            inputMode="numeric"
            maxLength={1}
            aria-label={`Digit ${i + 1} of 6`}
            className="h-12 w-11 rounded-sm border border-neutral-300 text-center text-lg font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        ))}
      </div>
      <Button className="w-full" onClick={() => navigate('/app/home')}>
        Verify
      </Button>
      <p className="mt-4 text-center text-sm text-neutral-600">
        Didn't get a code? <button className="font-medium text-primary hover:underline">Resend</button>
      </p>
    </AuthLayout>
  )
}
