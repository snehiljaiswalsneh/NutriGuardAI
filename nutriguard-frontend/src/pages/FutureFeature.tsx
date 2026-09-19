import { useParams } from 'react-router-dom'
import { ScanLine, Barcode, Mic, Languages, Bell } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

const FEATURE_KEYS: Record<string, { icon: typeof ScanLine; titleKey: string; descKey: string }> = {
  ocr: { icon: ScanLine, titleKey: 'future.ocrTitle', descKey: 'future.ocrDesc' },
  barcode: { icon: Barcode, titleKey: 'future.barcodeTitle', descKey: 'future.barcodeDesc' },
  voice: { icon: Mic, titleKey: 'future.voiceTitle', descKey: 'future.voiceDesc' },
  language: { icon: Languages, titleKey: 'future.langTitle', descKey: 'future.langDesc' },
}

export default function FutureFeature() {
  const { feature } = useParams()
  const { t } = useLanguage()
  const [notified, setNotified] = useState(false)
  const data = FEATURE_KEYS[feature || 'ocr'] || FEATURE_KEYS.ocr
  const Icon = data.icon

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-xl border border-neutral-100 bg-white p-8 text-center shadow-lg dark:border-white/10 dark:bg-darksurface">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-primary/40 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-950/30">
          <Icon className="h-7 w-7 text-primary-dark dark:text-emerald-400" aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t(data.titleKey)}</h1>
        <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">{t(data.descKey)}</p>
        <Button className="w-full" disabled={notified} onClick={() => setNotified(true)}>
          <Bell className="h-4 w-4" /> {notified ? t('future.notified') : t('future.notifyMe')}
        </Button>
      </div>
    </div>
  )
}
