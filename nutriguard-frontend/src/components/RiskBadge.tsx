import { ShieldCheck, AlertTriangle, ShieldAlert, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RiskLevel } from '@/data/types'
import { useLanguage } from '@/context/LanguageContext'

const CONFIG: Record<RiskLevel, { labelKey: string; fallback: string; icon: typeof ShieldCheck; classes: string }> = {
  safe: { labelKey: 'badge.safe', fallback: 'Safe', icon: ShieldCheck, classes: 'bg-primary-light text-primary-dark dark:bg-primary-dark/30 dark:text-primary-light' },
  moderate: { labelKey: 'badge.moderate', fallback: 'Moderate Risk', icon: AlertTriangle, classes: 'bg-warning-light text-amber-700 dark:bg-warning/20 dark:text-amber-300' },
  high: { labelKey: 'badge.high', fallback: 'High Risk', icon: ShieldAlert, classes: 'bg-danger-light text-danger dark:bg-danger/20 dark:text-red-300' },
  unknown: { labelKey: 'badge.unknown', fallback: 'Unknown', icon: HelpCircle, classes: 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300' },
}

export function RiskBadge({ risk, size = 'md' }: { risk: RiskLevel; size?: 'sm' | 'md' }) {
  const { t } = useLanguage()
  const { labelKey, fallback, icon: Icon, classes } = CONFIG[risk]
  const label = t(labelKey) || fallback
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        classes,
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      )}
    >
      <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden="true" />
      {label}
    </span>
  )
}

export function riskDotClass(risk: RiskLevel) {
  return {
    safe: 'bg-primary',
    moderate: 'bg-warning',
    high: 'bg-danger',
    unknown: 'bg-neutral-300',
  }[risk]
}
