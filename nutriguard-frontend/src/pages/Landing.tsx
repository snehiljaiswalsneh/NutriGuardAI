import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  ScanLine,
  Globe2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Zap,
  HeartPulse,
  Scale,
  Flame,
  ChevronRight,
  Sun,
  Moon,
  Search,
  Check,
  TrendingUp,
  Star,
  Activity,
  Shield,
  FileCheck2,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/Button'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

// Interactive Demo Scans
const DEMO_PRESETS = [
  {
    id: 'cereal',
    name: 'Kids Sweet Crisp Cereal',
    category: 'Breakfast Cereals',
    score: 54,
    verdict: 'Moderate Risk',
    color: 'amber',
    flagged: ['Yellow #5 (Tartrazine)', 'BHT Preservative', 'High Fructose Corn Syrup'],
    safeAlternative: 'Organic Sprouted Honey Spelt O’s (Score: 96)',
    highlights: {
      sugar: '18g per bowl',
      calories: '210 kcal',
      bans: 'Banned in EU for school nutrition programs',
    },
  },
  {
    id: 'energy',
    name: 'HyperPulse Zero Energy Drink',
    category: 'Carbonated Energy',
    score: 38,
    verdict: 'High Risk',
    color: 'red',
    flagged: ['Sucralose & Acesulfame K', 'Artificial Blue 1', 'Synthetic Taurine (industrial)'],
    safeAlternative: 'Cold-Brew Guayusa Organic Sparkling Tea (Score: 94)',
    highlights: {
      sugar: '0g (High synthetic sweetness)',
      calories: '10 kcal',
      bans: 'Warning label mandatory in 3 countries',
    },
  },
  {
    id: 'organic',
    name: 'Stoneground Ancient Grain Bread',
    category: 'Bakery & Grains',
    score: 97,
    verdict: 'Clean & Safe',
    color: 'emerald',
    flagged: [],
    safeAlternative: 'Top tier wholesome formulation',
    highlights: {
      sugar: '<1g naturally occurring',
      calories: '110 kcal / slice',
      bans: 'Global 100% clean approval',
    },
  },
]

const features = [
  {
    icon: ScanLine,
    title: 'Instant Label OCR & AI Parsing',
    text: 'Scan any ingredient label from your camera or paste the text. Our multi-agent parser deciphers cryptic chemical codes & E-numbers in milliseconds.',
    badge: 'Real-time',
    gradient: 'from-blue-500/10 to-indigo-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: Globe2,
    title: 'Country Regulatory Ban Database',
    text: 'See exactly where an additive is banned, restricted, or approved across 30+ international food safety agencies including FDA, EFSA, and FSSAI.',
    badge: '30+ Jurisdictions',
    gradient: 'from-emerald-500/10 to-teal-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: HeartPulse,
    title: 'Personalized Allergy & Fitness Alignment',
    text: 'NutriGuard automatically cross-references every food item against your unique allergens, protein quotas, sugar limits, and metabolic workout goals.',
    badge: 'Personalized',
    gradient: 'from-purple-500/10 to-pink-500/10',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    icon: Sparkles,
    title: 'Safer 95+ Score Swaps',
    text: 'When a product scores low, get 1 to 3 cleaner brand alternatives that preserve the exact culinary experience without the carcinogenic additives.',
    badge: 'Smart Swaps',
    gradient: 'from-amber-500/10 to-orange-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    icon: Scale,
    title: 'Side-by-Side Product Comparison',
    text: 'Compare two competing brands in a unified nutritional and toxicological matrix to pick the safest option for your family before adding to cart.',
    badge: 'Head-to-Head',
    gradient: 'from-emerald-500/10 to-cyan-500/10',
    iconColor: 'text-primary dark:text-primary-light',
  },
  {
    icon: Activity,
    title: 'Toxicological Safety Index',
    text: 'Objective 0–100 scoring based on peer-reviewed biomedical toxicology, endocrine disruption research, and gut microbiome clinical studies.',
    badge: 'Evidence-Based',
    gradient: 'from-rose-500/10 to-red-500/10',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
]

const steps = [
  {
    step: '01',
    title: 'Scan or Paste Label',
    text: 'Snap a quick photo of any nutrition box, upload an image, or paste ingredients directly from your grocery delivery app.',
  },
  {
    step: '02',
    title: 'Global Database Audit',
    text: 'NutriGuard AI checks 25,000+ additives against EU (EFSA), US (FDA), and WHO toxicological databases in under 2 seconds.',
  },
  {
    step: '03',
    title: 'Shop With Total Clarity',
    text: 'Receive an instant Safety Score, allergen warnings, macro breakdown, and high-scoring clean alternatives with identical taste.',
  },
]

const testMetrics = [
  { value: '25,000+', label: 'Additives Analyzed' },
  { value: '30+', label: 'Regulatory Bodies Monitored' },
  { value: '< 1.8s', label: 'Analysis Speed' },
  { value: '99.4%', label: 'Label Parsing Accuracy' },
]

export default function Landing() {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [selectedDemo, setSelectedDemo] = useState(0)
  const currentDemo = DEMO_PRESETS[selectedDemo]

  return (
    <div className="min-h-screen bg-white text-neutral-900 transition-colors dark:bg-darkbg dark:text-neutral-100">
      {/* 1. Dynamic Top Banner */}
      <div className="relative z-30 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 via-primary to-teal-600 px-4 py-2 text-center text-xs font-semibold text-white shadow-xs">
        <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '8s' }} />
        <span>New: Instant Side-by-Side Product Comparison &amp; Personalized Allergy Alerts are now live!</span>
        <Link to="/signup" className="ml-2 hidden underline hover:text-emerald-100 sm:inline">
          Try it free &rarr;
        </Link>
      </div>

      {/* 2. Glassmorphic Navigation */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-200/70 bg-white/80 px-6 backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-darkbg/80 md:px-12">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-md shadow-emerald-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-neutral-900 dark:text-white">
              NutriGuard <span className="text-primary">AI</span>
            </span>
            <span className="text-[10px] font-medium leading-none text-neutral-400">Intelligent Food Safety</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-neutral-600 dark:text-neutral-300 md:flex">
          <a href="#demo" className="transition-colors hover:text-primary dark:hover:text-primary-light">
            Live Preview
          </a>
          <a href="#features" className="transition-colors hover:text-primary dark:hover:text-primary-light">
            Capabilities
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-primary dark:hover:text-primary-light">
            How It Works
          </a>
          <a href="#metrics" className="transition-colors hover:text-primary dark:hover:text-primary-light">
            Trust &amp; Data
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200/80 bg-neutral-50 text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-white/10 dark:bg-darksurface dark:text-neutral-300 dark:hover:bg-white/10"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-neutral-600" />}
          </button>

          <Link
            to="/login"
            className="hidden text-sm font-semibold text-neutral-700 transition-colors hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white sm:inline"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className={cn(
              buttonVariants({ size: 'sm' }),
              'bg-gradient-to-r from-emerald-600 to-primary shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-primary-dark'
            )}
          >
            Get Started Free
          </Link>
        </div>
      </header>

      {/* 3. Hero Section with Glow & Interactive Elements */}
      <section className="relative overflow-hidden bg-radial-gradient px-6 pb-20 pt-16 md:px-12 lg:pt-24">
        {/* Subtle Ambient Background Orbs */}
        <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/5" />
        <div className="pointer-events-none absolute -right-40 top-32 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-500/5" />

        <div className="mx-auto max-w-5xl text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50/80 px-4 py-1.5 text-xs font-semibold text-emerald-800 backdrop-blur-md dark:border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Empowering 40,000+ conscious consumers across 18 countries
          </div>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-5xl md:text-6xl md:leading-[1.12]">
            Know what's <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-primary bg-clip-text text-transparent">really</span> in your food.
            <br className="hidden sm:inline" /> Never guess at grocery labels again.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-neutral-600 dark:text-neutral-300 sm:text-lg">
            NutriGuard AI dissects any ingredient list against international health databases. We detect hidden toxins, country bans, allergens, and recommend <strong>95+ score clean swaps</strong> in under 2 seconds.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <Link
              to="/signup"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'group h-12 w-full gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-primary to-teal-600 px-8 text-base font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-600/30 sm:w-auto'
              )}
            >
              <span>Analyze Your First Product Free</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <a
              href="#demo"
              className={cn(
                buttonVariants({ size: 'lg', variant: 'secondary' }),
                'h-12 w-full rounded-xl border border-neutral-200 bg-white/80 px-7 text-sm font-semibold text-neutral-800 shadow-sm backdrop-blur-md hover:bg-neutral-50 dark:border-white/10 dark:bg-darksurface dark:text-neutral-200 dark:hover:bg-white/5 sm:w-auto'
              )}
            >
              Explore Live Interactive Demo
            </a>
          </div>

          {/* Feature highlights bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-500" />
              <span>FDA, EFSA &amp; WHO cross-verified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-500" />
              <span>Personalized allergen screening</span>
            </div>
          </div>
        </div>

        {/* 4. Interactive Live Demo Component (Hero Showcase) */}
        <div id="demo" className="mx-auto mt-14 max-w-4xl">
          <div className="rounded-3xl border border-neutral-200/80 bg-white/95 p-3 shadow-2xl shadow-emerald-950/10 backdrop-blur-2xl transition-all dark:border-white/10 dark:bg-darksurface/95 sm:p-5">
            {/* Window bar */}
            <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-400/80" />
                <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
                <span className="ml-2 text-xs font-medium text-neutral-400">NutriGuard AI Live Analysis Engine</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Activity className="h-3.5 w-3.5 animate-pulse" />
                <span>Regulatory Sync Active</span>
              </div>
            </div>

            {/* Demo Selector Tabs */}
            <div className="mb-5 grid grid-cols-3 gap-2">
              {DEMO_PRESETS.map((demo, idx) => (
                <button
                  key={demo.id}
                  onClick={() => setSelectedDemo(idx)}
                  className={cn(
                    'flex flex-col items-start rounded-xl p-3 text-left transition-all border',
                    selectedDemo === idx
                      ? 'border-primary bg-primary-light/40 shadow-xs dark:border-primary dark:bg-primary-light/10'
                      : 'border-transparent bg-neutral-50 hover:bg-neutral-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]'
                  )}
                >
                  <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">{demo.category}</span>
                  <span className="mt-0.5 line-clamp-1 text-xs font-bold text-neutral-900 dark:text-white sm:text-sm">
                    {demo.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Analysis Result Card */}
            <div className="rounded-2xl border border-neutral-200/70 bg-gradient-to-b from-neutral-50/70 to-white p-5 dark:border-white/10 dark:from-white/[0.03] dark:to-transparent">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-bold',
                        currentDemo.score >= 80
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : currentDemo.score >= 50
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      )}
                    >
                      {currentDemo.verdict}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">Analyzed in 1.4s</span>
                  </div>
                  <h3 className="mt-2 text-xl font-extrabold text-neutral-900 dark:text-white">{currentDemo.name}</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Category: {currentDemo.category} • Global Scan
                  </p>
                </div>

                {/* Score badge */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Safety Score
                    </span>
                    <div className="flex items-baseline justify-end gap-1">
                      <span
                        className={cn(
                          'text-4xl font-black sm:text-5xl',
                          currentDemo.score >= 80
                            ? 'text-primary-dark dark:text-emerald-400'
                            : currentDemo.score >= 50
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        )}
                      >
                        {currentDemo.score}
                      </span>
                      <span className="text-sm font-semibold text-neutral-400">/100</span>
                    </div>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md dark:bg-white/10">
                    <ShieldCheck
                      className={cn(
                        'h-8 w-8',
                        currentDemo.score >= 80 ? 'text-primary' : currentDemo.score >= 50 ? 'text-amber-500' : 'text-rose-500'
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-neutral-200/60 bg-white p-3 dark:border-white/5 dark:bg-white/[0.02]">
                  <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Flagged Additives</span>
                  <div className="mt-1.5 space-y-1">
                    {currentDemo.flagged.length > 0 ? (
                      currentDemo.flagged.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          <span className="line-clamp-1">{f}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Zero harmful additives found</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200/60 bg-white p-3 dark:border-white/5 dark:bg-white/[0.02]">
                  <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Regulatory Status</span>
                  <p className="mt-1 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    {currentDemo.highlights.bans}
                  </p>
                  <p className="mt-1 text-[10px] text-neutral-500">Cross-referenced against 32 regulatory agencies.</p>
                </div>

                <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 p-3 dark:border-emerald-500/20 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">Clean Alternative</span>
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-neutral-900 dark:text-white">
                    {currentDemo.safeAlternative}
                  </p>
                  <span className="mt-1 inline-block text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                    ✓ Identical taste profile • Clean label
                  </span>
                </div>
              </div>

              {/* Demo CTA */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200/70 pt-4 dark:border-white/10">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  Try running this on your favorite cereal, snack, or drink.
                </span>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline dark:text-primary-light"
                >
                  Scan your own items right now <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Metrics & Trust Bar */}
      <section id="metrics" className="border-y border-neutral-200/70 bg-neutral-50/80 py-12 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 text-center md:grid-cols-4">
          {testMetrics.map((m, idx) => (
            <div key={idx} className="space-y-1">
              <p className="text-3xl font-extrabold text-neutral-900 dark:text-white md:text-4xl">{m.value}</p>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Comprehensive Capabilities & Feature Grid */}
      <section id="features" className="px-6 py-24 md:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="rounded-full bg-primary-light/80 px-3 py-1 text-xs font-bold text-primary-dark dark:bg-primary-light/10 dark:text-primary-light">
              Built for Complete Transparency
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-4xl">
              Everything you need to protect your family's health
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400 md:text-base">
              Food packaging is engineered to confuse you. NutriGuard cuts through greenwashing and marketing slogans with uncompromising scientific rigor.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text, badge, iconColor }, i) => (
              <div
                key={title}
                className="group relative flex flex-col justify-between rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg dark:border-white/10 dark:bg-darksurface dark:hover:border-primary/40"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 transition-colors group-hover:bg-primary-light/30 dark:bg-white/5 dark:group-hover:bg-primary-light/10')}>
                      <Icon className={cn('h-6 w-6', iconColor)} />
                    </div>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-bold text-neutral-600 dark:bg-white/5 dark:text-neutral-300">
                      {badge}
                    </span>
                  </div>
                  <h3 className="mt-5 text-base font-bold text-neutral-900 dark:text-white">{title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">{text}</p>
                </div>

                <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100 dark:text-primary-light">
                  <span>Learn more</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. How It Works Step-by-Step */}
      <section id="how-it-works" className="relative border-t border-neutral-200/70 bg-neutral-50/80 px-6 py-24 dark:border-white/10 dark:bg-white/[0.015] md:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="rounded-full bg-secondary-light px-3 py-1 text-xs font-bold text-secondary dark:bg-secondary/10 dark:text-blue-400">
              Effortless 3-Step Process
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-4xl">
              From label to safety verdict in seconds
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-neutral-600 dark:text-neutral-400">
              No medical degree needed. NutriGuard turns complex chemical terminology into everyday decisions.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map(({ step, title, text }) => (
              <div
                key={step}
                className="relative rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-darksurface"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-primary text-sm font-extrabold text-white shadow-sm">
                  {step}
                </div>
                <h3 className="mt-4 text-base font-bold text-neutral-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Comparison Highlight Featurette */}
      <section className="px-6 py-20 md:px-12">
        <div className="mx-auto max-w-5xl rounded-3xl border border-primary/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-8 md:p-12 dark:border-primary/20 dark:from-emerald-950/40 dark:via-darksurface dark:to-transparent">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                Direct Brand Comparison
              </span>
              <h2 className="mt-3 text-3xl font-extrabold text-neutral-900 dark:text-white">
                Stuck between two brands in the grocery aisle?
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                Compare both products in a unified single table across complete nutritional facts, vitamins, minerals, and toxic additive risks. See exactly which one delivers higher protein and cleaner ingredients.
              </p>
              <div className="mt-6 space-y-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Single table view for Macros, Vitamins, and Minerals</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Clear % Daily Value badges with automated advantage tags</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Instant allergy risk alerts based on your user profile</span>
                </div>
              </div>
              <div className="mt-8">
                <Link
                  to="/signup"
                  className={cn(
                    buttonVariants({ size: 'md' }),
                    'bg-primary font-bold text-white shadow-md hover:bg-primary-dark'
                  )}
                >
                  Try Comparison Tool Free &rarr;
                </Link>
              </div>
            </div>

            {/* Visual Mini Mockup */}
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-darksurface">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-white/10">
                <span className="text-xs font-bold text-neutral-900 dark:text-white">Nutritional Head-to-Head</span>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                  Chicken Biryani +16 pts Winner
                </span>
              </div>
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-2.5 dark:bg-white/[0.02]">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Protein Advantage</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">+15g Protein (Leaner)</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-2.5 dark:bg-white/[0.02]">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Sugar Load</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">-12g lower sugars</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-2.5 dark:bg-white/[0.02]">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Additive Toxicity</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">1 flagged vs 3 flagged</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Final High-Impact Bottom Call to Action */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-primary to-teal-700 px-6 py-20 text-center text-white md:px-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/20 to-transparent" />
        <div className="relative mx-auto max-w-3xl">
          <ShieldCheck className="mx-auto h-14 w-14 text-emerald-200" />
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Start eating with complete confidence today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-emerald-50 sm:text-lg">
            Join thousands of health-conscious families and fitness enthusiasts who scan before they eat. 100% free to start.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="h-12 w-full rounded-xl bg-white px-8 text-base font-bold text-emerald-900 shadow-xl transition-all hover:scale-105 hover:bg-neutral-50 sm:w-auto"
            >
              Get Started For Free
            </Link>
            <Link
              to="/login"
              className="h-12 w-full rounded-xl border border-white/30 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-md hover:bg-white/20 sm:w-auto"
            >
              Sign In To Your Account
            </Link>
          </div>
          <p className="mt-4 text-xs text-emerald-200">No software installation or credit card required.</p>
        </div>
      </section>

      {/* 10. Clean Footer */}
      <footer className="border-t border-neutral-200/80 bg-white px-6 py-12 dark:border-white/10 dark:bg-darkbg md:px-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-neutral-900 dark:text-white">NutriGuard AI</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-neutral-500 dark:text-neutral-400">
            <Link to="/app/help" className="hover:text-primary">
              Scientific Sources
            </Link>
            <Link to="/login" className="hover:text-primary">
              Login
            </Link>
            <Link to="/signup" className="hover:text-primary">
              Create Account
            </Link>
          </div>

          <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">
            &copy; {new Date().getFullYear()} NutriGuard AI. For educational use.
          </p>
        </div>
      </footer>
    </div>
  )
}
