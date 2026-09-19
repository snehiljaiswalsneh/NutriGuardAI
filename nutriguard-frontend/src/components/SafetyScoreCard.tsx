import { useEffect, useState } from 'react'
import { Card } from './ui/Card'
import { useLanguage } from '@/context/LanguageContext'
import { translateContent } from '@/lib/translator'
import { cn } from '@/lib/utils'
import type { PersonalizedInsights } from '@/hooks/usePersonalizedInsights'

function scoreColor(score: number) {
  if (score >= 80) return { ring: '#0E9F6E', text: 'text-primary-dark dark:text-emerald-400', label: 'Safe' }
  if (score >= 55) return { ring: '#F59E0B', text: 'text-amber-700 dark:text-amber-300', label: 'Moderate Risk' }
  return { ring: '#DC2626', text: 'text-danger dark:text-red-400', label: 'High Risk' }
}

interface SafetyScoreCardProps {
  score: number
  verdict: string
  insights?: PersonalizedInsights
}

export function SafetyScoreCard({ score, verdict, insights }: SafetyScoreCardProps) {
  const [animated, setAnimated] = useState(0)
  const [animatedPersonal, setAnimatedPersonal] = useState(0)
  const { t, language } = useLanguage()

  const displayScore = insights?.hasPersonalization ? insights.personalizedScore : score
  const { ring, text } = scoreColor(displayScore)
  const translatedVerdict = translateContent(verdict, language)
  const circumference = 2 * Math.PI * 54

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimated(score)
      if (insights?.hasPersonalization) setAnimatedPersonal(insights.personalizedScore)
    }, 100)
    return () => clearTimeout(timer)
  }, [score, insights])

  const offset = circumference - (animated / 100) * circumference
  const offsetPersonal = circumference - (animatedPersonal / 100) * circumference
  const showPersonalized = insights?.hasPersonalization && insights.scoreDelta !== 0

  return (
    <Card>
      <p className="mb-1 text-sm font-semibold text-neutral-600 dark:text-neutral-300">{t('dashboard.safetyScore')}</p>
      {showPersonalized && (
        <p className="mb-3 text-[11px] text-neutral-400 dark:text-neutral-500">Personalized for your profile</p>
      )}

      <div className="flex flex-col items-center">
        <div className="relative">
          <svg width="140" height="140" viewBox="0 0 120 120" role="img"
            aria-label={`${t('dashboard.safetyScore')} ${displayScore} out of 100 — ${translatedVerdict}`}>
            {/* Base ring */}
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor"
              className="text-neutral-100 dark:text-white/10" strokeWidth="10" />
            {/* Original score ring (lighter, shown when personalized) */}
            {showPersonalized && (
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke={scoreColor(score).ring}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (animated / 100) * circumference}
                transform="rotate(-90 60 60)"
                opacity={0.25}
                style={{ transition: 'stroke-dashoffset 900ms ease-out' }}
              />
            )}
            {/* Personalized / main score ring */}
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke={ring}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={showPersonalized ? offsetPersonal : offset}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 900ms ease-out' }}
            />
            <text x="60" y="54" textAnchor="middle" fontSize="28" fontWeight="700"
              className="fill-neutral-900 dark:fill-white">
              {Math.round(showPersonalized ? animatedPersonal : animated)}
            </text>
            <text x="60" y="70" textAnchor="middle" fontSize="10"
              className="fill-neutral-500 dark:fill-neutral-400">
              / 100
            </text>
          </svg>
        </div>

        <p className={`mt-1 text-base font-semibold ${text}`}>{translatedVerdict}</p>

        {showPersonalized && insights && (
          <div className="mt-3 flex w-full flex-col gap-2">
            <div className="flex items-center justify-center gap-1">
              <span
                className={cn(
                  'flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold',
                  insights.scoreDelta > 0
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                )}
              >
                <span>{insights.scoreDelta > 0 ? '↑' : '↓'}</span>
                <span>{insights.scoreDelta > 0 ? '+' : ''}{insights.scoreDelta} Personalized</span>
              </span>
            </div>

            {/* Breakdown Analysis items */}
            <div className="space-y-1.5 rounded-xl border border-neutral-100 bg-neutral-50/70 p-2.5 text-xs dark:border-white/5 dark:bg-white/[0.02]">
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-[11px]">
                <span>Base Toxicology Score</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{score}/100</span>
              </div>
              {insights.scoreBreakdown
                .filter((b) => b.category === 'allergy' || b.category === 'fitness')
                .map((b, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-600 dark:text-neutral-400">{b.label}</span>
                    <span
                      className={cn(
                        'font-bold',
                        b.delta > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : b.delta < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-neutral-600'
                      )}
                    >
                      {b.delta > 0 ? `+${b.delta}` : b.delta}
                    </span>
                  </div>
                ))}
              <div className="border-t border-neutral-200/60 pt-1 dark:border-white/10 flex items-center justify-between font-bold text-[11px]">
                <span className="text-neutral-800 dark:text-neutral-200">Your Adjusted Score</span>
                <span className="text-primary-dark dark:text-emerald-400">{displayScore}/100</span>
              </div>
            </div>
          </div>
        )}

        {insights && insights.hasPersonalization && insights.scoreDelta === 0 && (
          <p className="mt-2 text-[10px] text-neutral-400 dark:text-neutral-500 text-center">
            ✓ Score matches your fitness &amp; allergy profile
          </p>
        )}
      </div>
    </Card>
  )
}
