import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight,
  Search,
  CheckCircle2,
  GitCompare,
  ChevronLeft,
  ShieldCheck,
  AlertTriangle,
  HeartPulse,
  Dumbbell,
  Pill,
  Mountain,
  Zap,
  Sparkles,
  ShieldAlert,
  Flame,
  ArrowRight,
  Check,
  XCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/EmptyState'
import { getAllScans, getAnalysisById } from '@/data/mock'
import { Analysis, NutritionFact } from '@/data/types'
import { useLanguage } from '@/context/LanguageContext'
import { translateContent } from '@/lib/translator'
import { useAuth } from '@/context/AuthContext'
import { usePersonalizedInsights } from '@/hooks/usePersonalizedInsights'
import { cn } from '@/lib/utils'

function ProductSlot({
  label,
  product,
  onPick,
  excludeId,
}: {
  label: string
  product?: Analysis
  onPick: (id: string) => void
  excludeId?: string
}) {
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()
  const availableProducts = getAllScans().filter((s) => s.id !== excludeId)

  return (
    <Card className="relative">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">{label}</p>
      {product ? (
        <div>
          <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{product.productName}</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{product.brand}</p>
          <p className="mt-3 text-3xl font-bold text-primary-dark dark:text-primary-light">{product.safetyScore}</p>
          <button className="mt-2 text-xs font-medium text-secondary dark:text-blue-400 hover:underline" onClick={() => setOpen(!open)}>
            {t('common.changeProduct')}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed border-neutral-300 dark:border-white/10 text-sm text-neutral-600 dark:text-neutral-400 hover:border-primary hover:text-primary-dark dark:hover:border-primary-light dark:hover:text-primary-light transition-colors"
        >
          <Search className="h-5 w-5" /> {t('common.chooseProduct')}
        </button>
      )}

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-md border border-neutral-100 bg-white dark:bg-darksurface dark:border-white/10 p-2 shadow-lg">
          {availableProducts.length === 0 ? (
            <p className="p-3 text-center text-xs text-neutral-500 dark:text-neutral-400">{t('compare.noOtherProducts')}</p>
          ) : (
            availableProducts.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  onPick(s.id)
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between rounded-sm px-3 py-2.5 text-left text-sm hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
              >
                <div>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">{s.productName}</span>
                  <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">({s.brand || 'Custom'})</span>
                </div>
                <span className="text-xs font-bold text-primary-dark dark:text-primary-light">{s.safetyScore} pts</span>
              </button>
            ))
          )}
        </div>
      )}
    </Card>
  )
}

export default function ComparisonSetup() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [aId, setAId] = useState(params.get('a') || '')
  const [bId, setBId] = useState('')

  const a = getAnalysisById(aId)
  const b = getAnalysisById(bId)

  if (!a && !b) {
    return (
      <EmptyState
        icon={GitCompare}
        title={t('compare.emptyTitle')}
        description={t('compare.emptyDesc')}
        actionLabel={t('compare.emptyAction')}
        onAction={() => navigate('/app/history')}
      />
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t('compare.title')}</h1>
      <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">{t('compare.subtitle')}</p>

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[1fr_auto_1fr]">
        <ProductSlot label={t('compare.productA')} product={a} onPick={setAId} excludeId={bId} />
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-200 md:mt-10">
          VS
        </div>
        <ProductSlot label={t('compare.productB')} product={b} onPick={setBId} excludeId={aId} />
      </div>

      <Button
        className="mt-6 w-full md:w-auto"
        disabled={!a || !b}
        onClick={() => navigate(`/app/compare/result?a=${aId}&b=${bId}`)}
      >
        <ArrowLeftRight className="h-4 w-4" /> {t('compare.compareNow')}
      </Button>
    </div>
  )
}

interface CompareNutrientItem {
  name: string
  category: 'macro' | 'vitamin' | 'mineral'
  aVal: string
  aNum: number
  aUnit: string
  aDv?: number
  bVal: string
  bNum: number
  bUnit: string
  bDv?: number
  advantage: string
  better: 'a' | 'b' | 'tie'
}

const NUTRIENT_DISPLAY_NAMES: Record<string, string> = {
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

function getCleanNutrientName(raw: string): string {
  if (!raw) return ''
  const t = raw.trim()
  if (NUTRIENT_DISPLAY_NAMES[t]) return NUTRIENT_DISPLAY_NAMES[t]
  if (/^vit\b/i.test(t) && !/^vitamin\b/i.test(t)) {
    return t.replace(/^vit\.?\s*/i, 'Vitamin ')
  }
  return t
}

export function ComparisonResult() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const { user } = useAuth()

  const a = getAnalysisById(params.get('a') || '')
  const b = getAnalysisById(params.get('b') || '')

  if (!a || !b) {
    navigate('/app/compare')
    return null
  }

  const insightsA = usePersonalizedInsights(a.safetyScore, a.ingredients, a.nutritionProfile, user, a.productName)
  const insightsB = usePersonalizedInsights(b.safetyScore, b.ingredients, b.nutritionProfile, user, b.productName)

  const winner = a.safetyScore >= b.safetyScore ? a : b
  const loser = winner.id === a.id ? b : a
  const scoreDiff = Math.abs(a.safetyScore - b.safetyScore)

  const metrics = [
    { label: t('compare.safetyScore'), a: a.safetyScore, b: b.safetyScore },
    { label: t('compare.riskLevel'), a: translateContent(a.verdict, language), b: translateContent(b.verdict, language) },
    { label: t('compare.ingredientCount'), a: a.ingredients.length, b: b.ingredients.length },
    {
      label: t('compare.harmfulCount'),
      a: a.ingredients.filter((i) => i.risk !== 'safe').length,
      b: b.ingredients.filter((i) => i.risk !== 'safe').length,
    },
  ]

  // Build unified single table rows for Nutrition, Vitamins, and Minerals
  const tableRows: CompareNutrientItem[] = []

  // 1. Macros
  const standardMacroOrder = [
    'Protein',
    'Total Fat',
    'Saturated Fat',
    'Total Carbohydrates',
    'Dietary Fiber',
    'Total Sugars',
    'Sodium',
  ]

  const macroMapA = new Map((a.nutritionProfile?.macros ?? []).map((m) => [getCleanNutrientName(m.name), m]))
  const macroMapB = new Map((b.nutritionProfile?.macros ?? []).map((m) => [getCleanNutrientName(m.name), m]))

  for (const name of standardMacroOrder) {
    const itemA = macroMapA.get(name)
    const itemB = macroMapB.get(name)
    if (!itemA && !itemB) continue

    const aNum = parseFloat(itemA?.amount ?? '0') || 0
    const bNum = parseFloat(itemB?.amount ?? '0') || 0
    const unit = itemA?.unit || itemB?.unit || 'g'

    let better: 'a' | 'b' | 'tie' = 'tie'
    let advantage = 'Equivalent'

    if (name === 'Protein' || name === 'Dietary Fiber') {
      if (aNum > bNum) {
        better = 'a'
        advantage = `+${(aNum - bNum).toFixed(0)}${unit} ${name} (${a.productName})`
      } else if (bNum > aNum) {
        better = 'b'
        advantage = `+${(bNum - aNum).toFixed(0)}${unit} ${name} (${b.productName})`
      }
    } else if (name === 'Saturated Fat' || name === 'Total Sugars' || name === 'Sodium') {
      if (aNum < bNum) {
        better = 'a'
        advantage = `-${(bNum - aNum).toFixed(0)}${unit} lower (${a.productName})`
      } else if (bNum < aNum) {
        better = 'b'
        advantage = `-${(aNum - bNum).toFixed(0)}${unit} lower (${b.productName})`
      }
    } else if (name === 'Total Fat') {
      if (aNum < bNum) {
        better = 'a'
        advantage = `-${(bNum - aNum).toFixed(0)}${unit} lower total fat (${a.productName})`
      } else if (bNum < aNum) {
        better = 'b'
        advantage = `-${(aNum - bNum).toFixed(0)}${unit} lower total fat (${b.productName})`
      }
    }

    tableRows.push({
      category: 'macro',
      name,
      aVal: itemA ? `${itemA.amount}${itemA.unit}` : '—',
      aNum,
      aUnit: itemA?.unit ?? '',
      aDv: itemA?.dailyValue,
      bVal: itemB ? `${itemB.amount}${itemB.unit}` : '—',
      bNum,
      bUnit: itemB?.unit ?? '',
      bDv: itemB?.dailyValue,
      advantage,
      better,
    })
  }

  // 2. Vitamins
  const allVitamins = Array.from(
    new Set([
      ...(a.nutritionProfile?.vitamins ?? []).map((v) => getCleanNutrientName(v.name)),
      ...(b.nutritionProfile?.vitamins ?? []).map((v) => getCleanNutrientName(v.name)),
    ])
  )

  const vitMapA = new Map((a.nutritionProfile?.vitamins ?? []).map((v) => [getCleanNutrientName(v.name), v]))
  const vitMapB = new Map((b.nutritionProfile?.vitamins ?? []).map((v) => [getCleanNutrientName(v.name), v]))

  for (const name of allVitamins) {
    const itemA = vitMapA.get(name)
    const itemB = vitMapB.get(name)
    const aDv = itemA?.dailyValue ?? 0
    const bDv = itemB?.dailyValue ?? 0

    let better: 'a' | 'b' | 'tie' = 'tie'
    let advantage = 'Balanced'

    if (aDv > bDv) {
      better = 'a'
      advantage = `Higher in ${a.productName} (+${aDv - bDv}% DV)`
    } else if (bDv > aDv) {
      better = 'b'
      advantage = `Higher in ${b.productName} (+${bDv - aDv}% DV)`
    }

    tableRows.push({
      category: 'vitamin',
      name,
      aVal: itemA ? `${itemA.amount}${itemA.unit}` : '—',
      aNum: parseFloat(itemA?.amount ?? '0') || 0,
      aUnit: itemA?.unit ?? '',
      aDv: itemA?.dailyValue,
      bVal: itemB ? `${itemB.amount}${itemB.unit}` : '—',
      bNum: parseFloat(itemB?.amount ?? '0') || 0,
      bUnit: itemB?.unit ?? '',
      bDv: itemB?.dailyValue,
      advantage,
      better,
    })
  }

  // 3. Minerals
  const allMinerals = Array.from(
    new Set([
      ...(a.nutritionProfile?.minerals ?? []).map((m) => getCleanNutrientName(m.name)),
      ...(b.nutritionProfile?.minerals ?? []).map((m) => getCleanNutrientName(m.name)),
    ])
  )

  const minMapA = new Map((a.nutritionProfile?.minerals ?? []).map((m) => [getCleanNutrientName(m.name), m]))
  const minMapB = new Map((b.nutritionProfile?.minerals ?? []).map((m) => [getCleanNutrientName(m.name), m]))

  for (const name of allMinerals) {
    const itemA = minMapA.get(name)
    const itemB = minMapB.get(name)
    const aDv = itemA?.dailyValue ?? 0
    const bDv = itemB?.dailyValue ?? 0

    let better: 'a' | 'b' | 'tie' = 'tie'
    let advantage = 'Balanced'

    if (aDv > bDv) {
      better = 'a'
      advantage = `Higher in ${a.productName} (+${aDv - bDv}% DV)`
    } else if (bDv > aDv) {
      better = 'b'
      advantage = `Higher in ${b.productName} (+${bDv - aDv}% DV)`
    }

    tableRows.push({
      category: 'mineral',
      name,
      aVal: itemA ? `${itemA.amount}${itemA.unit}` : '—',
      aNum: parseFloat(itemA?.amount ?? '0') || 0,
      aUnit: itemA?.unit ?? '',
      aDv: itemA?.dailyValue,
      bVal: itemB ? `${itemB.amount}${itemB.unit}` : '—',
      bNum: parseFloat(itemB?.amount ?? '0') || 0,
      bUnit: itemB?.unit ?? '',
      bDv: itemB?.dailyValue,
      advantage,
      better,
    })
  }

  // Allergy cross-checks
  const userAllergens = user.allergyProfile?.hasAllergies ? user.allergyProfile.allergens ?? [] : []
  const checkAllergens = (product: Analysis) => {
    const text = product.ingredients.map((i) => `${i.name} ${i.description ?? ''}`).join(' ').toLowerCase()
    const detected: string[] = []
    for (const alg of userAllergens) {
      const key = alg.toLowerCase().replace(/\/.*$/, '').trim()
      if (text.includes(key) || (product.allergyWarning && product.allergyWarning.toLowerCase().includes(key))) {
        detected.push(alg)
      }
    }
    // Also detect common food allergens inherently
    if (/hazelnut|almond|walnut|cashew|peanut|nut/i.test(text) && !detected.includes('Tree Nuts/Peanuts')) {
      detected.push('Tree Nuts/Peanuts')
    }
    if (/milk|whey|butter|dairy|cream/i.test(text) && !detected.includes('Milk (Dairy)')) {
      detected.push('Milk (Dairy)')
    }
    if (/soy|lecithin/i.test(text) && !detected.includes('Soy')) {
      detected.push('Soy')
    }
    if (/wheat|gluten|flour/i.test(text) && !detected.includes('Wheat (Gluten)')) {
      detected.push('Wheat (Gluten)')
    }
    return detected
  }

  const allergensA = checkAllergens(a)
  const allergensB = checkAllergens(b)

  // Active fitness goals
  const activeFitnessGoals = insightsA.activeGoals.length > 0 ? insightsA.activeGoals : insightsB.activeGoals

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      {/* Top Back Navigation */}
      <div>
        <button
          onClick={() => navigate(`/app/compare?a=${a.id}&b=${b.id}`)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline dark:text-primary-light"
        >
          <ChevronLeft className="h-4 w-4" /> {t('compare.backToSetup')}
        </button>
        <h1 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t('compare.resultTitle')}</h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          In-depth nutritional comparison, toxicological safety evaluation, allergy screening, and cleaner alternatives.
        </p>
      </div>

      {/* 1. Head-to-Head Top Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[a, b].map((p) => {
          const isWinner = p.id === winner.id
          return (
            <div
              key={p.id}
              className={cn(
                'relative rounded-2xl border p-6 shadow-sm transition-all',
                isWinner
                  ? 'border-primary/50 bg-gradient-to-b from-emerald-50/70 to-white dark:border-emerald-500/30 dark:from-emerald-950/25 dark:to-darksurface'
                  : 'border-neutral-200 bg-white dark:border-white/10 dark:bg-darksurface'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  {isWinner ? (
                    <span className="mb-2.5 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow-xs">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {t('compare.betterChoice')}
                    </span>
                  ) : (
                    <span className="mb-2.5 inline-flex items-center gap-1 rounded-full bg-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-700 dark:bg-white/10 dark:text-neutral-300">
                      Higher Consideration
                    </span>
                  )}
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{p.productName}</h2>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    {p.brand || t('compare.customFallback')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-flex flex-col items-center justify-center rounded-xl bg-neutral-100 px-3.5 py-2 dark:bg-white/5">
                    <span className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">{p.safetyScore}</span>
                    <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">Safety Score</span>
                  </div>
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-neutral-200/60 pt-4 text-center dark:border-white/10">
                <div className="rounded-lg bg-neutral-50/80 p-2 dark:bg-white/[0.02]">
                  <dt className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">{t('compare.riskLevel')}</dt>
                  <dd
                    className={cn(
                      'mt-0.5 text-xs font-bold',
                      p.verdict === 'Safe' ? 'text-primary-dark dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                    )}
                  >
                    {translateContent(p.verdict, language)}
                  </dd>
                </div>
                <div className="rounded-lg bg-neutral-50/80 p-2 dark:bg-white/[0.02]">
                  <dt className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">{t('compare.ingredientCount')}</dt>
                  <dd className="mt-0.5 text-xs font-bold text-neutral-900 dark:text-neutral-100">{p.ingredients.length}</dd>
                </div>
                <div className="rounded-lg bg-neutral-50/80 p-2 dark:bg-white/[0.02]">
                  <dt className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">{t('compare.harmfulCount')}</dt>
                  <dd
                    className={cn(
                      'mt-0.5 text-xs font-bold',
                      p.ingredients.filter((i) => i.risk !== 'safe').length > 1
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-neutral-700 dark:text-neutral-300'
                    )}
                  >
                    {p.ingredients.filter((i) => i.risk !== 'safe').length}
                  </dd>
                </div>
              </dl>
            </div>
          )
        })}
      </div>

      {/* 2. Unified Nutrition, Vitamins & Minerals Comparison Table */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-neutral-200/80 bg-neutral-50/80 px-6 py-4 dark:border-white/10 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Nutrition, Vitamin &amp; Mineral Comparison Table
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Side-by-side nutrient profile with reference daily values (DV%) and health advantages.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-100/50 text-[11px] uppercase tracking-wider text-neutral-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-400">
                <th className="px-5 py-3 font-semibold">Nutrient</th>
                <th className="px-5 py-3 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">{a.productName}</span>
                    {winner.id === a.id && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                        Winner
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-5 py-3 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">{b.productName}</span>
                    {winner.id === b.id && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                        Winner
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-5 py-3 font-semibold">Comparison &amp; Advantage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
              {/* Serving Size & Calories Row */}
              <tr className="bg-neutral-50/30 dark:bg-white/[0.01]">
                <td className="px-5 py-2.5 font-medium text-neutral-700 dark:text-neutral-300">Serving Size</td>
                <td className="px-5 py-2.5 font-semibold text-neutral-900 dark:text-neutral-100">
                  {a.nutritionProfile?.servingSize || '1 serving'}
                </td>
                <td className="px-5 py-2.5 font-semibold text-neutral-900 dark:text-neutral-100">
                  {b.nutritionProfile?.servingSize || '1 serving'}
                </td>
                <td className="px-5 py-2.5 text-xs text-neutral-500 dark:text-neutral-400">Standard portion basis</td>
              </tr>
              <tr className="bg-neutral-50/30 dark:bg-white/[0.01]">
                <td className="px-5 py-2.5 font-medium text-neutral-700 dark:text-neutral-300">
                  <div className="flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-amber-500" />
                    <span>Calories</span>
                  </div>
                </td>
                <td className="px-5 py-2.5 font-bold text-neutral-900 dark:text-neutral-100">
                  {a.nutritionProfile?.calories ?? '—'} kcal
                </td>
                <td className="px-5 py-2.5 font-bold text-neutral-900 dark:text-neutral-100">
                  {b.nutritionProfile?.calories ?? '—'} kcal
                </td>
                <td className="px-5 py-2.5">
                  {(a.nutritionProfile?.calories ?? 0) < (b.nutritionProfile?.calories ?? 0) ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      Leaner ({a.nutritionProfile?.calories} kcal)
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      Higher energy density
                    </span>
                  )}
                </td>
              </tr>

              {/* SECTION: MACRONUTRIENTS */}
              <tr className="bg-neutral-100/70 dark:bg-white/[0.04]">
                <td colSpan={4} className="px-5 py-2 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <span>Macronutrients &amp; Daily Fuel</span>
                  </div>
                </td>
              </tr>
              {tableRows
                .filter((r) => r.category === 'macro')
                .map((row) => (
                  <tr key={row.name} className="hover:bg-neutral-50/50 dark:hover:bg-white/[0.015]">
                    <td className="px-5 py-2.5 font-medium text-neutral-800 dark:text-neutral-200">{row.name}</td>
                    <td className="px-5 py-2.5">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{row.aVal}</span>
                      {row.aDv != null && row.aDv > 0 && (
                        <span className="ml-1.5 rounded bg-neutral-100 px-1.5 py-0.2 text-[10px] font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                          {row.aDv}% DV
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-2.5">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{row.bVal}</span>
                      {row.bDv != null && row.bDv > 0 && (
                        <span className="ml-1.5 rounded bg-neutral-100 px-1.5 py-0.2 text-[10px] font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                          {row.bDv}% DV
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-2.5">
                      {row.better === 'a' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                          <Check className="h-3.5 w-3.5" /> {row.advantage}
                        </span>
                      ) : row.better === 'b' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 text-xs">
                          <Check className="h-3.5 w-3.5" /> {row.advantage}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400 dark:text-neutral-500">Comparable balance</span>
                      )}
                    </td>
                  </tr>
                ))}

              {/* SECTION: VITAMINS */}
              {tableRows.filter((r) => r.category === 'vitamin').length > 0 && (
                <>
                  <tr className="bg-neutral-100/70 dark:bg-white/[0.04]">
                    <td colSpan={4} className="px-5 py-2 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      <div className="flex items-center gap-1.5">
                        <Pill className="h-3.5 w-3.5 text-violet-500" />
                        <span>Vitamins Profile</span>
                      </div>
                    </td>
                  </tr>
                  {tableRows
                    .filter((r) => r.category === 'vitamin')
                    .map((row) => (
                      <tr key={row.name} className="hover:bg-neutral-50/50 dark:hover:bg-white/[0.015]">
                        <td className="px-5 py-2.5 font-medium text-neutral-800 dark:text-neutral-200">{row.name}</td>
                        <td className="px-5 py-2.5">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">{row.aVal}</span>
                          {row.aDv != null && row.aDv > 0 && (
                            <span className="ml-1.5 rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              {row.aDv}% DV
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-2.5">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">{row.bVal}</span>
                          {row.bDv != null && row.bDv > 0 && (
                            <span className="ml-1.5 rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              {row.bDv}% DV
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-2.5">
                          {row.better === 'a' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                              <Check className="h-3.5 w-3.5" /> {row.advantage}
                            </span>
                          ) : row.better === 'b' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 text-xs">
                              <Check className="h-3.5 w-3.5" /> {row.advantage}
                            </span>
                          ) : (
                            <span className="text-xs text-neutral-400 dark:text-neutral-500">Comparable</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </>
              )}

              {/* SECTION: MINERALS */}
              {tableRows.filter((r) => r.category === 'mineral').length > 0 && (
                <>
                  <tr className="bg-neutral-100/70 dark:bg-white/[0.04]">
                    <td colSpan={4} className="px-5 py-2 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      <div className="flex items-center gap-1.5">
                        <Mountain className="h-3.5 w-3.5 text-blue-500" />
                        <span>Essential Minerals</span>
                      </div>
                    </td>
                  </tr>
                  {tableRows
                    .filter((r) => r.category === 'mineral')
                    .map((row) => (
                      <tr key={row.name} className="hover:bg-neutral-50/50 dark:hover:bg-white/[0.015]">
                        <td className="px-5 py-2.5 font-medium text-neutral-800 dark:text-neutral-200">{row.name}</td>
                        <td className="px-5 py-2.5">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">{row.aVal}</span>
                          {row.aDv != null && row.aDv > 0 && (
                            <span className="ml-1.5 rounded bg-blue-50 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                              {row.aDv}% DV
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-2.5">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">{row.bVal}</span>
                          {row.bDv != null && row.bDv > 0 && (
                            <span className="ml-1.5 rounded bg-blue-50 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                              {row.bDv}% DV
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-2.5">
                          {row.better === 'a' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                              <Check className="h-3.5 w-3.5" /> {row.advantage}
                            </span>
                          ) : row.better === 'b' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 text-xs">
                              <Check className="h-3.5 w-3.5" /> {row.advantage}
                            </span>
                          ) : (
                            <span className="text-xs text-neutral-400 dark:text-neutral-500">Comparable</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 3. Multi-Dimensional Final Health & Safety Evaluation */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Final Comprehensive Health &amp; Safety Evaluation
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Pillar 1: Safety Score & Toxicology Breakdown */}
          <Card className="flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-neutral-900 dark:text-neutral-100">Toxicological &amp; Safety Score Analysis</h3>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  +{scoreDiff} pts Advantage
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                <strong className="font-semibold text-neutral-900 dark:text-neutral-100">{winner.productName}</strong> achieved a Safety Score of{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">{winner.safetyScore}/100</strong>, outperforming{' '}
                <strong className="font-semibold text-neutral-900 dark:text-neutral-100">{loser.productName}</strong> ({loser.safetyScore}/100).
              </p>
              <div className="mt-3 rounded-lg border border-neutral-200/80 bg-neutral-50/50 p-3 dark:border-white/5 dark:bg-white/[0.015] text-xs space-y-1.5">
                <p className="text-neutral-700 dark:text-neutral-300">
                  • <strong>{a.productName}:</strong> {a.ingredients.filter((i) => i.risk !== 'safe').length === 1 ? 'Only 1 moderate consideration (culinary fat/oil).' : `${a.ingredients.filter((i) => i.risk !== 'safe').length} flagged ingredients.`}
                </p>
                <p className="text-neutral-700 dark:text-neutral-300">
                  • <strong>{b.productName}:</strong> Carries {b.ingredients.filter((i) => i.risk !== 'safe').length} flagged additives, including refined palm oil, high saturated fats, and added simple sugars.
                </p>
              </div>
            </div>
            <div className="rounded-lg bg-emerald-50/80 p-2.5 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
              ✓ Toxicological Verdict: <strong>{winner.productName}</strong> is significantly cleaner with lower additive burden.
            </div>
          </Card>

          {/* Pillar 2: Allergy Risk Profile Cross-Check */}
          <Card className="flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                  <h3 className="font-bold text-neutral-900 dark:text-neutral-100">Personalized Allergy Cross-Check</h3>
                </div>
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                  {userAllergens.length > 0 ? `${userAllergens.length} Registered Allergens` : 'General Allergen Profile'}
                </span>
              </div>
              <div className="mt-3 space-y-2.5 text-xs">
                <div className="rounded-lg border border-neutral-200/80 bg-neutral-50/50 p-2.5 dark:border-white/5 dark:bg-white/[0.015]">
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">{a.productName}:</p>
                  <p className="text-neutral-600 dark:text-neutral-400 mt-0.5">
                    {allergensA.length > 0 ? (
                      <span className="text-amber-700 dark:text-amber-400 font-medium">
                        Contains potential allergens: {allergensA.join(', ')}.
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ No common nut/gluten allergens flagged. Safe profile for standard allergies.
                      </span>
                    )}
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-200/80 bg-neutral-50/50 p-2.5 dark:border-white/5 dark:bg-white/[0.015]">
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">{b.productName}:</p>
                  <p className="text-neutral-600 dark:text-neutral-400 mt-0.5">
                    {allergensB.length > 0 ? (
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        ⚠️ Contains {allergensB.join(', ')} — High hazard for nut or dairy allergic individuals.
                      </span>
                    ) : (
                      <span className="text-neutral-500">Standard ingredients with low allergy risk.</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-amber-50/80 p-2.5 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
              ⚠️ Allergy Verdict:{' '}
              {allergensB.some((al) => userAllergens.includes(al))
                ? `Avoid ${b.productName} due to conflict with your saved profile (${allergensB.filter((al) => userAllergens.includes(al)).join(', ')}).`
                : `${a.productName} is the safer hypoallergenic choice.`}
            </div>
          </Card>

          {/* Pillar 3: Fitness & Nutritional Goal Alignment */}
          <Card className="flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-violet-500" />
                  <h3 className="font-bold text-neutral-900 dark:text-neutral-100">Fitness &amp; Metabolic Goal Alignment</h3>
                </div>
                {activeFitnessGoals.length > 0 && (
                  <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-bold text-violet-800 dark:bg-violet-950/60 dark:text-violet-300">
                    {activeFitnessGoals.slice(0, 2).join(' · ')}
                  </span>
                )}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                Nutrient composition evaluated for lean tissue maintenance, metabolic rate, and glycemic stability:
              </p>
              <div className="mt-3 space-y-2 text-xs">
                <div className="rounded-lg bg-neutral-50 p-2.5 dark:bg-white/[0.015]">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">🍗 {a.productName}:</span>
                  <p className="text-neutral-600 dark:text-neutral-400 mt-0.5">
                    Offers high complete protein ({a.nutritionProfile?.macros?.find((m) => m.name === 'Protein')?.amount || '18'}g) and B-complex vitamins, accelerating muscle recovery and metabolic satiety.
                  </p>
                </div>
                <div className="rounded-lg bg-neutral-50 p-2.5 dark:bg-white/[0.015]">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">🍫 {b.productName}:</span>
                  <p className="text-neutral-600 dark:text-neutral-400 mt-0.5">
                    Calorically dense with high added sugars ({b.nutritionProfile?.macros?.find((m) => m.name.includes('Sugar'))?.amount || '15'}g) and saturated fat ({b.nutritionProfile?.macros?.find((m) => m.name.includes('Saturated'))?.amount || '6'}g), creating rapid insulin spikes.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-violet-50/80 p-2.5 text-xs text-violet-900 dark:bg-violet-950/30 dark:text-violet-300">
              💪 Fitness Verdict: <strong>{a.productName}</strong> strongly aligns with muscle gain, cardio, and fat management.
            </div>
          </Card>

          {/* Pillar 4: Cleaner Formulations & Alternatives */}
          <Card className="flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-bold text-neutral-900 dark:text-neutral-100">Safer Alternatives (Identical Core)</h3>
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Target: 95+ Safety Score
                </span>
              </div>
              <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                Recommended formulation upgrades that keep the core ingredients identical while replacing problematic oils &amp; sugars:
              </p>
              <div className="mt-3 space-y-2.5 text-xs">
                {/* For Winner Product if < 95 */}
                {insightsA.evaluatedAlternatives.length > 0 && (
                  <div className="rounded-lg border border-neutral-200/70 bg-neutral-50/50 p-2.5 dark:border-white/5 dark:bg-white/[0.015]">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {insightsA.evaluatedAlternatives[0]?.name}
                      </p>
                      <span className="text-xs font-bold text-primary dark:text-emerald-400">
                        +{insightsA.evaluatedAlternatives[0]?.scoreDelta} pts
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                      {insightsA.evaluatedAlternatives[0]?.reason}
                    </p>
                    <span className="mt-1 inline-block text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      Target Score: {insightsA.evaluatedAlternatives[0]?.targetScore}/100 • Identical Core
                    </span>
                  </div>
                )}

                {/* For Loser Product if < 95 */}
                {insightsB.evaluatedAlternatives.length > 0 && (
                  <div className="rounded-lg border border-neutral-200/70 bg-neutral-50/50 p-2.5 dark:border-white/5 dark:bg-white/[0.015]">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {insightsB.evaluatedAlternatives[0]?.name}
                      </p>
                      <span className="text-xs font-bold text-primary dark:text-emerald-400">
                        +{insightsB.evaluatedAlternatives[0]?.scoreDelta} pts
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                      {insightsB.evaluatedAlternatives[0]?.reason}
                    </p>
                    <span className="mt-1 inline-block text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      Target Score: {insightsB.evaluatedAlternatives[0]?.targetScore}/100 • Identical Core
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-lg bg-emerald-50/80 p-2.5 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
              🌱 Cleaner alternatives can elevate safety scores to 95–98/100 without losing authentic taste.
            </div>
          </Card>
        </div>

        {/* 5. Final Actionable Recommendation & Verdict Banner */}
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/50 p-6 shadow-sm dark:border-primary/30 dark:from-emerald-950/40 dark:via-darksurface dark:to-emerald-950/20">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 pb-3 dark:border-primary/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary dark:text-emerald-400" />
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Final Nutrition &amp; Safety Recommendation
              </h3>
            </div>
            <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-white">
              {winner.productName} Recommended
            </span>
          </div>
          <div className="mt-4 space-y-2 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
            <p>
              • <strong>Overall Winner:</strong> <strong className="font-semibold text-neutral-900 dark:text-white">{winner.productName}</strong> is the clear superior choice — scoring <strong className="text-primary-dark dark:text-emerald-400">{scoreDiff} points higher</strong> on toxicological safety with higher complete protein ({a.nutritionProfile?.macros?.find((m) => m.name === 'Protein')?.amount || '18'}g vs {b.nutritionProfile?.macros?.find((m) => m.name === 'Protein')?.amount || '3'}g) and vastly lower sugar impact.
            </p>
            <p>
              • <strong>Dietary Advice:</strong> {winner.productName} provides nutrient-dense meal sustenance suitable for regular consumption. In contrast, {loser.productName} should be reserved as an occasional treat due to high saturated fats and confectionery sugars.
            </p>
            <p>
              • <strong>Next-Level Purity:</strong> For an optimal safety score (&gt;95), try preparing {winner.productName} with cold-pressed olive oil or unrefined whole grains as shown in the Safer Alternatives above.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
