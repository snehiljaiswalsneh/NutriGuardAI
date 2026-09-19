import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('Signing you in with Google…')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const oauthError = params.get('error_description') || params.get('error') || hashParams.get('error_description')

    if (oauthError) {
      setMessage(oauthError)
      const timer = setTimeout(() => navigate('/login', { replace: true, state: { oauthError } }), 1600)
      return () => clearTimeout(timer)
    }

    let settled = false

    const goHome = () => {
      if (settled) return
      settled = true
      navigate('/app/home', { replace: true })
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) goHome()
    })

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        goHome()
        return
      }
      setTimeout(() => {
        if (!settled) {
          setMessage('Could not complete Google sign-in. Please try again.')
          navigate('/login', { replace: true, state: { oauthError: 'Could not complete Google sign-in. Please try again.' } })
        }
      }, 8000)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [navigate])

  return (
    <AuthLayout>
      <p className="text-center text-sm text-neutral-600">{message}</p>
    </AuthLayout>
  )
}
