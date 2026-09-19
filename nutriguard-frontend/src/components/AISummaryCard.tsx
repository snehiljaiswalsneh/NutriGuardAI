import { Sparkles, Dumbbell, AlertTriangle, ShieldCheck, HeartPulse, Zap, Pill, Mountain } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { translateContent } from '@/lib/translator'
import { cn } from '@/lib/utils'
import type { NutritionProfile } from '@/data/types'
import type { PersonalizedInsights } from '@/hooks/usePersonalizedInsights'

interface AISummaryCardProps {
  summary: string
  nutritionProfile?: NutritionProfile
  insights?: PersonalizedInsights
}

function DVBar({ value, type }: { value: number; type: 'good' | 'bad' | 'neutral' }) {
  const capped = Math.min(value, 100)
  const color =
    type === 'good'
      ? 'bg-emerald-500'
      : type === 'bad'
      ? value >= 20 ? 'bg-red-500' : 'bg-amber-400'
      : 'bg-blue-400'
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
      <div
        className={cn('h-full rounded-full transition-all duration-700', color)}
        style={{ width: `${capped}%` }}
      />
    </div>
  )
}

const NUTRIENT_NAME_MAP: Record<string, string> = {
  'Total Carbohydrate': 'Total Carbohydrates',
  'Total Carbohydrates': 'Total Carbohydrates',
  'Total Fat': 'Total Fat',
  'Saturated Fat': 'Saturated Fat',
  'Dietary Fiber': 'Dietary Fiber',
  'Total Sugars': 'Total Sugars',
  'Added Sugars': 'Added Sugars',
  'Protein': 'Protein',
  'Sodium': 'Sodium',
  'Calcium': 'Calcium',
  'Phosphorus': 'Phosphorus',
  'Potassium': 'Potassium',
  'Magnesium': 'Magnesium',
  'Iron': 'Iron',
  'Zinc': 'Zinc',
  'Vitamin B12': 'Vitamin B12',
  'Vitamin B6': 'Vitamin B6',
  'Vitamin D': 'Vitamin D',
  'Vitamin A': 'Vitamin A',
  'Vitamin C': 'Vitamin C',
  'Vitamin E': 'Vitamin E',
  'Niacin (B3)': 'Niacin (B3)',
}

function formatNutrientName(raw: string): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  if (NUTRIENT_NAME_MAP[trimmed]) return NUTRIENT_NAME_MAP[trimmed]
  if (/^vit\b/i.test(trimmed) && !/^vitamin\b/i.test(trimmed)) {
    return trimmed.replace(/^vit\.?\s*/i, 'Vitamin ')
  }
  return trimmed
}

function NutrientItem({
  name,
  amount,
  unit,
  dailyValue,
  label,
  type,
  goalMatch,
}: {
  name: string
  amount: string
  unit: string
  dailyValue?: number
  label?: string
  type: 'good' | 'bad' | 'neutral'
  goalMatch?: string
}) {
  const dvNum = dailyValue ?? 0
  const displayName = formatNutrientName(name)
  return (
    <div className="rounded-lg border border-neutral-100 bg-neutral-50/50 p-2.5 dark:border-white/5 dark:bg-white/[0.015] space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 leading-snug break-words">
              {displayName}
            </span>
            {goalMatch && (
              <span
                className={cn(
                  'shrink-0 rounded px-1.5 py-0.2 text-[9px] font-bold',
                  type === 'good'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                )}
              >
                {goalMatch}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right whitespace-nowrap pl-1 pt-0.5">
          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
            {amount}{unit}
          </span>
          {dvNum > 0 && (
            <span
              className={cn(
                'ml-1.5 text-[10px] font-semibold',
                dvNum >= 20
                  ? type === 'bad'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                  : 'text-neutral-500 dark:text-neutral-400'
              )}
            >
              {dvNum}%
            </span>
          )}
        </div>
      </div>
      {dvNum > 0 && <DVBar value={dvNum} type={type} />}
      {label && type !== 'neutral' && (
        <p
          className={cn(
            'text-[10px] font-medium leading-tight',
            type === 'good' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
          )}
        >
          {label}
        </p>
      )}
    </div>
  )
}

export function AISummaryCard({ summary, nutritionProfile, insights }: AISummaryCardProps) {
  const { t, language } = useLanguage()
  const translatedSummary = translateContent(summary, language)
  const highlightMap = new Map((insights?.nutrientHighlights ?? []).map((h) => [h.nutrientName, h]))

  return (
    <div className="space-y-5 rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-darksurface sm:p-6">
      {/* 1. AI Executive Summary */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {t('dashboard.aiSummary')}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Full AI synthesis analyzed with your fitness goals &amp; allergy profile
              </p>
            </div>
          </div>

          {nutritionProfile?.calories != null && (
            <div className="flex items-center gap-2 rounded-xl border border-neutral-200/80 bg-neutral-50/80 px-3 py-1.5 dark:border-white/10 dark:bg-white/5">
              <span className="text-xs text-neutral-500">Serving: {nutritionProfile.servingSize}</span>
              <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                {nutritionProfile.calories} kcal
              </span>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-secondary/15 bg-gradient-to-br from-secondary-light/20 to-blue-50/20 p-4 dark:from-secondary/10 dark:to-blue-950/10 dark:border-secondary/20">
          <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">{translatedSummary}</p>
        </div>
      </div>

      {/* 2. Personal Fitness & Allergy Analysis */}
      {insights && (
        <div className="space-y-3 border-t border-neutral-100 pt-4 dark:border-white/5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Personal Fitness &amp; Allergy Evaluation
            </h3>
            {insights.hasPersonalization && (
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                ✓ Personalized to your profile
              </span>
            )}
          </div>

          {insights.personalWarnings.length > 0 ? (
            <div className="space-y-2.5">
              {insights.personalWarnings.map((w, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-3.5 text-sm transition-all',
                    w.type === 'allergy' && w.severity === 'high'
                      ? 'border-red-300 bg-red-50 dark:border-red-800/50 dark:bg-red-950/30'
                      : w.type === 'allergy' && w.severity === 'medium'
                      ? 'border-amber-300 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30'
                      : w.type === 'allergy'
                      ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/20'
                      : w.type === 'fitness-conflict'
                      ? 'border-orange-200 bg-orange-50 dark:border-orange-800/40 dark:bg-orange-950/20'
                      : 'border-primary/20 bg-primary-light/20 dark:border-primary-dark/30 dark:bg-primary-dark/10'
                  )}
                >
                  <span className="text-xl leading-none">{w.emoji}</span>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        'text-xs font-bold',
                        w.type === 'allergy' && w.severity === 'high'
                          ? 'text-red-800 dark:text-red-300'
                          : w.type === 'allergy' && w.severity === 'medium'
                          ? 'text-amber-800 dark:text-amber-300'
                          : w.type === 'allergy'
                          ? 'text-emerald-800 dark:text-emerald-300'
                          : w.type === 'fitness-conflict'
                          ? 'text-orange-800 dark:text-orange-300'
                          : 'text-primary-dark dark:text-primary-light'
                      )}
                    >
                      {w.title}
                    </p>
                    <p className="text-[12px] text-neutral-600 dark:text-neutral-300 mt-0.5 leading-relaxed">
                      {w.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-200 p-3.5 text-xs text-neutral-500 dark:border-white/10 dark:text-neutral-400">
              Set up your fitness goals and food allergies in your Account settings to view custom nutritional warnings and allergen cross-checks.
            </div>
          )}

          {/* Profile Active Context Tags */}
          {insights.hasPersonalization && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {insights.activeGoals.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Dumbbell className="h-3.5 w-3.5 text-primary shrink-0" />
                  {insights.activeGoals.map((g) => (
                    <span
                      key={g}
                      className="rounded-md bg-primary-light/50 px-2 py-0.5 text-[10px] font-bold text-primary-dark dark:bg-primary-dark/30 dark:text-primary-light"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
              {insights.userAllergens.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  {insights.userAllergens.map((a) => (
                    <span
                      key={a}
                      className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Product Nutrition, Vitamins & Minerals (Altogether) */}
      {nutritionProfile && (
        <div className="space-y-4 border-t border-neutral-100 pt-5 dark:border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Nutritional, Vitamin &amp; Mineral Composition
              </h3>
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
              Evaluated against daily reference values (DV%)
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Column 1: Nutrition & Macros */}
            <div className="space-y-2 rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3.5 dark:border-white/5 dark:bg-white/[0.015]">
              <div className="flex items-center gap-1.5 border-b border-neutral-200/60 pb-2 dark:border-white/5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Nutrition &amp; Macros</h4>
                <span className="ml-auto rounded-full bg-neutral-200/60 px-1.5 py-0.2 text-[10px] font-semibold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                  {nutritionProfile.macros?.length ?? 0}
                </span>
              </div>
              <div className="space-y-1.5">
                {(nutritionProfile.macros ?? []).map((n) => {
                  const hl = highlightMap.get(n.name)
                  return (
                    <NutrientItem
                      key={n.name}
                      name={n.name}
                      amount={n.amount}
                      unit={n.unit}
                      dailyValue={n.dailyValue}
                      label={hl?.label}
                      type={hl ? hl.type : 'neutral'}
                      goalMatch={hl?.goalMatch}
                    />
                  )
                })}
              </div>
            </div>

            {/* Column 2: Vitamins */}
            <div className="space-y-2 rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3.5 dark:border-white/5 dark:bg-white/[0.015]">
              <div className="flex items-center gap-1.5 border-b border-neutral-200/60 pb-2 dark:border-white/5">
                <Pill className="h-3.5 w-3.5 text-violet-500" />
                <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Vitamins</h4>
                <span className="ml-auto rounded-full bg-neutral-200/60 px-1.5 py-0.2 text-[10px] font-semibold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                  {nutritionProfile.vitamins?.length ?? 0}
                </span>
              </div>
              <div className="space-y-1.5">
                {(nutritionProfile.vitamins ?? []).map((n) => {
                  const hl = highlightMap.get(n.name)
                  return (
                    <NutrientItem
                      key={n.name}
                      name={n.name}
                      amount={n.amount}
                      unit={n.unit}
                      dailyValue={n.dailyValue}
                      label={hl?.label}
                      type={hl ? hl.type : 'neutral'}
                      goalMatch={hl?.goalMatch}
                    />
                  )
                })}
              </div>
            </div>

            {/* Column 3: Minerals */}
            <div className="space-y-2 rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3.5 dark:border-white/5 dark:bg-white/[0.015]">
              <div className="flex items-center gap-1.5 border-b border-neutral-200/60 pb-2 dark:border-white/5">
                <Mountain className="h-3.5 w-3.5 text-blue-500" />
                <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Minerals</h4>
                <span className="ml-auto rounded-full bg-neutral-200/60 px-1.5 py-0.2 text-[10px] font-semibold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                  {nutritionProfile.minerals?.length ?? 0}
                </span>
              </div>
              <div className="space-y-1.5">
                {(nutritionProfile.minerals ?? []).map((n) => {
                  const hl = highlightMap.get(n.name)
                  return (
                    <NutrientItem
                      key={n.name}
                      name={n.name}
                      amount={n.amount}
                      unit={n.unit}
                      dailyValue={n.dailyValue}
                      label={hl?.label}
                      type={hl ? hl.type : 'neutral'}
                      goalMatch={hl?.goalMatch}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-[11px] text-neutral-500 dark:bg-white/[0.02] dark:text-neutral-400">
            <span>
              * Percent Daily Values (% DV) based on standard 2,000 calorie diet.
            </span>
            <span>
              <strong className="text-emerald-600 dark:text-emerald-400">Green tags</strong> indicate fitness synergy · <strong className="text-red-600 dark:text-red-400">Red tags</strong> indicate fitness conflicts.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
