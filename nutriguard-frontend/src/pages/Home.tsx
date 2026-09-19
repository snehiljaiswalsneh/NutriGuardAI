import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Lock, ArrowRight } from 'lucide-react'
import { Textarea, Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getAllScans } from '@/data/mock'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

type Mode = 'paste' | 'manual'

export default function Home() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [mode, setMode] = useState<Mode>('paste')
  const [pasteText, setPasteText] = useState('')
  const [rows, setRows] = useState([''])
  const [productName, setProductName] = useState('')

  const canSubmit = mode === 'paste' ? pasteText.trim().length > 0 : rows.some((r) => r.trim().length > 0)

  function handleAnalyze() {
    if (!canSubmit) return
    const text = mode === 'paste' ? pasteText : rows.filter((r) => r.trim().length > 0).join(', ')
    navigate('/app/analyzing', {
      state: {
        productName: productName.trim() || 'Custom Product',
        ingredientText: text.trim(),
      },
    })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t('home.title')}</h1>
      <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">{t('home.subtitle')}</p>

      <Card>
        <div role="tablist" aria-label="Ingredient input method" className="mb-4 inline-flex rounded-full bg-neutral-100 dark:bg-white/5 p-1">
          <button
            role="tab"
            aria-selected={mode === 'paste'}
            onClick={() => setMode('paste')}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              mode === 'paste'
                ? 'bg-white shadow-xs text-primary-dark dark:bg-darksurface dark:text-primary-light'
                : 'text-neutral-600 dark:text-neutral-400'
            )}
          >
            {t('home.tabPaste')}
          </button>
          <button
            role="tab"
            aria-selected={mode === 'manual'}
            onClick={() => setMode('manual')}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              mode === 'manual'
                ? 'bg-white shadow-xs text-primary-dark dark:bg-darksurface dark:text-primary-light'
                : 'text-neutral-600 dark:text-neutral-400'
            )}
          >
            {t('home.tabManual')}
          </button>
          <button
            role="tab"
            aria-disabled="true"
            aria-selected={false}
            disabled
            title="Coming soon"
            className="flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium text-neutral-300"
          >
            <Lock className="h-3.5 w-3.5" /> Scan
          </button>
        </div>

        {mode === 'paste' ? (
          <Textarea
            label="Ingredient list"
            placeholder="e.g. Water, Sugar, Sodium Nitrite, Citric Acid, Tartrazine (E102)…"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Ingredients</label>
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={row}
                  onChange={(e) => {
                    const next = [...rows]
                    next[i] = e.target.value
                    setRows(next)
                  }}
                  placeholder={`Ingredient ${i + 1}`}
                  className="flex-1"
                />
                {rows.length > 1 && (
                  <button aria-label="Remove ingredient" onClick={() => setRows(rows.filter((_, idx) => idx !== i))} className="rounded-sm p-2 hover:bg-neutral-100">
                    <X className="h-4 w-4 text-neutral-600" />
                  </button>
                )}
              </div>
            ))}
            <Button variant="ghost" size="sm" className="self-start" onClick={() => setRows([...rows, ''])}>
              <Plus className="h-4 w-4" /> {t('home.addIngredient')}
            </Button>
          </div>
        )}

        <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
          {t('home.tip')}
        </p>

        <div className="mt-4">
          <Input
            label={t('home.productNameLabel')}
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder={t('home.productNamePlaceholder')}
          />
        </div>

        <Button className="mt-6 w-full" size="lg" disabled={!canSubmit} onClick={handleAnalyze}>
          {t('home.analyzeBtn')} <ArrowRight className="h-4 w-4" />
        </Button>
      </Card>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-neutral-600 dark:text-neutral-400">{t('home.recentScans')}</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {getAllScans().slice(0, 4).map((scan) => (
            <button
              key={scan.id}
              onClick={() => navigate(`/app/dashboard/${scan.id}`)}
              className="w-48 shrink-0 rounded-lg border border-neutral-100 bg-white p-4 text-left shadow-sm hover:shadow-md dark:border-white/5 dark:bg-darksurface transition-all"
            >
              <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">{scan.productName}</p>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{scan.scanDate}</p>
              <p className="mt-2 text-lg font-bold text-primary-dark dark:text-primary-light">{scan.safetyScore}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
