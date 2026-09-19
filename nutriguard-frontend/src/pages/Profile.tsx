import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Palette,
  Globe,
  Bell,
  ShieldCheck,
  LogOut,
  Check,
  Sun,
  Moon,
  Dumbbell,
  AlertTriangle,
  Eye,
  EyeOff,
  MapPin,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Info
} from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useLanguage, SupportedLanguage, SUPPORTED_LANGUAGES } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

const sections = [
  { id: 'account', labelKey: 'profile.account', fallback: 'Account & Location', icon: User },
  { id: 'fitness', labelKey: 'profile.fitness', fallback: 'Gym & Fitness', icon: Dumbbell },
  { id: 'allergies', labelKey: 'profile.allergies', fallback: 'Food Allergies', icon: AlertTriangle },
  { id: 'appearance', labelKey: 'profile.appearance', fallback: 'Appearance', icon: Palette },
  { id: 'language', labelKey: 'profile.language', fallback: 'Language', icon: Globe },
  { id: 'notifications', labelKey: 'profile.notifications', fallback: 'Notifications', icon: Bell },
  { id: 'privacy', labelKey: 'profile.privacy', fallback: 'Privacy & Data', icon: ShieldCheck },
]

// 🏋️ 21 Gym / Fitness Conditional Questions
interface FitnessQuestion {
  id: string
  question: string
  options: string[]
  allowCustom?: boolean
}

const FITNESS_QUESTIONS: FitnessQuestion[] = [
  {
    id: 'fitnessGoal',
    question: 'Do you have a fitness goal?',
    options: ['Muscle Gain', 'Fat Loss', 'Strength', 'Endurance', 'General Fitness']
  },
  {
    id: 'isBeginner',
    question: 'Are you a beginner?',
    options: ['Complete Beginner', 'Some Experience', 'Experienced']
  },
  {
    id: 'gymAccess',
    question: 'Do you have gym access?',
    options: ['Full Gym', 'Home Gym', 'Basic Equipment', 'No Equipment']
  },
  {
    id: 'workoutInjuries',
    question: 'Do you have any workout injuries?',
    options: ['Knee', 'Shoulder', 'Back', 'Wrist', 'Ankle', 'Other'],
    allowCustom: true
  },
  {
    id: 'physicalLimitations',
    question: 'Do you have any physical limitations?',
    options: ['Mobility', 'Joint Movement', 'Lifting Restrictions', 'Other'],
    allowCustom: true
  },
  {
    id: 'followDiet',
    question: 'Do you follow a diet?',
    options: ['Vegetarian', 'Vegan', 'Non-Vegetarian', 'Eggetarian']
  },
  {
    id: 'foodAllergiesQuick',
    question: 'Do you have food allergies?',
    options: ['Milk', 'Eggs', 'Nuts', 'Soy', 'Gluten', 'Seafood', 'Other'],
    allowCustom: true
  },
  {
    id: 'avoidFoods',
    question: 'Do you avoid certain foods?',
    options: ['Dairy', 'Sugar', 'Gluten', 'Fried Food', 'Processed Food', 'Other'],
    allowCustom: true
  },
  {
    id: 'takeSupplements',
    question: 'Do you take supplements?',
    options: ['Protein', 'Creatine', 'Multivitamin', 'Omega-3', 'Other'],
    allowCustom: true
  },
  {
    id: 'proteinSupplements',
    question: 'Do you use protein supplements?',
    options: ['Whey', 'Plant Protein', 'Casein', 'Other'],
    allowCustom: true
  },
  {
    id: 'workoutEquipment',
    question: 'Do you have workout equipment?',
    options: ['Dumbbells', 'Barbell', 'Resistance Bands', 'Bench', 'Treadmill', 'Other'],
    allowCustom: true
  },
  {
    id: 'workoutStyle',
    question: 'Do you prefer a particular workout style?',
    options: ['Weight Training', 'Bodyweight', 'Cardio', 'HIIT', 'CrossFit', 'Sports']
  },
  {
    id: 'workoutSplit',
    question: 'Do you want a workout split?',
    options: ['Full Body', 'Push-Pull-Legs', 'Upper-Lower', 'Bro Split']
  },
  {
    id: 'doCardio',
    question: 'Do you do cardio?',
    options: ['Running', 'Cycling', 'Walking', 'Swimming', 'HIIT']
  },
  {
    id: 'trackCalories',
    question: 'Do you track your calories?',
    options: ['Calories', 'Protein', 'Carbs', 'Fats', 'All Macros']
  },
  {
    id: 'trackProgress',
    question: 'Do you track your progress?',
    options: ['Weight', 'Body Measurements', 'Strength', 'Photos', 'Workout Records']
  },
  {
    id: 'workoutDuration',
    question: 'Do you have a preferred workout duration?',
    options: ['30 min', '45 min', '60 min', '90+ min']
  },
  {
    id: 'workoutFrequency',
    question: 'Do you have a preferred workout frequency?',
    options: ['2 days per week', '3 days per week', '4 days per week', '5 days per week', '6 days per week']
  },
  {
    id: 'needDietPlan',
    question: 'Do you need a diet plan?',
    options: ['Muscle Gain', 'Fat Loss', 'Maintenance', 'High Protein']
  },
  {
    id: 'needWorkoutPlan',
    question: 'Do you need a workout plan?',
    options: ['Beginner', 'Intermediate', 'Advanced']
  },
  {
    id: 'homeWorkoutAlternatives',
    question: 'Do you want home-workout alternatives?',
    options: ['Dumbbell', 'Resistance Band', 'Bodyweight', 'No Equipment']
  },
]

// 🥗 Food Allergy Categories & Items
interface AllergenCategory {
  title: string
  emoji: string
  items: string[]
}

const ALLERGEN_CATEGORIES: AllergenCategory[] = [
  {
    title: 'Dairy & Animal Products',
    emoji: '🥛',
    items: ['Milk', "Cow's milk", "Goat's milk", 'Casein / Milk protein', 'Whey', 'Egg', 'Egg white', 'Egg yolk']
  },
  {
    title: 'Nuts & Peanuts',
    emoji: '🥜',
    items: ['Peanut', 'Almond', 'Cashew', 'Walnut', 'Pistachio', 'Hazelnut', 'Pecan', 'Macadamia', 'Brazil nut', 'Pine nut', 'Other tree nuts']
  },
  {
    title: 'Grains & Gluten',
    emoji: '🌾',
    items: ['Wheat', 'Gluten', 'Barley', 'Rye', 'Oats', 'Corn / Maize', 'Rice', 'Buckwheat']
  },
  {
    title: 'Legumes & Plant Proteins',
    emoji: '🫘',
    items: ['Soy', 'Chickpeas', 'Lentils', 'Peas', 'Beans', 'Lupin', 'Sesame']
  },
  {
    title: 'Fish & Seafood',
    emoji: '🐟',
    items: ['Fish', 'Salmon', 'Tuna', 'Cod', 'Shellfish', 'Shrimp / Prawns', 'Crab', 'Lobster', 'Mollusks', 'Clams', 'Mussels', 'Oysters', 'Squid']
  },
  {
    title: 'Fruits',
    emoji: '🍎',
    items: ['Apple', 'Banana', 'Strawberry', 'Kiwi', 'Mango', 'Pineapple', 'Avocado', 'Peach', 'Pear', 'Cherry', 'Melon', 'Papaya', 'Other fruit']
  },
  {
    title: 'Vegetables',
    emoji: '🥦',
    items: ['Tomato', 'Potato', 'Carrot', 'Celery', 'Onion', 'Garlic', 'Spinach', 'Other vegetable']
  },
  {
    title: 'Other Common Allergens',
    emoji: '🌿',
    items: ['Mustard', 'Sulfites', 'Yeast', 'Coconut', 'Cocoa / Cacao', 'Gelatin', 'Other']
  }
]

function Toggle({ label, description, defaultChecked = false }: { label: string; description: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 py-4 last:border-0 dark:border-white/5">
      <div>
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{label}</p>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => setChecked(!checked)}
        className={cn('relative h-6 w-11 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-neutral-300 dark:bg-neutral-700')}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { language, setLanguage, t } = useLanguage()
  const { user, updateProfile, logout } = useAuth()
  const { isDark, setTheme } = useTheme()
  const [active, setActive] = useState('account')
  const [languageSaved, setLanguageSaved] = useState(false)

  // Account State
  const [name, setName] = useState(user.name || '')
  const [email, setEmail] = useState(user.email || '')
  const [password, setPassword] = useState(user.password || '')
  const [showPassword, setShowPassword] = useState(false)
  const [age, setAge] = useState(user.age ? String(user.age) : '26')
  const [city, setCity] = useState(user.city || 'San Francisco')
  const [state, setState] = useState(user.state || 'California')
  const [country, setCountry] = useState(user.country || 'United States')
  const [savedSuccess, setSavedSuccess] = useState(false)

  // 🏋️ Gym & Fitness State
  // Map of questionId -> { isYes: boolean, selected: string[], otherText?: string }
  const [fitnessAnswers, setFitnessAnswers] = useState<Record<string, { isYes: boolean; selected: string[]; otherText?: string }>>(() => {
    try {
      const stored = localStorage.getItem('nutriguard_fitness_profile')
      if (stored) return JSON.parse(stored)
    } catch {
      // ignore
    }
    return (user.fitnessProfile as any) || {}
  })
  const [fitnessSaved, setFitnessSaved] = useState(false)

  // 🥗 Food Allergies State — Default is NO allergies (false)
  const [hasAllergies, setHasAllergies] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('nutriguard_allergy_profile')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (typeof parsed.hasAllergies === 'boolean') {
          return parsed.hasAllergies
        }
      }
    } catch {
      // ignore
    }
    return user.allergyProfile?.hasAllergies ?? false
  })
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('nutriguard_allergy_profile')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed.allergens)) {
          return parsed.allergens
        }
      }
    } catch {
      // ignore
    }
    return user.allergyProfile?.allergens || []
  })
  const [otherAllergyText, setOtherAllergyText] = useState(() => {
    try {
      const stored = localStorage.getItem('nutriguard_allergy_profile')
      if (stored) return JSON.parse(stored).otherAllergy || ''
    } catch {
      // ignore
    }
    return user.allergyProfile?.otherAllergy || ''
  })
  const [allergySeverity, setAllergySeverity] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('nutriguard_allergy_profile')
      if (stored) return JSON.parse(stored).severity || 'Moderate'
    } catch {
      // ignore
    }
    return user.allergyProfile?.severity || 'Moderate'
  })
  const [medicallyDiagnosed, setMedicallyDiagnosed] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('nutriguard_allergy_profile')
      if (stored) return JSON.parse(stored).medicallyDiagnosed || 'Yes'
    } catch {
      // ignore
    }
    return user.allergyProfile?.medicallyDiagnosed || 'Yes'
  })
  const [allergySaved, setAllergySaved] = useState(false)

  useEffect(() => {
    setName(user.name)
    setEmail(user.email)
    if (user.password) setPassword(user.password)
    if (user.age) setAge(String(user.age))
    if (user.city) setCity(user.city)
    if (user.state) setState(user.state)
    if (user.country) setCountry(user.country)
  }, [user])

  function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault()
    updateProfile({
      name,
      email,
      password: password.trim() || user.password,
      age: age ? Number(age) : undefined,
      city,
      state,
      country,
    })
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  // Fitness helpers
  function toggleFitnessYes(questionId: string, isYes: boolean) {
    setFitnessAnswers((prev) => ({
      ...prev,
      [questionId]: {
        isYes,
        selected: isYes ? (prev[questionId]?.selected?.length ? prev[questionId].selected : []) : [],
        otherText: prev[questionId]?.otherText || '',
      }
    }))
  }

  function toggleFitnessOption(questionId: string, option: string) {
    setFitnessAnswers((prev) => {
      const curr = prev[questionId] || { isYes: true, selected: [] }
      const exists = curr.selected.includes(option)
      const nextSelected = exists
        ? curr.selected.filter((item) => item !== option)
        : [...curr.selected, option]
      return {
        ...prev,
        [questionId]: {
          ...curr,
          isYes: true,
          selected: nextSelected
        }
      }
    })
  }

  function setFitnessOtherText(questionId: string, text: string) {
    setFitnessAnswers((prev) => {
      const curr = prev[questionId] || { isYes: true, selected: [] }
      return {
        ...prev,
        [questionId]: {
          ...curr,
          otherText: text
        }
      }
    })
  }

  function handleSaveFitness(e?: React.FormEvent) {
    if (e) e.preventDefault()
    try {
      localStorage.setItem('nutriguard_fitness_profile', JSON.stringify(fitnessAnswers))
    } catch {
      // ignore
    }
    updateProfile({ fitnessProfile: fitnessAnswers })
    setFitnessSaved(true)
    setTimeout(() => setFitnessSaved(false), 2500)
  }

  // Allergies helpers
  function toggleAllergen(item: string) {
    setSelectedAllergens((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    )
  }

  function handleSaveAllergies(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const payload = {
      hasAllergies: !!hasAllergies,
      allergens: hasAllergies ? selectedAllergens : [],
      otherAllergy: hasAllergies ? otherAllergyText : '',
      severity: hasAllergies ? allergySeverity : '',
      medicallyDiagnosed: hasAllergies ? medicallyDiagnosed : '',
    }
    try {
      localStorage.setItem('nutriguard_allergy_profile', JSON.stringify(payload))
    } catch {
      // ignore
    }
    updateProfile({ allergyProfile: payload })
    setAllergySaved(true)
    setTimeout(() => setAllergySaved(false), 2500)
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  function handleLanguageChange(newLang: SupportedLanguage) {
    setLanguage(newLang)
    setLanguageSaved(true)
    setTimeout(() => setLanguageSaved(false), 2500)
  }

  const initial = user.name ? user.name.trim().charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Profile Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-darksurface">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-2xl font-bold text-white shadow-md">
            {initial}
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{user.name}</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{user.email}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              {age && <span>Age: <strong className="font-semibold text-neutral-800 dark:text-neutral-200">{age}</strong></span>}
              {city && <span>• <MapPin className="inline h-3 w-3 -mt-0.5 text-primary" /> {city}, {state}, {country}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-center text-xs dark:border-white/10 dark:bg-white/5">
            <span className="block font-semibold text-primary">
              {hasAllergies ? selectedAllergens.length : 0}
            </span>
            <span className="text-[10px] text-neutral-500">
              {hasAllergies && selectedAllergens.length > 0 ? 'Allergens Flagged' : 'No Allergies'}
            </span>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-center text-xs dark:border-white/10 dark:bg-white/5">
            <span className="block font-semibold text-secondary dark:text-blue-400">
              {Object.values(fitnessAnswers).filter((v) => v.isYes).length}
            </span>
            <span className="text-[10px] text-neutral-500">Fitness Goals Active</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Navigation Sidebar */}
        <nav className="flex gap-1 overflow-x-auto md:w-60 md:flex-col md:overflow-visible shrink-0" aria-label="Settings sections">
          {sections.map(({ id, labelKey, fallback, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={cn(
                'flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-left text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/5 transition-colors',
                active === id && 'bg-primary-light/50 text-primary-dark font-semibold dark:bg-primary-dark/30 dark:text-primary-light shadow-2xs'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" /> {t(labelKey) || fallback}
            </button>
          ))}

          <button
            onClick={handleLogout}
            className="mt-4 flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium text-danger hover:bg-danger-light dark:hover:bg-danger-light/10 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" /> {t('nav.logout')}
          </button>
        </nav>

        {/* Content Panels */}
        <div className="flex-1 min-w-0 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-darksurface">
          {/* TAB 1: Account Details & Location */}
          {active === 'account' && (
            <form className="space-y-6" onSubmit={handleSaveAccount}>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Account Information</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Update your personal profile, credentials, and demographic location.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. alex@example.com"
                    required
                  />
                </div>

                <div className="sm:col-span-2 relative">
                  <label className="mb-1 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password or keep unchanged"
                      className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 pr-10 text-sm shadow-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-darkbg dark:text-neutral-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                    Keep empty or default to retain your current password.
                  </p>
                </div>

                <div>
                  <Input
                    label="User Age"
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 26"
                    required
                  />
                </div>
              </div>

              {/* Location Section */}
              <div className="border-t border-neutral-100 pt-5 dark:border-white/5">
                <div className="mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Location (District / City, State, Country)
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <Input
                      label="District / City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai, New York"
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="State / Province"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Maharashtra, California"
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="Country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. India, United States"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Quick links to Fitness & Allergies */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActive('fitness')}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5 text-left transition-all hover:border-primary hover:bg-primary-light/20 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary-dark dark:bg-primary-dark/30 dark:text-primary-light">
                      <Dumbbell className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Gym & Fitness Profile</p>
                      <p className="text-[11px] text-neutral-500">Configure 21 training & diet goals</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                </button>

                <button
                  type="button"
                  onClick={() => setActive('allergies')}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5 text-left transition-all hover:border-primary hover:bg-primary-light/20 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                      <AlertTriangle className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Food Allergies Checklist</p>
                      <p className="text-[11px] text-neutral-500">8 categorized allergen groups</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                </button>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" className="min-w-[140px]">
                  {t('profile.saveChanges')}
                </Button>
                {savedSuccess && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-primary dark:text-primary-light">
                    <Check className="h-4 w-4" /> Account & Location updated successfully!
                  </span>
                )}
              </div>
            </form>
          )}

          {/* TAB 2: 🏋️ Gym & Fitness Conditional Questions */}
          {active === 'fitness' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    🏋️ Gym & Fitness Profile
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Answer conditional questions. Selecting <strong>YES</strong> reveals specific sub-options to tailor recommendations.
                  </p>
                </div>
                <Button onClick={() => handleSaveFitness()} size="sm">
                  Save Fitness Profile
                </Button>
              </div>

              {fitnessSaved && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 flex items-center gap-2">
                  <Check className="h-4 w-4" /> Gym & Fitness choices saved successfully!
                </div>
              )}

              <div className="space-y-4">
                {FITNESS_QUESTIONS.map((q) => {
                  const state = fitnessAnswers[q.id] || { isYes: false, selected: [] }
                  const isYes = state.isYes

                  return (
                    <div
                      key={q.id}
                      className={cn(
                        'rounded-xl border p-4 transition-all',
                        isYes
                          ? 'border-primary/40 bg-primary-light/20 dark:border-primary-dark/40 dark:bg-primary-dark/10'
                          : 'border-neutral-200 bg-white dark:border-white/10 dark:bg-white/[0.02]'
                      )}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          {q.question}
                        </p>

                        <div className="inline-flex rounded-lg border border-neutral-300 p-0.5 bg-neutral-100 dark:border-white/10 dark:bg-darkbg shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleFitnessYes(q.id, false)}
                            className={cn(
                              'rounded-md px-3 py-1 text-xs font-semibold transition-all',
                              !isYes
                                ? 'bg-white text-neutral-800 shadow-xs dark:bg-darksurface dark:text-neutral-200'
                                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
                            )}
                          >
                            No
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleFitnessYes(q.id, true)}
                            className={cn(
                              'rounded-md px-3 py-1 text-xs font-semibold transition-all',
                              isYes
                                ? 'bg-primary text-white shadow-xs'
                                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
                            )}
                          >
                            Yes
                          </button>
                        </div>
                      </div>

                      {/* Revealed Sub-list on YES */}
                      {isYes && (
                        <div className="mt-4 border-t border-primary/20 pt-3 dark:border-white/10">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-primary-dark dark:text-primary-light">
                            Select all that apply:
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {q.options.map((opt) => {
                              const isSelected = state.selected.includes(opt)
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => toggleFitnessOption(q.id, opt)}
                                  className={cn(
                                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                                    isSelected
                                      ? 'border-primary bg-primary text-white shadow-2xs'
                                      : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 dark:border-white/15 dark:bg-darksurface dark:text-neutral-200 dark:hover:border-white/30'
                                  )}
                                >
                                  {isSelected && <Check className="h-3 w-3" />}
                                  <span>{opt}</span>
                                </button>
                              )
                            })}
                          </div>

                          {/* If 'Other' is allowed or selected */}
                          {q.allowCustom && state.selected.includes('Other') && (
                            <div className="mt-3 max-w-sm">
                              <input
                                type="text"
                                value={state.otherText || ''}
                                onChange={(e) => setFitnessOtherText(q.id, e.target.value)}
                                placeholder="Please specify details..."
                                className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-xs shadow-2xs focus:border-primary focus:outline-none dark:border-white/15 dark:bg-darkbg dark:text-neutral-100"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-white/5">
                <span className="text-xs text-neutral-500">
                  {Object.values(fitnessAnswers).filter((v) => v.isYes).length} active fitness preferences selected.
                </span>
                <Button onClick={() => handleSaveFitness()}>Save Fitness Profile</Button>
              </div>
            </div>
          )}

          {/* TAB 3: 🥗 Food Allergies Checklist & Follow-ups */}
          {active === 'allergies' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  🥗 Food Allergies & Intolerances
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  NutriGuard AI automatically scans your saved allergens against every food barcode and label you analyze.
                </p>
              </div>

              {allergySaved && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 flex items-center gap-2">
                  <Check className="h-4 w-4" /> Food allergy profile updated and synchronized!
                </div>
              )}

              {/* Main Question */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-5 dark:border-white/10 dark:bg-white/[0.02]">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Do you have any food allergies?
                </h3>
                <div className="mt-3 flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <input
                      type="radio"
                      name="hasAllergies"
                      checked={hasAllergies === true}
                      onChange={() => setHasAllergies(true)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="font-medium">Yes, I have food allergies</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <input
                      type="radio"
                      name="hasAllergies"
                      checked={hasAllergies === false}
                      onChange={() => setHasAllergies(false)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="font-medium">No allergies</span>
                  </label>
                </div>
              </div>

              {/* If NO -> Clean confirmation */}
              {!hasAllergies && (
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-6 text-emerald-950 shadow-2xs dark:border-emerald-800/30 dark:bg-emerald-950/20 dark:text-emerald-200">
                  <div className="flex items-start gap-3.5">
                    <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div className="space-y-2">
                      <h4 className="text-base font-semibold text-emerald-950 dark:text-emerald-100">
                        No Food Allergies Selected
                      </h4>
                      <p className="text-xs leading-relaxed text-emerald-800/90 dark:text-emerald-300/80">
                        You have indicated that you have no known food allergies or dietary intolerances. NutriGuard AI will score all products standardly without personalized allergen alerts.
                      </p>
                      <div className="flex items-center gap-3 pt-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleSaveAllergies()}
                        >
                          Save Preference
                        </Button>
                        <button
                          type="button"
                          onClick={() => setHasAllergies(true)}
                          className="text-xs font-semibold text-primary hover:underline dark:text-primary-light"
                        >
                          I have allergies to add →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* If YES -> 8 Categorized Allergen Groups */}
              {hasAllergies && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Select all that apply: ({selectedAllergens.length} selected)
                    </p>
                    {selectedAllergens.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedAllergens([])}
                        className="text-xs font-medium text-danger hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {ALLERGEN_CATEGORIES.map((cat) => (
                      <div
                        key={cat.title}
                        className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs dark:border-white/10 dark:bg-darkbg/50"
                      >
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          <span className="text-lg">{cat.emoji}</span>
                          <span>{cat.title}</span>
                        </h4>

                        <div className="grid grid-cols-2 gap-2">
                          {cat.items.map((item) => {
                            const isChecked = selectedAllergens.includes(item)
                            return (
                              <label
                                key={item}
                                className={cn(
                                  'flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-xs transition-colors',
                                  isChecked
                                    ? 'border-primary bg-primary-light/40 text-primary-dark dark:bg-primary-dark/30 dark:text-primary-light font-semibold'
                                    : 'border-neutral-200 hover:bg-neutral-50 dark:border-white/10 dark:hover:bg-white/5 dark:text-neutral-300'
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleAllergen(item)}
                                  className="h-3.5 w-3.5 rounded accent-primary"
                                />
                                <span className="truncate">{item}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ✏️ Other Allergy Custom Input */}
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-darkbg/50">
                    <label className="block text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      ✏️ Other allergy:
                    </label>
                    <input
                      type="text"
                      value={otherAllergyText}
                      onChange={(e) => setOtherAllergyText(e.target.value)}
                      placeholder="e.g. Specific food coloring, preservative, or seed..."
                      className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm shadow-2xs focus:border-primary focus:outline-none dark:border-white/10 dark:bg-darksurface dark:text-neutral-100"
                    />
                  </div>

                  {/* Follow-up Questions Card */}
                  <div className="grid grid-cols-1 gap-5 rounded-xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/30 dark:bg-amber-950/20 sm:grid-cols-2">
                    {/* Severity */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                        How severe is your allergy?
                      </h4>
                      <div className="mt-3 space-y-2">
                        {['Mild', 'Moderate', 'Severe', 'Anaphylaxis', 'Not sure'].map((sev) => (
                          <label key={sev} className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-neutral-800 dark:text-neutral-200">
                            <input
                              type="radio"
                              name="allergySeverity"
                              checked={allergySeverity === sev}
                              onChange={() => setAllergySeverity(sev)}
                              className="h-3.5 w-3.5 accent-amber-600"
                            />
                            <span>{sev}</span>
                            {sev === 'Anaphylaxis' && (
                              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
                                Emergency risk
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Medical Diagnosis */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                        Have you been medically diagnosed with these allergies?
                      </h4>
                      <div className="mt-3 space-y-2">
                        {['Yes', 'No', 'Not sure'].map((diag) => (
                          <label key={diag} className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-neutral-800 dark:text-neutral-200">
                            <input
                              type="radio"
                              name="medicallyDiagnosed"
                              checked={medicallyDiagnosed === diag}
                              onChange={() => setMedicallyDiagnosed(diag)}
                              className="h-3.5 w-3.5 accent-amber-600"
                            />
                            <span>{diag}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-white/5">
                    <span className="text-xs text-neutral-500">
                      {selectedAllergens.length} allergen(s) selected with {allergySeverity} severity.
                    </span>
                    <Button onClick={() => handleSaveAllergies()}>Save Allergies Profile</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Appearance */}
          {active === 'appearance' && (
            <div>
              <h2 className="mb-4 text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('profile.appearance')}</h2>
              <div className="flex items-center justify-between rounded-xl border border-neutral-200 p-4 dark:border-white/10 dark:bg-white/[0.02]">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{t('profile.darkMode')}</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Switch between light and dark color schemes across the app.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={cn(
                      'flex h-10 w-16 items-center justify-center rounded-lg border-2 bg-white transition-all shadow-xs',
                      !isDark ? 'border-primary ring-2 ring-primary/20' : 'border-neutral-300 hover:border-neutral-400'
                    )}
                    aria-label="Light mode"
                    title="Light mode"
                  >
                    <Sun className={cn('h-4 w-4', !isDark ? 'text-primary' : 'text-neutral-400')} />
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={cn(
                      'flex h-10 w-16 items-center justify-center rounded-lg border-2 bg-neutral-900 transition-all shadow-xs',
                      isDark ? 'border-primary ring-2 ring-primary/20' : 'border-neutral-700 hover:border-neutral-500'
                    )}
                    aria-label="Dark mode"
                    title="Dark mode"
                  >
                    <Moon className={cn('h-4 w-4', isDark ? 'text-primary-light' : 'text-neutral-400')} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Language */}
          {active === 'language' && (
            <div>
              <h2 className="mb-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('profile.language')}</h2>
              <p className="mb-4 text-xs text-neutral-600 dark:text-neutral-400">{t('profile.selectLanguage')}</p>
              <div className="flex flex-col gap-4 max-w-md">
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                  className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs dark:bg-darkbg dark:border-white/10 dark:text-neutral-100 font-medium"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.nativeName} — {l.label}
                    </option>
                  ))}
                </select>

                {languageSaved && (
                  <p className="flex items-center gap-1 text-xs text-primary-dark dark:text-primary-light font-medium">
                    <Check className="h-3.5 w-3.5" /> Language preference saved and active!
                  </p>
                )}

                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => handleLanguageChange(l.code)}
                      className={cn(
                        'flex items-center gap-2 rounded-md border p-2.5 text-left text-xs transition-all shadow-2xs',
                        language === l.code
                          ? 'border-primary bg-primary-light/40 text-primary-dark dark:bg-primary-dark/30 dark:text-primary-light font-semibold ring-2 ring-primary/20'
                          : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-white/10 dark:bg-darkbg dark:text-neutral-300 dark:hover:border-white/20'
                      )}
                    >
                      <span className="text-base leading-none">{l.flag}</span>
                      <div className="truncate">
                        <p className="font-medium truncate">{l.nativeName}</p>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">{l.label}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Notifications */}
          {active === 'notifications' && (
            <div>
              <h2 className="mb-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">Notifications</h2>
              <Toggle label="Scan complete" description="Notify me when an AI analysis finishes." defaultChecked />
              <Toggle label="Weekly digest" description="A summary of your scan activity every week." />
              <Toggle label="New ban alerts" description="Alert me if a saved ingredient becomes newly restricted." defaultChecked />
            </div>
          )}

          {/* TAB 7: Privacy & Data */}
          {active === 'privacy' && (
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Privacy & Data</h2>
              <div className="flex items-center justify-between rounded-xl border border-neutral-200 p-4 dark:border-white/10 dark:bg-white/[0.02]">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Download my data</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Export all your scans and account data as a file.</p>
                </div>
                <Button variant="secondary" size="sm">Download</Button>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-danger/20 bg-danger-light/40 dark:bg-danger-light/10 p-4">
                <div>
                  <p className="text-sm font-medium text-danger">Delete account</p>
                  <p className="text-xs text-red-800 dark:text-red-300">Permanently remove your account and scan history.</p>
                </div>
                <Button variant="destructive" size="sm">Delete</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
