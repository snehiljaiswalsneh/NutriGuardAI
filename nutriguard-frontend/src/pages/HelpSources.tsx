import { useState, useMemo } from 'react'
import {
  HelpCircle,
  Database,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Info,
  BookOpen,
  Search,
  CheckCircle2,
  Send,
  MessageSquare,
  Sparkles,
  ChevronDown,
  Globe,
  Award,
  Activity,
  FileText,
  LifeBuoy
} from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

interface SourceItem {
  id: string
  name: string
  acronym: string
  region: string
  category: string
  description: string
  dataProvided: string[]
  url: string
  badgeColor: string
}

interface FaqItem {
  id: string
  category: string
  question: string
  answer: string
}

const SOURCES: SourceItem[] = [
  {
    id: 'efsa',
    name: 'European Food Safety Authority',
    acronym: 'EFSA',
    region: 'European Union (EU)',
    category: 'Regulatory Agency',
    description:
      'The primary risk assessment authority on food safety in the European Union. Provides scientific advice and chemical toxicological evaluations on food additives, flavorings, and novel foods.',
    dataProvided: [
      'E-number safety evaluations',
      'Acceptable Daily Intake (ADI) benchmarks',
      'Genotoxicity & carcinogenicity re-evaluations',
      'Titanium Dioxide (E171) & artificial color regulations'
    ],
    url: 'https://www.efsa.europa.eu/en/topics/topic/food-additive-re-evaluations',
    badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
  },
  {
    id: 'fda',
    name: 'U.S. Food and Drug Administration',
    acronym: 'US FDA',
    region: 'United States',
    category: 'Regulatory Agency',
    description:
      'Maintains Code of Federal Regulations (CFR Title 21) food substance lists, GRAS (Generally Recognized as Safe) inventories, and food coloring additive approvals.',
    dataProvided: [
      'GRAS Database notices and determinations',
      'Food Additive Status List (CFR Title 21)',
      'Color Additives Permitted for Use in Food',
      'Major Food Allergens guidelines (FALCPA & FASTER Act)'
    ],
    url: 'https://www.fda.gov/food/food-ingredients-packaging/food-additives-petitions',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  },
  {
    id: 'jecfa',
    name: 'Joint FAO/WHO Expert Committee on Food Additives',
    acronym: 'JECFA (WHO / FAO)',
    region: 'Global / United Nations',
    category: 'International Standards',
    description:
      'International scientific committee administered jointly by the Food and Agriculture Organization (FAO) and World Health Organization (WHO) establishing global safety standards for food additives and contaminants.',
    dataProvided: [
      'Codex Alimentarius General Standard for Food Additives (GSFA)',
      'International ADI and dietary intake specifications',
      'Chemical purity and toxicological monographs',
      'Aspartame and artificial sweetener safety updates'
    ],
    url: 'https://www.who.int/groups/joint-fao-who-expert-committee-on-food-additives-(jecfa)',
    badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
  },
  {
    id: 'fssai',
    name: 'Food Safety and Standards Authority of India',
    acronym: 'FSSAI',
    region: 'India',
    category: 'Regulatory Agency',
    description:
      'Statutory body established under the Ministry of Health & Family Welfare governing the safety, standard formulation, and labeling of food products across India.',
    dataProvided: [
      'Food Safety and Standards (Food Products Standards and Food Additives) Regulations',
      'Mandatory veg/non-veg labeling standards',
      'Permitted limits for emulsifiers, preservatives, and food colors',
      'Prohibited food ingredients and heavy metal contaminant thresholds'
    ],
    url: 'https://www.fssai.gov.in/',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800'
  },
  {
    id: 'iarc',
    name: 'International Agency for Research on Cancer',
    acronym: 'IARC / WHO',
    region: 'Global Research',
    category: 'Scientific Research',
    description:
      'Specialized cancer agency of the World Health Organization that evaluates human carcinogenic risks of environmental and dietary agents.',
    dataProvided: [
      'IARC Monographs (Group 1, 2A, 2B, 3 carcinogen categories)',
      'Evaluations on processed meat, acrylamide, and food packaging chemicals',
      'Peer-reviewed cancer risk classifications'
    ],
    url: 'https://monographs.iarc.who.int/',
    badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800'
  },
  {
    id: 'openfoodfacts',
    name: 'Open Food Facts Database',
    acronym: 'OFF Database',
    region: 'Global Open Database',
    category: 'Open Data Initiative',
    description:
      'A collaborative, free, and open database of food products from around the world containing over 3 million ingredients lists, nutritional panels, and product barcodes.',
    dataProvided: [
      'Multi-lingual food ingredient listings',
      'NOVA ultra-processed food classifications',
      'Nutri-Score calculations',
      'Standardized allergen & additive taxonomy'
    ],
    url: 'https://world.openfoodfacts.org/',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800'
  },
  {
    id: 'pubmed',
    name: 'PubMed & NCBI ToxNet Literature',
    acronym: 'PubMed / NIH',
    region: 'Global Scientific Literature',
    category: 'Peer-Reviewed Research',
    description:
      'The world’s largest biomedical research archive maintained by the United States National Library of Medicine (NLM) at the National Institutes of Health (NIH).',
    dataProvided: [
      'Peer-reviewed toxicological and nutrition studies',
      'Gut microbiome impact research on emulsifiers and artificial sweeteners',
      'Clinical trial data on food sensitivities and allergen responses'
    ],
    url: 'https://pubmed.ncbi.nlm.nih.gov/',
    badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-sky-200 dark:border-sky-800'
  }
]

const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'Scoring & Accuracy',
    question: 'How does NutriGuard AI compute the 0–100 Safety Score?',
    answer:
      'Our AI analyzes each listed ingredient against our cross-referenced database of regulatory agency rulings (EFSA, FDA, WHO/JECFA, FSSAI) and peer-reviewed toxicology literature. We weigh items based on: (1) regulatory ban status across major jurisdictions, (2) carcinogenic or endocrine disruption flags, (3) ultra-processing degree (NOVA scale), (4) allergen profile, and (5) concentration estimates based on ingredient list order. Products without high-risk additives score 90–100, while products containing ingredients banned in certain regions or linked to health risks receive lower scores.'
  },
  {
    id: 'faq-2',
    category: 'Country Bans',
    question: 'Why is an ingredient marked "Banned" if it is sold in my local store?',
    answer:
      'Food regulations differ substantially around the world. For example, Potassium Bromate and Titanium Dioxide (E171) are prohibited in the European Union and other countries due to health precautions, yet may still be permitted in the United States or other jurisdictions. NutriGuard AI highlights these cross-border regulatory differences so you have transparent global insight into what other countries have banned or restricted.'
  },
  {
    id: 'faq-3',
    category: 'Scoring & Accuracy',
    question: 'Is NutriGuard AI a medical or clinical diagnostic tool?',
    answer:
      'No. NutriGuard AI provides educational, evidence-based ingredient evaluations based on public regulatory guidelines and scientific datasets. It does not replace medical advice, individualized dietary planning, or clinical allergy diagnosis. Always consult a healthcare professional for medical or dietary treatment.'
  },
  {
    id: 'faq-4',
    category: 'Features',
    question: 'How does the product comparison feature work?',
    answer:
      'The comparison engine evaluates two products side-by-side across their overall Safety Score, harmful additive flags, country ban discrepancies, allergen warnings, and ingredient processing levels, recommending the safer alternative with a clear rationale.'
  },
  {
    id: 'faq-5',
    category: 'Features',
    question: 'Can I scan photos of ingredient labels or barcodes?',
    answer:
      'Yes! You can paste raw ingredient text, build ingredient lists manually, or use our upcoming AI OCR scanner under "Future Tools" to capture photos of physical product packaging directly from your device.'
  },
  {
    id: 'faq-6',
    category: 'Privacy & Data',
    question: 'How is my scan history and data protected?',
    answer:
      'Your scan history is stored securely. In guest or demo mode, data is kept locally in your browser storage. When signed in, scans are synced to your private account and can be exported or permanently deleted at any time from your Scan History or Profile pages.'
  }
]

export default function HelpSources() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'sources' | 'methodology' | 'faqs' | 'support'>('sources')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<string | null>('faq-1')

  // Feedback form state
  const [feedbackSubject, setFeedbackSubject] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  // Filter sources
  const filteredSources = useMemo(() => {
    if (!searchQuery.trim()) return SOURCES
    const q = searchQuery.toLowerCase()
    return SOURCES.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.acronym.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.dataProvided.some((d) => d.toLowerCase().includes(q))
    )
  }, [searchQuery])

  // Filter FAQs
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return FAQS
    const q = searchQuery.toLowerCase()
    return FAQS.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedbackMessage.trim()) return
    setFeedbackSubmitted(true)
    setTimeout(() => {
      setFeedbackSubject('')
      setFeedbackMessage('')
      setFeedbackSubmitted(false)
    }, 4000)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-r from-primary-light/40 via-white to-neutral-50 p-6 shadow-xs dark:border-white/10 dark:from-primary-dark/20 dark:via-darksurface dark:to-darksurface md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/20 dark:text-primary-light">
              <LifeBuoy className="h-3.5 w-3.5" />
              <span>Knowledge Base & Verification</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-3xl">
              Help, Guides & Data Sources
            </h1>
            <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
              Discover how NutriGuard AI evaluates food ingredients, explore our authoritative regulatory sources, and understand our comprehensive safety scoring methodology.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs font-medium text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span>Databases synced & active</span>
            </div>
          </div>
        </div>

        {/* Search input in banner */}
        <div className="relative mt-6 max-w-lg">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search regulatory bodies, scoring rules, or FAQs..."
            className="h-11 w-full rounded-xl border border-neutral-300 bg-white/90 pl-10 pr-4 text-sm text-neutral-900 shadow-2xs placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-darksurface dark:text-neutral-100"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-2 dark:border-white/10">
        <button
          onClick={() => setActiveTab('sources')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'sources'
              ? 'bg-primary text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-neutral-200'
          )}
        >
          <Database className="h-4 w-4" />
          Scientific & Regulatory Sources
          <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.2 text-xs font-semibold">
            {SOURCES.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('methodology')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'methodology'
              ? 'bg-primary text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-neutral-200'
          )}
        >
          <Award className="h-4 w-4" />
          Scoring Methodology (0–100)
        </button>

        <button
          onClick={() => setActiveTab('faqs')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'faqs'
              ? 'bg-primary text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-neutral-200'
          )}
        >
          <HelpCircle className="h-4 w-4" />
          Frequently Asked Questions
          <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.2 text-xs font-semibold">
            {FAQS.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'support'
              ? 'bg-primary text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-neutral-200'
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Support & Feedback
        </button>
      </div>

      {/* Tab Content 1: Sources */}
      {activeTab === 'sources' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Authoritative Global Regulatory & Scientific Databases
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              NutriGuard AI cross-references every detected ingredient and additive against official toxicology monographs, international bans, and peer-reviewed safety assessments.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {filteredSources.map((source) => (
              <div
                key={source.id}
                className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-6 shadow-2xs transition-all hover:border-neutral-300 hover:shadow-xs dark:border-white/10 dark:bg-darksurface dark:hover:border-white/20"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn('rounded-md border px-2 py-0.5 text-xs font-semibold', source.badgeColor)}>
                          {source.acronym}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {source.category}
                        </span>
                      </div>
                      <h3 className="mt-1.5 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        {source.name}
                      </h3>
                      <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        <Globe className="h-3.5 w-3.5" />
                        {source.region}
                      </p>
                    </div>

                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-neutral-200 p-2 text-neutral-500 hover:bg-neutral-50 hover:text-primary dark:border-white/10 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-primary-light"
                      title="Open Official Portal"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>

                  <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                    {source.description}
                  </p>

                  <div className="pt-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Key Data Extracted:
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {source.dataProvided.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-white/5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                    <Activity className="h-3 w-3 text-emerald-500" />
                    Verified & Integrated
                  </span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline dark:text-primary-light"
                  >
                    Visit Registry <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {filteredSources.length === 0 && (
            <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-white/10">
              <Database className="mx-auto h-8 w-8 text-neutral-400" />
              <p className="mt-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                No data sources found matching "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs font-semibold text-primary hover:underline"
              >
                Reset search
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Methodology */}
      {activeTab === 'methodology' && (
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              The NutriGuard AI Safety Score (0–100)
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Our holistic scoring model evaluates ingredients on an empirical 100-point scale designed by combining chemical toxicity profiles, international regulatory bans, and nutritional purity.
            </p>
          </div>

          {/* Score tiers breakdown */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Safe */}
            <div className="flex flex-col justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
                    90 – 100
                  </span>
                  <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="mt-3 text-base font-semibold text-emerald-900 dark:text-emerald-200">
                  Safe & Wholesome
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-emerald-800/90 dark:text-emerald-300/80">
                  Formulated with clean, non-toxic, whole ingredients. Contains zero banned additives, no synthetic dyes, and no controversial preservatives.
                </p>
              </div>
              <div className="mt-4 border-t border-emerald-200 pt-3 dark:border-emerald-900/40">
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  Recommended for daily intake
                </span>
              </div>
            </div>

            {/* Moderate */}
            <div className="flex flex-col justify-between rounded-xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-amber-600 px-2.5 py-1 text-xs font-bold text-white">
                    70 – 89
                  </span>
                  <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="mt-3 text-base font-semibold text-amber-900 dark:text-amber-200">
                  Moderate Caution
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-amber-800/90 dark:text-amber-300/80">
                  Generally recognized as safe but may contain mild irritants, higher refined sodium/sugar content, or common synthetic thickeners.
                </p>
              </div>
              <div className="mt-4 border-t border-amber-200 pt-3 dark:border-amber-900/40">
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  Consume in moderation
                </span>
              </div>
            </div>

            {/* High Risk */}
            <div className="flex flex-col justify-between rounded-xl border border-orange-200 bg-orange-50/60 p-5 dark:border-orange-900/40 dark:bg-orange-950/20">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-orange-600 px-2.5 py-1 text-xs font-bold text-white">
                    40 – 69
                  </span>
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="mt-3 text-base font-semibold text-orange-900 dark:text-orange-200">
                  High Risk / Flagged
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-orange-800/90 dark:text-orange-300/80">
                  Contains artificial azo dyes (e.g. Red 40, Yellow 5), synthetic preservatives (BHA/BHT), or additives requiring advisory labels in certain jurisdictions.
                </p>
              </div>
              <div className="mt-4 border-t border-orange-200 pt-3 dark:border-orange-900/40">
                <span className="text-[11px] font-semibold text-orange-700 dark:text-orange-400">
                  Safer swaps recommended
                </span>
              </div>
            </div>

            {/* Critical */}
            <div className="flex flex-col justify-between rounded-xl border border-red-200 bg-red-50/60 p-5 dark:border-red-900/40 dark:bg-red-950/20">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
                    0 – 39
                  </span>
                  <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="mt-3 text-base font-semibold text-red-900 dark:text-red-200">
                  Critical / Banned
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-red-800/90 dark:text-red-300/80">
                  Contains substances banned in the EU, Japan, or other leading food agencies, known endocrine disruptors, or potential carcinogens.
                </p>
              </div>
              <div className="mt-4 border-t border-red-200 pt-3 dark:border-red-900/40">
                <span className="text-[11px] font-semibold text-red-700 dark:text-red-400">
                  Avoid consumption
                </span>
              </div>
            </div>
          </div>

          {/* 4 Pillars of Scoring */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xs dark:border-white/10 dark:bg-darksurface">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              The 4 Pillars of the NutriGuard Scoring Engine
            </h3>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-dark dark:bg-primary-dark/30 dark:text-primary-light">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    1. Toxicological & Chemical Safety (40%)
                  </h4>
                  <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                    Assesses potential cellular toxicity, endocrine disruption risk, gut microbiome disruption, and IARC cancer classifications.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    2. Cross-Border Regulatory Bans (30%)
                  </h4>
                  <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                    Checks whether ingredients are prohibited or restricted under strict foreign safety standards like EU EFSA, Health Canada, or Japan MHLW.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    3. Ultra-Processing Degree & Additives (20%)
                  </h4>
                  <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                    Evaluates NOVA classification levels, synthetic emulsifiers, non-nutritive sweeteners, and industrial processing aids.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    4. Allergen & Sensitive Group Warnings (10%)
                  </h4>
                  <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                    Detects common allergens (dairy, soy, gluten, nuts, sulfites) and flags ingredients that may trigger sensitivities in children or pregnant individuals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: FAQs */}
      {activeTab === 'faqs' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Clear answers regarding how NutriGuard AI operates, our data sources, and food transparency.
            </p>
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const isExpanded = expandedFaq === faq.id
              return (
                <div
                  key={faq.id}
                  className="rounded-xl border border-neutral-200 bg-white transition-all dark:border-white/10 dark:bg-darksurface"
                >
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                    className="flex w-full items-center justify-between p-5 text-left"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                        {faq.category}
                      </span>
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {faq.question}
                      </h3>
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200',
                        isExpanded && 'rotate-180 text-primary'
                      )}
                    />
                  </button>

                  {isExpanded && (
                    <div className="border-t border-neutral-100 px-5 pb-5 pt-3 dark:border-white/5">
                      <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-white/10">
              <HelpCircle className="mx-auto h-8 w-8 text-neutral-400" />
              <p className="mt-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                No questions found matching "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs font-semibold text-primary hover:underline"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 4: Support & Feedback */}
      {activeTab === 'support' && (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-4 md:col-span-1">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Get in Touch
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Have a question about an ingredient assessment, want to report an unlisted additive, or need assistance? Our support team and AI researchers are here to help.
            </p>

            <div className="space-y-3 pt-2">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                  Email Support
                </p>
                <p className="mt-1 text-sm font-medium text-primary dark:text-primary-light">
                  support@nutriguard.ai
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                  Scientific Inquiries
                </p>
                <p className="mt-1 text-sm font-medium text-primary dark:text-primary-light">
                  science@nutriguard.ai
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                  Response Time
                </p>
                <p className="mt-1 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  Within 24 hours
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xs dark:border-white/10 dark:bg-darksurface md:col-span-2">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Send a Feedback or Ingredient Query
            </h3>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Submit your inquiry or suggest an ingredient toxicology update.
            </p>

            {feedbackSubmitted ? (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-800 dark:bg-emerald-950/30">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                <h4 className="mt-2 text-base font-semibold text-emerald-900 dark:text-emerald-200">
                  Thank You for Your Feedback!
                </h4>
                <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                  Your message has been received. Our team will review the details and update our database where applicable.
                </p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Subject / Topic
                  </label>
                  <Input
                    type="text"
                    required
                    value={feedbackSubject}
                    onChange={(e) => setFeedbackSubject(e.target.value)}
                    placeholder="e.g. Suggest a source, Report misclassified ingredient, General query"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Message Details
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Describe your question or feedback in detail..."
                    className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white p-3 text-sm text-neutral-900 shadow-2xs placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-darksurface dark:text-neutral-100"
                  />
                </div>

                <Button type="submit" className="w-full sm:w-auto">
                  <Send className="mr-2 h-4 w-4" />
                  Submit Feedback
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Medical Disclaimer Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-600 dark:border-white/5 dark:bg-white/5 dark:text-neutral-400">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
        <p>
          <strong className="font-semibold text-neutral-800 dark:text-neutral-200">
            Educational Disclaimer:
          </strong>{' '}
          NutriGuard AI is designed for informational and educational awareness based on publicly available regulatory datasets (EFSA, FDA, WHO/JECFA, FSSAI). It does not provide medical diagnoses or individual clinical guidance. Always consult qualified healthcare professionals regarding severe allergies or therapeutic diets.
        </p>
      </div>
    </div>
  )
}
