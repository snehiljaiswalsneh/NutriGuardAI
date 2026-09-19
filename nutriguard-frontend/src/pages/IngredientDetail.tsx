import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, ExternalLink, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { RiskBadge } from '@/components/RiskBadge'
import { getIngredientById } from '@/data/mock'
import { useLanguage } from '@/context/LanguageContext'
import { translateContent } from '@/lib/translator'

export default function IngredientDetail() {
  const { ingredientId } = useParams()
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const ingredient = getIngredientById(ingredientId || '')

  if (!ingredient) {
    navigate('/app/error/no-analysis')
    return null
  }

  const translatedName = translateContent(ingredient.name, language)
  const translatedDesc = translateContent(ingredient.description, language)
  const translatedPurpose = translateContent(ingredient.purpose, language)

  return (
    <div className="mx-auto max-w-2xl">
      <nav className="mb-4 flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400" aria-label="Breadcrumb">
        <Link to="/app/home" className="hover:text-neutral-900 dark:hover:text-white">{t('ingredient.breadcrumbHome')}</Link>
        <span>/</span>
        <span className="text-neutral-900 dark:text-neutral-100 font-medium">{translatedName}</span>
      </nav>

      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm font-medium text-primary hover:underline dark:text-primary-light">
        <ChevronLeft className="h-4 w-4" /> {t('ingredient.backToDashboard')}
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{translatedName}</h1>
          {ingredient.scientificName && <p className="text-sm text-neutral-600 dark:text-neutral-400">{ingredient.scientificName}</p>}
        </div>
        <RiskBadge risk={ingredient.risk} />
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <h2 className="mb-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('ingredient.description')}</h2>
          <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">{translatedDesc}</p>
        </Card>

        <Card>
          <h2 className="mb-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('ingredient.purpose')}</h2>
          <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">{translatedPurpose}</p>
        </Card>

        <Card>
          <h2 className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('ingredient.healthEffects')}</h2>
          <ul className="flex flex-col gap-3">
            {(ingredient.healthEffects ?? []).map((effect, i) => (
              <li key={i} className="flex gap-3 text-sm text-neutral-800 dark:text-neutral-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <span>{translateContent(effect, language)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('ingredient.countryRegulations')}</h2>
          <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:overflow-visible">
            {(ingredient.countries ?? []).map((c) => (
              <div key={c.country} className="w-40 shrink-0 rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 text-center dark:border-white/10 dark:bg-white/[0.02] md:w-auto">
                <p className="text-2xl">{c.flag}</p>
                <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{translateContent(c.country, language)}</p>
                <p
                  className={`text-xs font-semibold ${
                    c.status === 'Approved' ? 'text-primary-dark dark:text-emerald-400' : c.status === 'Restricted' ? 'text-amber-700 dark:text-amber-300' : 'text-danger dark:text-red-400'
                  }`}
                >
                  {translateContent(c.status, language)}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {(ingredient.alternatives?.length ?? 0) > 0 && (
          <Card>
            <h2 className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('ingredient.saferAlternatives')}</h2>
            <div className="flex flex-col gap-3">
              {(ingredient.alternatives ?? []).map((alt) => (
                <div key={alt.id} className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 dark:border-white/10 dark:bg-white/[0.02]">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{translateContent(alt.name, language)}</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">{translateContent(alt.reason, language)}</p>
                  <p className="mt-1 text-xs font-semibold text-primary-dark dark:text-emerald-400">+{alt.scoreDelta} {t('common.safetyPoints')}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <h2 className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('ingredient.researchSources')}</h2>
          <ul className="flex flex-col gap-2">
            {(ingredient.sources ?? []).map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${s.label}, opens in new tab`}
                  className="flex items-center gap-1.5 text-sm text-secondary hover:underline dark:text-blue-400"
                >
                  {s.label} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
