import { ReactNode } from 'react'
import { ShieldCheck } from 'lucide-react'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-light/50 via-white to-white px-6">
      <div className="glass w-full max-w-[420px] rounded-xl border border-neutral-100 p-8 shadow-lg">
        <div className="mb-6 flex items-center justify-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="text-base font-semibold">NutriGuard AI</span>
        </div>
        {children}
      </div>
    </div>
  )
}
