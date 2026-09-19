import { useParams, useNavigate, Link } from 'react-router-dom'
import { RefreshCw, GitCompare, MoreVertical, Globe2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { translateContent } from '@/lib/translator'
import { SafetyScoreCard } from '@/components/SafetyScoreCard'
import { AISummaryCard } from '@/components/AISummaryCard'
import { IngredientTable } from '@/components/IngredientTable'
import { RiskAnalysisChart } from '@/components/RiskAnalysisChart'
import { getAnalysisById, getLatestAnalysis } from '@/data/mock'
import { usePersonalizedInsights } from '@/hooks/usePersonalizedInsights'

export default function Dashboard() {
  const { scanId } = useParams()
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const analysis = scanId ? getAnalysisById(scanId) : getLatestAnalysis()

  if (!analysis) {
    navigate('/app/error/no-analysis')
    return null
  }

  // Personalized insights derived from user profile × product data
  const insights = usePersonalizedInsights(
    analysis.safetyScore,
    analysis.ingredients,
    analysis.nutritionProfile,
    user,
    analysis.productName
  )

  const harmfulCount = analysis.ingredients.filter((i) => i.risk === 'high' || i.risk === 'moderate').length

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{analysis.productName}</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {analysis.brand} · {t('dashboard.scanned')} {analysis.scanDate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('/app/home')}>
            <RefreshCw className="h-4 w-4" /> {t('dashboard.rescan')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate(`/app/compare?a=${analysis.id}`)}>
            <GitCompare className="h-4 w-4" /> {t('dashboard.compare')}
          </Button>
          <button aria-label={t('dashboard.moreOptions')} className="rounded-sm p-2 hover:bg-neutral-100 dark:hover:bg-white/5">
            <MoreVertical className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* AI Summary + Nutrition Profile (Macros, Vitamins, Minerals) + Personal Fitness/Allergy Analysis */}
          <AISummaryCard
            summary={analysis.aiSummary}
            nutritionProfile={analysis.nutritionProfile}
            insights={insights}
          />

          <Card>
            <h2 className="mb-4 text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('dashboard.ingredientBreakdown')}</h2>
            <IngredientTable ingredients={analysis.ingredients} />
          </Card>

          <Card>
            <h2 className="mb-4 text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('dashboard.riskAnalysis')}</h2>
            <RiskAnalysisChart ingredients={analysis.ingredients} />
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-4">
          {/* Personalized Safety Score */}
          <SafetyScoreCard score={analysis.safetyScore} verdict={analysis.verdict} insights={insights} />

          <Card>
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">
              <Globe2 className="h-4 w-4 text-secondary dark:text-blue-400" /> {t('dashboard.countryRegulation')}
            </h2>
            <ul className="flex flex-col gap-2 text-sm">
              {(analysis.ingredients[0]?.countries ?? []).map((c) => (
                <li key={c.country} className="flex items-center justify-between text-neutral-800 dark:text-neutral-200">
                  <span>{c.flag} {translateContent(c.country, language)}</span>
                  <span className={
                    c.status === 'Approved' ? 'text-primary-dark dark:text-emerald-400 font-medium' :
                    c.status === 'Restricted' ? 'text-amber-700 dark:text-amber-300 font-medium' :
                    'text-danger dark:text-red-400 font-medium'
                  }>
                    {translateContent(c.status, language)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Safer Alternatives — evaluated with personal note for allergen/fitness match */}
          <Card>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-1">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('dashboard.saferAlternatives')}</h2>
              {analysis.safetyScore < 95 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  Score &lt; 95 · Healthier Alternatives
                </span>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {insights.evaluatedAlternatives.map((alt) => (
                <div key={alt.id} className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 dark:border-white/10 dark:bg-white/[0.02]">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{translateContent(alt.name, language)}</p>
                    <span className="text-xs font-bold text-primary-dark dark:text-emerald-400">+{alt.scoreDelta} pts</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      Target Safety Score: {alt.targetScore}/100
                    </span>
                    <span className="text-neutral-500 dark:text-neutral-400">• Identical Core Ingredients</span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1.5">{translateContent(alt.reason, language)}</p>
                  {insights.hasPersonalization && (
                    <div className="mt-2 flex flex-col gap-1 border-t border-neutral-200/50 pt-1.5 dark:border-white/5 text-[10px]">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ {alt.allergyFit}</span>
                      <span className="text-primary dark:text-primary-light font-medium">⚡ {alt.fitnessFit}</span>
                    </div>
                  )}
                </div>
              ))}
              {insights.evaluatedAlternatives.length === 0 && (
                <div className="rounded-lg border border-emerald-200/50 bg-emerald-50/40 p-3 text-center dark:border-emerald-800/30 dark:bg-emerald-950/20">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    Optimal Safety Score (95+)
                  </p>
                  <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                    This product meets top-tier safety criteria. Core ingredients & formulation require no substitution.
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('dashboard.quickStats')}</h2>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{analysis.ingredients.length}</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">{t('dashboard.ingredientsCount')}</p>
              </div>
              <div>
                <p className="text-xl font-bold text-danger dark:text-red-400">{harmfulCount}</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">{t('dashboard.flaggedCount')}</p>
              </div>
              {analysis.nutritionProfile?.calories != null && (
                <div>
                  <p className="text-xl font-bold text-violet-600 dark:text-violet-400">{analysis.nutritionProfile.calories}</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Calories / serving</p>
                </div>
              )}
              {insights.activeGoals.length > 0 && (
                <div>
                  <p className="text-xl font-bold text-primary dark:text-emerald-400">{insights.activeGoals.length}</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Fitness Goals Active</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-neutral-600 dark:text-neutral-400">
        {t('dashboard.needSecondOpinion')} <Link to="/app/history" className="text-primary hover:underline dark:text-primary-light">{t('dashboard.viewHistory')}</Link>
      </p>
    </div>
  )
}
