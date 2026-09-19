import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { mockAnalysis, saveAnalysis } from '@/data/mock'
import { analysisApi } from '@/api/analysis'
import { useLanguage } from '@/context/LanguageContext'
import type { Analysis, Ingredient } from '@/data/types'

function generateLocalAnalysis(productName: string, ingredientText: string): Analysis {
  const rawItems = ingredientText
    .split(/[,;\n]/)
    .map((s) => s.replace(/^and\s+/i, '').trim())
    .filter(Boolean)

  const allergens: string[] = []
  let flaggedCount = 0

  const ingredients: Ingredient[] = rawItems.map((item, idx) => {
    const lower = item.toLowerCase()
    let risk: 'safe' | 'moderate' | 'high' = 'safe'
    let reason = 'Wholesome culinary ingredient with good safety profile'
    let purpose = 'Provides texture, moisture, and structure'

    if (/sugar|syrup|fructose|dextrose/i.test(lower)) {
      risk = 'moderate'
      reason = 'High glycemic impact and added sugar content'
      purpose = 'Sweetening and tenderizing'
      flaggedCount++
    } else if (/oil|shortening|lard/i.test(lower)) {
      risk = 'moderate'
      reason = 'Calorie-dense refined fat source'
      purpose = 'Moisture and tenderness'
      flaggedCount++
    } else if (/nitrite|nitrate|benzoate|bha|bht|aspartame/i.test(lower)) {
      risk = 'high'
      reason = 'Synthetic additive flagged for health concerns'
      purpose = 'Preservative'
      flaggedCount += 2
    } else if (/color|dye|red\s*40|yellow\s*5|tartrazine/i.test(lower)) {
      risk = 'moderate'
      reason = 'Synthetic food coloring restricted in some regions'
      purpose = 'Visual coloring'
      flaggedCount++
    }

    if (/wheat|flour|gluten/i.test(lower) && !allergens.includes('Wheat (Gluten)')) allergens.push('Wheat (Gluten)')
    if (/milk|dairy|butter|cream|whey/i.test(lower) && !allergens.includes('Milk (Dairy)')) allergens.push('Milk (Dairy)')
    if (/egg/i.test(lower) && !allergens.includes('Eggs')) allergens.push('Eggs')
    if (/soy/i.test(lower) && !allergens.includes('Soy')) allergens.push('Soy')
    if (/nut|peanut|almond|walnut/i.test(lower) && !allergens.includes('Tree Nuts/Peanuts')) allergens.push('Tree Nuts/Peanuts')

    return {
      id: `ing-${idx}-${item.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: item.charAt(0).toUpperCase() + item.slice(1),
      scientificName: null,
      risk,
      reason,
      purpose,
      description: `${item} used in the preparation of ${productName}.`,
      healthEffects: [reason],
      countries: [
        { country: 'United States', flag: '🇺🇸', status: 'Approved' },
        { country: 'European Union', flag: '🇪🇺', status: risk === 'high' ? 'Restricted' : 'Approved' },
        { country: 'India', flag: '🇮🇳', status: 'Approved' },
      ],
      alternatives: [],
    }
  })

  const score = Math.max(45, 95 - flaggedCount * 8)
  const verdict = score >= 80 ? 'Safe' : score >= 60 ? 'Moderate Risk' : 'High Risk'

  // If safety score < 95, suggest at least 1 and maximum 3 alternatives with identical core ingredients & higher safety score
  if (score < 95 && ingredients.length > 0) {
    const coreIngs = ingredients
      .filter((i) => !/preservative|color|dye|nitrite|flavor|oil|syrup|shortening|additive/i.test(`${i.name} ${i.purpose ?? ''} ${i.reason ?? ''}`))
      .map((i) => i.name)
    const coreDesc = coreIngs.length > 0 ? coreIngs.slice(0, 3).join(' & ') : productName

    ingredients[0].alternatives = [
      {
        id: `alt-local-1-${Date.now()}`,
        name: `Cold-Pressed Olive Oil & Herb ${productName}`,
        scoreDelta: Math.min(12, Math.max(7, 96 - score)),
        reason: `Retains 100% identical core ingredients (${coreDesc}), replacing refined frying fats with cold-pressed olive oil & whole spices.`,
      },
      {
        id: `alt-local-2-${Date.now()}`,
        name: `Low-Sodium Himalayan Pink Salt ${productName}`,
        scoreDelta: Math.min(15, Math.max(9, 97 - score)),
        reason: `Preserves identical core (${coreDesc}) while swapping processed commercial salt with unrefined mineral salt.`,
      },
      {
        id: `alt-local-3-${Date.now()}`,
        name: `Probiotic-Marinated Slow-Dum Clean ${productName}`,
        scoreDelta: Math.min(18, Math.max(11, 98 - score)),
        reason: `Uses identical ${coreDesc} marinated in organic probiotic yogurt with zero chemical tenderizers or artificial colors.`,
      },
    ]
  }

  return {
    id: `scan-${Date.now()}`,
    productName,
    brand: 'Custom / Homemade',
    scanDate: new Date().toISOString().split('T')[0] ?? '2026-09-11',
    safetyScore: score,
    verdict,
    aiSummary: `${productName} contains ${ingredients.length} analyzed ingredients. ${
      flaggedCount > 0
        ? `${flaggedCount} ingredient(s) carry moderate nutritional considerations.`
        : 'Overall, the ingredients demonstrate a wholesome nutritional profile.'
    }`,
    allergyWarning: allergens.length > 0 ? `Contains ${allergens.join(', ')}.` : null,
    ingredients,
  }
}

export default function AnalyzingLoading() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()
  const { productName = 'Custom Product', ingredientText = '' } = (location.state as any) || {}
  const stages = [t('analyzing.stage1'), t('analyzing.stage2'), t('analyzing.stage3')]

  const [stageIndex, setStageIndex] = useState(0)
  const [progress, setProgress] = useState(15)
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 8, 92))
    }, 400)

    const stageTimer = setInterval(() => {
      setStageIndex((s) => Math.min(s + 1, stages.length - 1))
    }, 1200)

    if (!hasTriggeredRef.current) {
      hasTriggeredRef.current = true

      if (!ingredientText) {
        const timer = setTimeout(() => {
          navigate(`/app/dashboard/${mockAnalysis.id}`)
        }, 2000)
        return () => {
          clearInterval(progressTimer)
          clearInterval(stageTimer)
          clearTimeout(timer)
        }
      }

      analysisApi
        .analyzeLive({
          product_name: productName,
          ingredient_text: ingredientText,
        })
        .then((result) => {
          setProgress(100)
          setStageIndex(stages.length - 1)
          saveAnalysis(result)
          setTimeout(() => {
            navigate(`/app/dashboard/${result.id}`)
          }, 600)
        })
        .catch((err) => {
          console.warn('Live API analysis failed, using local fallback:', err)
          const fallback = generateLocalAnalysis(productName, ingredientText)
          saveAnalysis(fallback)
          setProgress(100)
          setStageIndex(stages.length - 1)
          setTimeout(() => {
            navigate(`/app/dashboard/${fallback.id}`)
          }, 600)
        })
    }

    return () => {
      clearInterval(progressTimer)
      clearInterval(stageTimer)
    }
  }, [navigate, productName, ingredientText])

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-xl border border-neutral-100 bg-white p-8 text-center shadow-lg dark:border-white/10 dark:bg-darksurface">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-light to-secondary-light dark:from-emerald-950/60 dark:to-blue-950/60">
          <Sparkles className="h-7 w-7 animate-pulseGlow text-primary-dark dark:text-emerald-400" aria-hidden="true" />
        </div>
        <h1 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('analyzing.prefix')} {productName}</h1>
        <ul className="mb-5 flex flex-col gap-2 text-left" aria-live="polite">
          {stages.map((stage, i) => (
            <li key={stage} className="flex items-center gap-2 text-sm">
              {i < stageIndex ? (
                <Check className="h-4 w-4 shrink-0 text-primary dark:text-emerald-400" />
              ) : i === stageIndex ? (
                <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent dark:border-emerald-400" />
              ) : (
                <span className="h-4 w-4 shrink-0 rounded-full border-2 border-neutral-300 dark:border-white/20" />
              )}
              <span className={i <= stageIndex ? 'font-medium text-neutral-900 dark:text-neutral-100' : 'text-neutral-400 dark:text-neutral-500'}>{stage}</span>
            </li>
          ))}
        </ul>
        <div
          className="mb-6 h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/home')}>
          {t('analyzing.cancel')}
        </Button>
      </div>
    </div>
  )
}
