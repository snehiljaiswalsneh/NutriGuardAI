import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid, List, Search, Trash2, GitCompare, History as HistoryIcon, RotateCcw } from 'lucide-react'
import { riskDotClass } from '@/components/RiskBadge'
import { EmptyState } from '@/components/EmptyState'
import { getAllScans, deleteScan, clearAllScans, mergeScans } from '@/data/mock'
import { analysisApi } from '@/api/analysis'
import { Analysis } from '@/data/types'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

function riskFromScore(score: number) {
  if (score >= 80) return 'safe'
  if (score >= 55) return 'moderate'
  return 'high'
}

export default function History() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [query, setQuery] = useState('')
  const [scans, setScans] = useState<Analysis[]>(() => getAllScans())
  const [deletedToast, setDeletedToast] = useState<string | null>(null)

  useEffect(() => {
    // Sync with persistent backend store on mount
    analysisApi
      .getLiveHistory()
      .then((res: any) => {
        const list = res?.data || res
        if (Array.isArray(list) && list.length > 0) {
          mergeScans(list)
          setScans(getAllScans())
        }
      })
      .catch(() => {
        // backend offline or mock mode, localStorage is primary
      })
  }, [])

  function handleDelete(id: string, name: string) {
    deleteScan(id)
    analysisApi.deleteLiveScan(id).catch(() => {})
    setScans(getAllScans())
    setDeletedToast(`${t('history.removedPrefix')} "${name}" ${t('history.removedSuffix')}`)
    setTimeout(() => setDeletedToast(null), 3000)
  }

  function handleClearAll() {
    if (window.confirm(t('history.clearConfirm'))) {
      clearAllScans()
      analysisApi.clearLiveHistory().catch(() => {})
      setScans(getAllScans())
      setDeletedToast(t('history.clearedToast'))
      setTimeout(() => setDeletedToast(null), 3000)
    }
  }

  const filtered = scans.filter((s) => s.productName.toLowerCase().includes(query.toLowerCase()))

  if (scans.length === 0) {
    return (
      <EmptyState
        icon={HistoryIcon}
        title={t('history.emptyTitle')}
        description={t('history.emptyDesc')}
        actionLabel={t('history.emptyAction')}
        onAction={() => navigate('/app/home')}
      />
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t('history.title')}</h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
            {scans.length} {scans.length === 1 ? t('history.subtitleOne') : t('history.subtitleMany')}
          </p>
        </div>
        {scans.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-danger dark:text-neutral-400 dark:hover:text-red-400 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" /> {t('history.clearAll')}
          </button>
        )}
      </div>

      {deletedToast && (
        <div className="mb-4 rounded-md bg-neutral-900 px-4 py-2.5 text-xs font-medium text-white shadow-md dark:bg-darksurface dark:border dark:border-white/10">
          {deletedToast}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600 dark:text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('history.searchPlaceholder')}
            aria-label={t('history.searchLabel')}
            className="h-10 w-full rounded-full border border-neutral-300 bg-white pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-darksurface dark:border-white/10 dark:text-neutral-100"
          />
        </div>
        <div className="ml-auto flex overflow-hidden rounded-md border border-neutral-300 dark:border-white/10">
          <button
            aria-label={t('history.gridView')}
            onClick={() => setView('grid')}
            className={cn(
              'flex h-9 w-9 items-center justify-center transition-colors',
              view === 'grid'
                ? 'bg-primary-light text-primary-dark dark:bg-primary-dark/30 dark:text-primary-light'
                : 'text-neutral-600 dark:text-neutral-400'
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            aria-label={t('history.listView')}
            onClick={() => setView('list')}
            className={cn(
              'flex h-9 w-9 items-center justify-center transition-colors',
              view === 'list'
                ? 'bg-primary-light text-primary-dark dark:bg-primary-dark/30 dark:text-primary-light'
                : 'text-neutral-600 dark:text-neutral-400'
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-600 dark:text-neutral-400">
          {t('history.noMatchStart')} “{query}”. {t('history.noMatchEnd')}
        </p>
      ) : (
        <div className={view === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-2'}>
          {filtered.map((s) => (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/app/dashboard/${s.id}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/app/dashboard/${s.id}`)}
              className={cn(
                'group cursor-pointer rounded-lg border border-neutral-100 bg-white p-4 shadow-sm hover:shadow-md dark:border-white/5 dark:bg-darksurface transition-all',
                view === 'list' && 'flex items-center justify-between'
              )}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${riskDotClass(riskFromScore(s.safetyScore))}`} />
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{s.productName}</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">{s.scanDate}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between md:mt-0">
                <span className="text-lg font-bold text-primary-dark dark:text-primary-light">{s.safetyScore}</span>
                <div className="flex gap-1 opacity-80 sm:opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    aria-label={`${t('history.compareTitle')} ${s.productName}`}
                    title={t('history.compareTitle')}
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/app/compare?a=${s.id}`)
                    }}
                    className="rounded-sm p-1.5 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <GitCompare className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                  </button>
                  <button
                    aria-label={`${t('history.deleteTitle')} ${s.productName}`}
                    title={t('history.deleteTitle')}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(s.id, s.productName)
                    }}
                    className="rounded-sm p-1.5 hover:bg-danger-light dark:hover:bg-danger/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
