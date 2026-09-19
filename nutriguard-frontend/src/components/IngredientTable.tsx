import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { riskDotClass, RiskBadge } from './RiskBadge'
import { Ingredient } from '@/data/types'
import { useLanguage } from '@/context/LanguageContext'
import { translateContent } from '@/lib/translator'

export function IngredientTable({ ingredients }: { ingredients: Ingredient[] }) {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  return (
    <table className="w-full text-left text-sm">
      <caption className="sr-only">{t('table.caption')}</caption>
      <thead>
        <tr className="border-b border-neutral-100 text-xs text-neutral-600 dark:border-white/5 dark:text-neutral-400">
          <th scope="col" className="pb-3 font-medium">{t('table.ingredient')}</th>
          <th scope="col" className="pb-3 font-medium">{t('table.reason')}</th>
          <th scope="col" className="pb-3 font-medium">{t('table.risk')}</th>
          <th scope="col" className="pb-3" />
        </tr>
      </thead>
      <tbody>
        {ingredients.map((ing) => {
          const translatedName = translateContent(ing.name, language)
          const translatedReason = translateContent(ing.reason, language)

          return (
            <tr
              key={ing.id}
              tabIndex={0}
              onClick={() => navigate(`/app/ingredient/${ing.id}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/app/ingredient/${ing.id}`)}
              className="cursor-pointer border-b border-neutral-100 last:border-0 hover:bg-neutral-50 dark:border-white/5 dark:hover:bg-white/5 transition-colors"
            >
              <td className="py-3 pl-3">
                <span className="flex items-center gap-2 font-medium text-neutral-900 dark:text-neutral-100">
                  <span className={`h-2 w-2 rounded-full ${riskDotClass(ing.risk)}`} />
                  {translatedName}
                </span>
              </td>
              <td className="max-w-xs py-3 text-neutral-600 dark:text-neutral-400">{translatedReason}</td>
              <td className="py-3">
                <RiskBadge risk={ing.risk} size="sm" />
              </td>
              <td className="py-3 pr-3 text-right">
                <ChevronRight className="ml-auto h-4 w-4 text-neutral-300 dark:text-neutral-600" aria-hidden="true" />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
