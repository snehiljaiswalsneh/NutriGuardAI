import { Search, Bell, Sun, Moon, Globe } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

export function Navbar() {
  const { t, language, setLanguage } = useLanguage()
  const { user } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const initial = user.name ? user.name.trim().charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()

  return (
    <header className="glass sticky top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-100 px-4 dark:border-white/5 md:px-8">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative hidden max-w-sm flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600 dark:text-neutral-400" />
          <input
            type="search"
            placeholder={t('nav.searchPlaceholder')}
            aria-label={t('nav.searchPlaceholder')}
            className="h-10 w-full rounded-full border border-neutral-300 bg-white pl-9 pr-4 text-sm shadow-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-darksurface dark:border-white/10 dark:text-neutral-100 dark:placeholder-neutral-500"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Language Selector */}
        <div className="relative hidden items-center sm:flex">
          <Globe className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            aria-label="Change language"
            title="Change language"
            className="h-9 cursor-pointer appearance-none rounded-full border border-neutral-300 bg-white/90 py-1 pl-7 pr-3 text-xs font-medium text-neutral-700 shadow-2xs hover:border-neutral-400 focus:border-primary focus:outline-none dark:border-white/10 dark:bg-darksurface dark:text-neutral-200"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.nativeName}
              </option>
            ))}
          </select>
        </div>

        <button
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="relative rounded-full p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/5 transition-colors"
        >
          {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
        </button>
        <button aria-label="Notifications" className="relative rounded-full p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/5 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
        </button>
        <Link
          to="/app/profile"
          aria-label="Open profile"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          {initial}
        </Link>
      </div>
    </header>
  )
}
