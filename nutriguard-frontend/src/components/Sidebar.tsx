import { NavLink } from 'react-router-dom'
import { Home, LayoutDashboard, History, GitCompare, Sparkles, Settings, LifeBuoy, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/context/LanguageContext'

const items = [
  { to: '/app/home', labelKey: 'nav.home', fallback: 'Home', icon: Home },
  { to: '/app/dashboard', labelKey: 'nav.dashboard', fallback: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/history', labelKey: 'nav.history', fallback: 'Scan History', icon: History },
  { to: '/app/compare', labelKey: 'nav.compare', fallback: 'Compare Products', icon: GitCompare },
  { to: '/app/future/ocr', labelKey: 'nav.future', fallback: 'Future Tools', icon: Sparkles, badge: 'Soon' },
]

export function Sidebar() {
  const { t } = useLanguage()

  return (
    <aside className="hidden w-[260px] shrink-0 flex-col border-r border-neutral-100 bg-white px-3 py-6 dark:border-white/5 dark:bg-darksurface md:flex">
      <div className="mb-8 flex items-center gap-2 px-3">
        <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
        <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100">NutriGuard AI</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {items.map(({ to, labelKey, fallback, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-sm border-l-2 border-transparent px-3 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-300 transition-colors hover:bg-neutral-50 dark:hover:bg-white/5',
                isActive && 'border-primary bg-primary-light/40 text-primary-dark dark:bg-primary-dark/30 dark:text-primary-light font-semibold'
              )
            }
          >
            <Icon className="h-4.5 w-4.5" aria-hidden="true" />
            {t(labelKey) || fallback}
            {badge && (
              <span className="ml-auto rounded-full bg-secondary-light dark:bg-secondary/20 px-2 py-0.5 text-[10px] font-semibold text-secondary dark:text-blue-300">
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-1 border-t border-neutral-100 pt-3 dark:border-white/5">
        <NavLink
          to="/app/profile"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors',
              isActive && 'text-primary-dark dark:text-primary-light font-semibold'
            )
          }
        >
          <Settings className="h-4.5 w-4.5" aria-hidden="true" />
          {t('nav.settings')}
        </NavLink>
        <NavLink
          to="/app/help"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors',
              isActive && 'text-primary-dark dark:text-primary-light font-semibold'
            )
          }
        >
          <LifeBuoy className="h-4.5 w-4.5" aria-hidden="true" />
          {t('nav.help')}
        </NavLink>
      </div>
    </aside>
  )
}
