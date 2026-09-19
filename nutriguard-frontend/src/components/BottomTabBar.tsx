import { NavLink } from 'react-router-dom'
import { Home, History, GitCompare, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/context/LanguageContext'

const tabs = [
  { to: '/app/home', labelKey: 'nav.home', fallback: 'Home', icon: Home },
  { to: '/app/history', labelKey: 'nav.history', fallback: 'History', icon: History },
  { to: '/app/compare', labelKey: 'nav.compare', fallback: 'Compare', icon: GitCompare },
  { to: '/app/profile', labelKey: 'nav.profile', fallback: 'Profile', icon: User },
]

export function BottomTabBar() {
  const { t } = useLanguage()
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex h-16 items-center justify-around border-t border-neutral-100 bg-white pb-[env(safe-area-inset-bottom)] dark:border-white/5 dark:bg-darksurface md:hidden"
      aria-label="Primary"
    >
      {tabs.map(({ to, labelKey, fallback, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn('flex flex-col items-center gap-1 text-xs text-neutral-600', isActive && 'text-primary-dark')
          }
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          {t(labelKey) || fallback}
        </NavLink>
      ))}
    </nav>
  )
}
