import { useNavigate } from 'react-router-dom'
import { Compass, ServerCrash, WifiOff, FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LucideIcon } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

function ErrorTemplate({
  icon: Icon,
  title,
  description,
  actionLabel,
  contactLabel,
  onAction,
}: {
  icon: LucideIcon
  title: string
  description: string
  actionLabel: string
  contactLabel: string
  onAction: () => void
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/10">
        <Icon className="h-8 w-8 text-neutral-600 dark:text-neutral-300" aria-hidden="true" />
      </div>
      <h1 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">{title}</h1>
      <p className="mb-6 max-w-sm text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
      <div className="flex items-center gap-3">
        <Button onClick={onAction}>{actionLabel}</Button>
        <a href="mailto:support@nutriguard.ai" className="text-sm font-medium text-neutral-600 hover:underline dark:text-neutral-400 dark:hover:text-neutral-200">
          {contactLabel}
        </a>
      </div>
    </div>
  )
}

function useContactLabel() {
  const { t } = useLanguage()
  return t('common.contactSupport')
}

export function NotFound() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  return (
    <ErrorTemplate
      icon={Compass}
      title={t('error.notFoundTitle')}
      description={t('error.notFoundDesc')}
      actionLabel={t('common.goHome')}
      contactLabel={useContactLabel()}
      onAction={() => navigate('/app/home')}
    />
  )
}

export function ServerError() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  return (
    <ErrorTemplate
      icon={ServerCrash}
      title={t('error.serverTitle')}
      description={t('error.serverDesc')}
      actionLabel={t('common.retry')}
      contactLabel={useContactLabel()}
      onAction={() => navigate(0)}
    />
  )
}

export function NetworkError() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  return (
    <ErrorTemplate
      icon={WifiOff}
      title={t('error.networkTitle')}
      description={t('error.networkDesc')}
      actionLabel={t('common.retry')}
      contactLabel={useContactLabel()}
      onAction={() => navigate(0)}
    />
  )
}

export function NoAnalysisFound() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  return (
    <ErrorTemplate
      icon={FileQuestion}
      title={t('error.noAnalysisTitle')}
      description={t('error.noAnalysisDesc')}
      actionLabel={t('error.noAnalysisAction')}
      contactLabel={useContactLabel()}
      onAction={() => navigate('/app/home')}
    />
  )
}
