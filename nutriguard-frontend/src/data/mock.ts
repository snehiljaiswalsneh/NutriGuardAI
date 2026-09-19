import { Analysis, Ingredient, NutritionFact } from './types'

export const sodiumNitrite: Ingredient = {
  id: 'sodium-nitrite',
  name: 'Sodium Nitrite',
  scientificName: 'NaNO2 (E250)',
  risk: 'high',
  reason: 'Linked to nitrosamine formation when cooked at high heat',
  purpose: 'Preservative and color fixative used in cured/processed meats',
  description:
    'Sodium Nitrite is a curing agent added to processed meats to prevent bacterial growth (notably botulism) and preserve a pink color. Under high-heat cooking, it can react with proteins to form nitrosamines.',
  healthEffects: [
    'Nitrosamine formation has been associated with increased cancer risk in long-term studies',
    'May trigger headaches or sensitivity reactions in a small subset of individuals',
    'Generally considered safe at regulated levels for occasional consumption',
  ],
  countries: [
    { country: 'United States', flag: '🇺🇸', status: 'Approved' },
    { country: 'European Union', flag: '🇪🇺', status: 'Restricted' },
    { country: 'India', flag: '🇮🇳', status: 'Approved' },
  ],
  alternatives: [
    { id: 'alt-1', name: 'Celery Powder Cured Bacon', scoreDelta: 18, reason: 'Uses naturally-occurring nitrates at lower concentration' },
    { id: 'alt-2', name: 'Nitrate-Free Deli Turkey', scoreDelta: 24, reason: 'No added nitrites or nitrates' },
  ],
  sources: [
    { label: 'WHO — Processed meat and cancer risk', url: 'https://www.who.int' },
    { label: 'FDA — Food Additive Status List', url: 'https://www.fda.gov' },
  ],
}

export const citricAcid: Ingredient = {
  id: 'citric-acid',
  name: 'Citric Acid',
  scientificName: 'C6H8O7 (E330)',
  risk: 'safe',
  reason: 'Naturally occurring acid, widely recognized as safe',
  purpose: 'Flavor enhancer and natural preservative',
  description:
    'Citric Acid occurs naturally in citrus fruits and is manufactured industrially for use as a flavoring and preservative. It is one of the most widely used and well-studied food additives.',
  healthEffects: ['No significant health concerns at typical dietary levels', 'Generally recognized as safe (GRAS) by most regulators worldwide'],
  countries: [
    { country: 'United States', flag: '🇺🇸', status: 'Approved' },
    { country: 'European Union', flag: '🇪🇺', status: 'Approved' },
    { country: 'India', flag: '🇮🇳', status: 'Approved' },
  ],
  alternatives: [],
  sources: [{ label: 'EFSA — Re-evaluation of citric acid', url: 'https://www.efsa.europa.eu' }],
}

export const tartrazine: Ingredient = {
  id: 'tartrazine',
  name: 'Tartrazine',
  scientificName: 'C16H9N4Na3O9S2 (E102)',
  risk: 'moderate',
  reason: 'Synthetic dye linked to hyperactivity in sensitive children',
  purpose: 'Yellow food coloring',
  description:
    'Tartrazine is a synthetic azo dye used to give foods a lemon-yellow color. Several regulators require warning labels due to its association with behavioral effects in some children.',
  healthEffects: [
    'Associated with hyperactivity in some children (UK Food Standards Agency study)',
    'May cause allergic-type reactions in individuals with aspirin sensitivity',
  ],
  countries: [
    { country: 'United States', flag: '🇺🇸', status: 'Approved' },
    { country: 'European Union', flag: '🇪🇺', status: 'Restricted' },
    { country: 'Norway', flag: '🇳🇴', status: 'Banned' },
  ],
  alternatives: [{ id: 'alt-3', name: 'Turmeric & Beta-Carotene Colored Snack', scoreDelta: 15, reason: 'Uses natural plant-based coloring' }],
  sources: [{ label: 'UK FSA — Southampton study on food colors', url: 'https://www.food.gov.uk' }],
}

export const mockAnalysis: Analysis = {
  id: 'scan-1001',
  productName: 'Classic Cured Beef Jerky',
  brand: 'TrailSnax',
  scanDate: '2026-07-28',
  safetyScore: 62,
  verdict: 'Moderate Risk',
  aiSummary:
    'This product contains one high-risk preservative (Sodium Nitrite) that forms nitrosamines under high heat, and one moderate-risk synthetic dye (Tartrazine). Most remaining ingredients, including Citric Acid, are well-tolerated. Consider a nitrate-free alternative if you eat cured meats frequently.',
  allergyWarning: 'Contains soy and may contain traces of tree nuts.',
  ingredients: [sodiumNitrite, tartrazine, citricAcid],
  nutritionProfile: {
    calories: 180,
    servingSize: '30g (1 oz)',
    macros: [
      { name: 'Total Fat', amount: '3', unit: 'g', dailyValue: 4, badFor: ['Fat Loss', 'Obesity'] },
      { name: 'Saturated Fat', amount: '1', unit: 'g', dailyValue: 5, badFor: ['Heart Disease', 'High Cholesterol'] },
      { name: 'Sodium', amount: '590', unit: 'mg', dailyValue: 26, badFor: ['High Blood Pressure', 'Kidney Issues'] },
      { name: 'Total Carbohydrate', amount: '6', unit: 'g', dailyValue: 2, badFor: ['Diabetes', 'Fat Loss'] },
      { name: 'Total Sugars', amount: '4', unit: 'g', dailyValue: 0, badFor: ['Diabetes', 'Fat Loss', 'Obesity'] },
      { name: 'Protein', amount: '21', unit: 'g', dailyValue: 42, goodFor: ['Muscle Gain', 'Strength', 'Endurance'], benefitLabel: 'High-protein — supports muscle recovery' },
    ],
    vitamins: [
      { name: 'Vitamin B12', amount: '1.8', unit: 'mcg', dailyValue: 75, goodFor: ['Endurance', 'General Fitness'], benefitLabel: 'Supports red blood cell formation' },
      { name: 'Vitamin B6', amount: '0.4', unit: 'mg', dailyValue: 24, goodFor: ['Muscle Gain', 'Endurance'], benefitLabel: 'Aids protein metabolism' },
      { name: 'Niacin (B3)', amount: '5', unit: 'mg', dailyValue: 31, goodFor: ['Endurance', 'General Fitness'], benefitLabel: 'Supports energy release from nutrients' },
      { name: 'Vitamin D', amount: '0', unit: 'IU', dailyValue: 0 },
      { name: 'Vitamin C', amount: '0', unit: 'mg', dailyValue: 0 },
    ],
    minerals: [
      { name: 'Iron', amount: '2.2', unit: 'mg', dailyValue: 12, goodFor: ['Endurance', 'Strength'], benefitLabel: 'Supports oxygen transport in blood' },
      { name: 'Zinc', amount: '4', unit: 'mg', dailyValue: 36, goodFor: ['Muscle Gain', 'Strength'], benefitLabel: 'Essential for muscle repair & immunity' },
      { name: 'Phosphorus', amount: '170', unit: 'mg', dailyValue: 14, goodFor: ['Strength', 'Muscle Gain'], benefitLabel: 'Supports bone health and energy production' },
      { name: 'Potassium', amount: '320', unit: 'mg', dailyValue: 7, goodFor: ['Endurance', 'Cardio'], benefitLabel: 'Regulates muscle contractions' },
      { name: 'Magnesium', amount: '18', unit: 'mg', dailyValue: 4 },
    ],
  },
}

export const mockAnalysisB: Analysis = {
  id: 'scan-1002',
  productName: 'Nitrate-Free Turkey Jerky',
  brand: 'PureTrail',
  scanDate: '2026-07-29',
  safetyScore: 89,
  verdict: 'Safe',
  aiSummary:
    'This product uses celery powder as a natural nitrate source instead of synthetic sodium nitrite, and contains no artificial dyes. Overall a substantially safer option for regular consumption.',
  ingredients: [citricAcid],
  nutritionProfile: {
    calories: 150,
    servingSize: '30g (1 oz)',
    macros: [
      { name: 'Total Fat', amount: '1.5', unit: 'g', dailyValue: 2, goodFor: ['Fat Loss'] },
      { name: 'Sodium', amount: '360', unit: 'mg', dailyValue: 16, badFor: ['High Blood Pressure'] },
      { name: 'Total Carbohydrate', amount: '4', unit: 'g', dailyValue: 1 },
      { name: 'Total Sugars', amount: '2', unit: 'g', dailyValue: 0 },
      { name: 'Protein', amount: '24', unit: 'g', dailyValue: 48, goodFor: ['Muscle Gain', 'Strength', 'Endurance'], benefitLabel: 'Excellent protein source for muscle growth' },
    ],
    vitamins: [
      { name: 'Vitamin B12', amount: '2', unit: 'mcg', dailyValue: 83, goodFor: ['Endurance'], benefitLabel: 'Vital for energy production' },
      { name: 'Niacin (B3)', amount: '7', unit: 'mg', dailyValue: 44, goodFor: ['Endurance', 'General Fitness'] },
    ],
    minerals: [
      { name: 'Zinc', amount: '3', unit: 'mg', dailyValue: 27, goodFor: ['Muscle Gain'], benefitLabel: 'Boosts immunity and muscle repair' },
      { name: 'Potassium', amount: '400', unit: 'mg', dailyValue: 9, goodFor: ['Endurance', 'Cardio'] },
    ],
  },
}

export const scanHistory: Analysis[] = [
  mockAnalysis,
  mockAnalysisB,
  {
    id: 'scan-1000',
    productName: 'Rainbow Fruit Gummies',
    brand: 'SweetBurst',
    scanDate: '2026-07-20',
    safetyScore: 41,
    verdict: 'High Risk',
    aiSummary: 'Contains three synthetic dyes including Tartrazine, and added preservatives with limited nutritional value.',
    ingredients: [tartrazine],
  },
  {
    id: 'scan-0998',
    productName: 'Organic Rolled Oats',
    brand: 'FieldHarvest',
    scanDate: '2026-07-11',
    safetyScore: 96,
    verdict: 'Safe',
    aiSummary: 'A minimally processed whole-grain product with no additives of concern.',
    ingredients: [citricAcid],
  },
]

const SCANS_STORAGE_KEY = 'nutriguard_scans'
const DELETED_SCANS_KEY = 'nutriguard_deleted_scan_ids'
const LATEST_SCAN_KEY = 'nutriguard_latest_scan_id'

function getDeletedScanIds(): Set<string> {
  try {
    if (typeof window === 'undefined') return new Set()
    const raw = localStorage.getItem(DELETED_SCANS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return new Set(parsed)
    }
  } catch {
    // ignore
  }
  return new Set()
}

function saveDeletedScanIds(set: Set<string>): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DELETED_SCANS_KEY, JSON.stringify(Array.from(set)))
    }
  } catch {
    // ignore
  }
}

export function enrichNutritionProfile(scan: Analysis): Analysis {
  // If safety score < 95, guarantee at least 1 and maximum 3 core-identical alternatives with higher safety score
  if (scan.safetyScore < 95 && scan.ingredients?.length) {
    const existingAlts = scan.ingredients.flatMap((i) => i.alternatives ?? [])
    if (existingAlts.length === 0) {
      const coreIngs = scan.ingredients
        .filter((i) => !/preservative|color|dye|nitrite|flavor|oil|syrup|shortening|additive/i.test(`${i.name} ${i.purpose ?? ''} ${i.reason ?? ''}`))
        .map((i) => i.name)
      const coreDesc = coreIngs.length > 0 ? coreIngs.slice(0, 3).join(' & ') : scan.productName
      scan.ingredients[0]!.alternatives = [
        {
          id: `alt-enrich-1-${scan.id}`,
          name: `Cold-Pressed Olive Oil & Natural Spiced ${scan.productName}`,
          scoreDelta: Math.min(12, Math.max(7, 96 - scan.safetyScore)),
          reason: `Retains 100% identical core ingredients (${coreDesc}), replacing refined cooking oils with cold-pressed olive oil & whole spices.`,
        },
        {
          id: `alt-enrich-2-${scan.id}`,
          name: `Low-Sodium Himalayan Pink Salt ${scan.productName}`,
          scoreDelta: Math.min(15, Math.max(9, 97 - scan.safetyScore)),
          reason: `Preserves identical core (${coreDesc}) while swapping commercial table salt with unrefined mineral salt.`,
        },
        {
          id: `alt-enrich-3-${scan.id}`,
          name: `Probiotic-Marinated Slow-Dum Clean ${scan.productName}`,
          scoreDelta: Math.min(18, Math.max(11, 98 - scan.safetyScore)),
          reason: `Uses identical ${coreDesc} marinated in organic probiotic yogurt with zero chemical tenderizers or synthetic colors.`,
        },
      ]
    }
  }

  if (scan.nutritionProfile && scan.nutritionProfile.macros?.length) {
    return scan
  }

  const nameLower = (scan.productName || '').toLowerCase()
  const ingText = (scan.ingredients || []).map((i) => `${i.name} ${i.description ?? ''}`).join(' ').toLowerCase()

  let calories = 140
  let servingSize = '1 serving'
  const macros: NutritionFact[] = []
  const vitamins: NutritionFact[] = []
  const minerals: NutritionFact[] = []

  if (nameLower.includes('ice cream') || nameLower.includes('gelato') || nameLower.includes('frozen dessert') || nameLower.includes('jerry')) {
    calories = 340
    servingSize = '2/3 cup (142g)'
    macros.push(
      { name: 'Protein', amount: '6', unit: 'g', dailyValue: 12, goodFor: ['General Fitness'] },
      { name: 'Total Fat', amount: '20', unit: 'g', dailyValue: 26, badFor: ['Fat Loss'] },
      { name: 'Saturated Fat', amount: '12', unit: 'g', dailyValue: 60, badFor: ['Heart Disease', 'High Cholesterol'] },
      { name: 'Total Carbohydrates', amount: '36', unit: 'g', dailyValue: 13 },
      { name: 'Dietary Fiber', amount: '1', unit: 'g', dailyValue: 4 },
      { name: 'Total Sugars', amount: '31', unit: 'g', dailyValue: 62, badFor: ['Diabetes', 'Fat Loss', 'Obesity'] },
      { name: 'Sodium', amount: '95', unit: 'mg', dailyValue: 4 }
    )
    vitamins.push(
      { name: 'Vitamin A', amount: '140', unit: 'mcg', dailyValue: 16 },
      { name: 'Vitamin D', amount: '1.4', unit: 'mcg', dailyValue: 14 },
      { name: 'Vitamin B12', amount: '0.7', unit: 'mcg', dailyValue: 29 }
    )
    minerals.push(
      { name: 'Calcium', amount: '180', unit: 'mg', dailyValue: 18, goodFor: ['Strength', 'General Fitness'], benefitLabel: 'Dairy calcium supports bone density' },
      { name: 'Phosphorus', amount: '145', unit: 'mg', dailyValue: 12 },
      { name: 'Potassium', amount: '260', unit: 'mg', dailyValue: 6 }
    )
  } else if (nameLower.includes('milk') || (ingText.includes('milk') && !ingText.includes('ice cream')) || ingText.includes('dairy')) {
    calories = 150
    servingSize = '1 cup (240ml)'
    macros.push(
      { name: 'Protein', amount: '8', unit: 'g', dailyValue: 16, goodFor: ['Muscle Gain', 'General Fitness'], benefitLabel: 'Complete dairy protein (casein & whey)' },
      { name: 'Total Fat', amount: '8', unit: 'g', dailyValue: 10 },
      { name: 'Saturated Fat', amount: '5', unit: 'g', dailyValue: 25, badFor: ['Heart Disease', 'High Cholesterol'] },
      { name: 'Total Carbohydrates', amount: '12', unit: 'g', dailyValue: 4 },
      { name: 'Total Sugars', amount: '11', unit: 'g', dailyValue: 0 },
      { name: 'Sodium', amount: '120', unit: 'mg', dailyValue: 5 }
    )
    vitamins.push(
      { name: 'Vitamin B12', amount: '1.2', unit: 'mcg', dailyValue: 50, goodFor: ['Endurance', 'General Fitness'], benefitLabel: 'Essential for nerve function & energy' },
      { name: 'Vitamin D', amount: '2.5', unit: 'mcg', dailyValue: 25, goodFor: ['Strength'], benefitLabel: 'Promotes calcium absorption & bone density' },
      { name: 'Vitamin A', amount: '150', unit: 'mcg', dailyValue: 17 }
    )
    minerals.push(
      { name: 'Calcium', amount: '300', unit: 'mg', dailyValue: 30, goodFor: ['Strength', 'General Fitness'], benefitLabel: 'High calcium supports bone & muscle contractions' },
      { name: 'Phosphorus', amount: '240', unit: 'mg', dailyValue: 19, goodFor: ['Muscle Gain'] },
      { name: 'Potassium', amount: '350', unit: 'mg', dailyValue: 8, goodFor: ['Cardio', 'Endurance'] }
    )
  } else if (nameLower.includes('bar') || nameLower.includes('keto') || nameLower.includes('protein')) {
    calories = 210
    servingSize = '1 bar (60g)'
    macros.push(
      { name: 'Protein', amount: '20', unit: 'g', dailyValue: 40, goodFor: ['Muscle Gain', 'Strength', 'Endurance'], benefitLabel: 'High-protein blend for muscle repair' },
      { name: 'Total Fat', amount: '9', unit: 'g', dailyValue: 12, goodFor: ['Fat Loss', 'Keto'] },
      { name: 'Dietary Fiber', amount: '10', unit: 'g', dailyValue: 36, goodFor: ['Fat Loss', 'General Fitness'], benefitLabel: 'Prebiotic fiber promotes satiety' },
      { name: 'Total Carbohydrate', amount: '14', unit: 'g', dailyValue: 5 },
      { name: 'Total Sugars', amount: '2', unit: 'g', dailyValue: 0, goodFor: ['Fat Loss'] },
      { name: 'Sodium', amount: '180', unit: 'mg', dailyValue: 8 }
    )
    vitamins.push(
      { name: 'Vitamin B6', amount: '0.5', unit: 'mg', dailyValue: 30, goodFor: ['Muscle Gain'], benefitLabel: 'Aids amino acid synthesis' },
      { name: 'Vitamin E', amount: '4', unit: 'mg', dailyValue: 27, goodFor: ['General Fitness'] },
      { name: 'Niacin (B3)', amount: '4', unit: 'mg', dailyValue: 25, goodFor: ['Endurance'] }
    )
    minerals.push(
      { name: 'Iron', amount: '3', unit: 'mg', dailyValue: 17, goodFor: ['Endurance', 'Strength'] },
      { name: 'Zinc', amount: '2.5', unit: 'mg', dailyValue: 23, goodFor: ['Muscle Gain'] },
      { name: 'Magnesium', amount: '60', unit: 'mg', dailyValue: 14, goodFor: ['Muscle Gain'] }
    )

  } else if (nameLower.includes('chocolate') || nameLower.includes('rocher') || nameLower.includes('candy') || ingText.includes('cocoa') || ingText.includes('chocolate')) {
    calories = 220
    servingSize = '3 pieces (38g)'
    macros.push(
      { name: 'Protein', amount: '3', unit: 'g', dailyValue: 6, goodFor: ['General Fitness'] },
      { name: 'Total Fat', amount: '16', unit: 'g', dailyValue: 21, badFor: ['Heart Disease', 'Fat Loss'] },
      { name: 'Saturated Fat', amount: '6', unit: 'g', dailyValue: 30, badFor: ['Heart Disease', 'High Cholesterol'] },
      { name: 'Total Carbohydrate', amount: '18', unit: 'g', dailyValue: 7 },
      { name: 'Dietary Fiber', amount: '1.5', unit: 'g', dailyValue: 5 },
      { name: 'Total Sugars', amount: '15', unit: 'g', dailyValue: 0, badFor: ['Diabetes', 'Fat Loss', 'Obesity'] },
      { name: 'Sodium', amount: '40', unit: 'mg', dailyValue: 2 }
    )
    vitamins.push(
      { name: 'Vitamin E', amount: '2.1', unit: 'mg', dailyValue: 14, goodFor: ['General Fitness'] },
      { name: 'Vitamin B12', amount: '0.2', unit: 'mcg', dailyValue: 8 },
      { name: 'Vitamin A', amount: '15', unit: 'mcg', dailyValue: 2 }
    )
    minerals.push(
      { name: 'Magnesium', amount: '32', unit: 'mg', dailyValue: 8, goodFor: ['Muscle Gain'] },
      { name: 'Iron', amount: '1.2', unit: 'mg', dailyValue: 7 },
      { name: 'Calcium', amount: '50', unit: 'mg', dailyValue: 5 },
      { name: 'Potassium', amount: '160', unit: 'mg', dailyValue: 3 }
    )
  } else if (nameLower.includes('biryani') || nameLower.includes('chicken') || ingText.includes('chicken') || ingText.includes('meat') || ingText.includes('rice')) {
    calories = 190
    servingSize = '1 cup (200g)'
    macros.push(
      { name: 'Protein', amount: '18', unit: 'g', dailyValue: 36, goodFor: ['Muscle Gain', 'Strength', 'Endurance'], benefitLabel: 'High complete poultry protein' },
      { name: 'Total Fat', amount: '6', unit: 'g', dailyValue: 8 },
      { name: 'Saturated Fat', amount: '1.5', unit: 'g', dailyValue: 8 },
      { name: 'Total Carbohydrate', amount: '24', unit: 'g', dailyValue: 9 },
      { name: 'Dietary Fiber', amount: '2.5', unit: 'g', dailyValue: 9, goodFor: ['General Fitness'] },
      { name: 'Total Sugars', amount: '1', unit: 'g', dailyValue: 0 },
      { name: 'Sodium', amount: '380', unit: 'mg', dailyValue: 16 }
    )
    vitamins.push(
      { name: 'Vitamin B12', amount: '1.4', unit: 'mcg', dailyValue: 58, goodFor: ['Endurance', 'General Fitness'], benefitLabel: 'Aids red blood cell production' },
      { name: 'Vitamin B6', amount: '0.5', unit: 'mg', dailyValue: 29, goodFor: ['Muscle Gain'], benefitLabel: 'Essential protein cofactor' },
      { name: 'Niacin (B3)', amount: '6.2', unit: 'mg', dailyValue: 39, goodFor: ['Endurance'] }
    )
    minerals.push(
      { name: 'Phosphorus', amount: '210', unit: 'mg', dailyValue: 17, goodFor: ['Muscle Gain'] },
      { name: 'Zinc', amount: '1.6', unit: 'mg', dailyValue: 15, goodFor: ['Strength'] },
      { name: 'Iron', amount: '1.8', unit: 'mg', dailyValue: 10 },
      { name: 'Potassium', amount: '310', unit: 'mg', dailyValue: 7, goodFor: ['Cardio'] }
    )
  } else {
    calories = 160
    servingSize = '1 serving (100g)'
    macros.push(
      { name: 'Protein', amount: '12', unit: 'g', dailyValue: 24, goodFor: ['Muscle Gain', 'General Fitness'] },
      { name: 'Total Fat', amount: '4', unit: 'g', dailyValue: 5 },
      { name: 'Total Carbohydrate', amount: '18', unit: 'g', dailyValue: 6 },
      { name: 'Dietary Fiber', amount: '4', unit: 'g', dailyValue: 14, goodFor: ['Fat Loss'] },
      { name: 'Total Sugars', amount: '3', unit: 'g', dailyValue: 0 },
      { name: 'Sodium', amount: '220', unit: 'mg', dailyValue: 10 }
    )
    vitamins.push(
      { name: 'Vitamin B12', amount: '1.0', unit: 'mcg', dailyValue: 42, goodFor: ['Endurance'] },
      { name: 'Vitamin C', amount: '15', unit: 'mg', dailyValue: 17, goodFor: ['General Fitness'] },
      { name: 'Vitamin B6', amount: '0.3', unit: 'mg', dailyValue: 18, goodFor: ['Muscle Gain'] }
    )
    minerals.push(
      { name: 'Iron', amount: '2.0', unit: 'mg', dailyValue: 11, goodFor: ['Endurance'] },
      { name: 'Zinc', amount: '2.0', unit: 'mg', dailyValue: 18, goodFor: ['Strength'] },
      { name: 'Potassium', amount: '280', unit: 'mg', dailyValue: 6, goodFor: ['Cardio'] }
    )
  }

  return {
    ...scan,
    nutritionProfile: {
      calories,
      servingSize,
      macros,
      vitamins,
      minerals,
    },
  }
}

export function getStoredDynamicScans(): Analysis[] {
  try {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(SCANS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        // Strip out stale COCA COLA scans and the erroneous duplicate Red Bull scan (id: scan-1789794009678, score 95)
        const filtered = parsed.filter(
          (s) =>
            s.productName !== 'COCA COLA' &&
            s.id !== 'scan-1789156513366' &&
            s.id !== 'scan-1789794009678' &&
            !(s.productName?.toLowerCase().includes('red bull') && s.safetyScore > 80)
        )

        // Deduplicate by normalized product name, keeping the scan with richer nutritional/ingredient details
        const seen = new Map<string, Analysis>()
        for (const s of filtered) {
          const norm = (s.productName || '').trim().toLowerCase()
          if (!norm) continue
          if (!seen.has(norm)) {
            seen.set(norm, s)
          } else {
            const existing = seen.get(norm)!
            const sRichness = (s.nutritionProfile?.macros?.length || 0) + (s.ingredients?.length || 0)
            const exRichness = (existing.nutritionProfile?.macros?.length || 0) + (existing.ingredients?.length || 0)
            if (sRichness > exRichness) {
              seen.set(norm, s)
            }
          }
        }

        const cleaned = Array.from(seen.values())
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(cleaned))
        }
        return cleaned.map(enrichNutritionProfile)
      }
    }
  } catch {
    // ignore
  }
  return []
}

export function saveAnalysis(analysis: Analysis): void {
  try {
    const deleted = getDeletedScanIds()
    if (deleted.has(analysis.id)) {
      deleted.delete(analysis.id)
      saveDeletedScanIds(deleted)
    }

    const current = getStoredDynamicScans()
    const norm = (analysis.productName || '').trim().toLowerCase()
    const updated = [
      analysis,
      ...current.filter((s) => s.id !== analysis.id && (s.productName || '').trim().toLowerCase() !== norm),
    ]
    if (typeof window !== 'undefined') {
      localStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(updated))
      localStorage.setItem(LATEST_SCAN_KEY, analysis.id)
    }
  } catch {
    // ignore
  }
}

export function deleteScan(id: string): void {
  try {
    // 1. Add to deleted scan IDs so neither mock nor cached scans reappear
    const deleted = getDeletedScanIds()
    deleted.add(id)
    saveDeletedScanIds(deleted)

    // 2. Remove from localStorage dynamic scans
    const current = getStoredDynamicScans()
    const updated = current.filter((s) => s.id !== id)
    if (typeof window !== 'undefined') {
      localStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(updated))
    }
  } catch {
    // ignore
  }
}

export function clearAllScans(): void {
  try {
    const all = getAllScans()
    const deleted = getDeletedScanIds()
    for (const s of all) {
      deleted.add(s.id)
    }
    saveDeletedScanIds(deleted)

    if (typeof window !== 'undefined') {
      localStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify([]))
    }
  } catch {
    // ignore
  }
}

export function mergeScans(scans: Analysis[]): void {
  try {
    const deleted = getDeletedScanIds()
    const current = getStoredDynamicScans()
    const nameMap = new Map<string, Analysis>()

    for (const s of current) {
      if (
        !deleted.has(s.id) &&
        s.productName !== 'COCA COLA' &&
        s.id !== 'scan-1789156513366' &&
        s.id !== 'scan-1789794009678' &&
        !(s.productName?.toLowerCase().includes('red bull') && s.safetyScore > 80)
      ) {
        const norm = (s.productName || '').trim().toLowerCase()
        if (norm) nameMap.set(norm, s)
      }
    }

    for (const s of scans) {
      if (
        !deleted.has(s.id) &&
        s.productName !== 'COCA COLA' &&
        s.id !== 'scan-1789156513366' &&
        s.id !== 'scan-1789794009678' &&
        !(s.productName?.toLowerCase().includes('red bull') && s.safetyScore > 80)
      ) {
        const norm = (s.productName || '').trim().toLowerCase()
        if (!norm) continue
        if (!nameMap.has(norm)) {
          nameMap.set(norm, enrichNutritionProfile(s))
        } else {
          const existing = nameMap.get(norm)!
          const sRichness = (s.nutritionProfile?.macros?.length || 0) + (s.ingredients?.length || 0)
          const exRichness = (existing.nutritionProfile?.macros?.length || 0) + (existing.ingredients?.length || 0)
          if (sRichness > exRichness || s.id === existing.id) {
            nameMap.set(norm, enrichNutritionProfile(s))
          }
        }
      }
    }

    if (typeof window !== 'undefined') {
      const merged = Array.from(nameMap.values())
      localStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(merged))
    }
  } catch {
    // ignore
  }
}

export function getLatestAnalysis(): Analysis {
  try {
    if (typeof window !== 'undefined') {
      const latestId = localStorage.getItem(LATEST_SCAN_KEY)
      if (latestId && latestId !== 'scan-1789156513366') {
        const found = getAnalysisById(latestId)
        if (found && found.productName !== 'COCA COLA') return found
      }
    }
  } catch {
    // ignore
  }

  // Fallback to flagship mockAnalysis (TrailSnax Classic Cured Beef Jerky) with full rich nutrition
  return mockAnalysis
}

export function getAllScans(): Analysis[] {
  const deleted = getDeletedScanIds()
  const dynamic = getStoredDynamicScans().filter((s) => !deleted.has(s.id))
  const nameMap = new Map<string, Analysis>()

  for (const s of dynamic) {
    const norm = (s.productName || '').trim().toLowerCase()
    if (norm) nameMap.set(norm, s)
  }

  for (const s of scanHistory) {
    const norm = (s.productName || '').trim().toLowerCase()
    if (!deleted.has(s.id) && !nameMap.has(norm) && s.productName !== 'COCA COLA') {
      nameMap.set(norm, enrichNutritionProfile(s))
    }
  }

  return Array.from(nameMap.values())
}

export function getAnalysisById(id: string): Analysis | undefined {
  const all = getAllScans()
  const found = all.find((a) => a.id === id)
  return found ? enrichNutritionProfile(found) : undefined
}

export function getIngredientById(id: string): Ingredient | undefined {
  // 1. Search static catalog
  const staticFound = [sodiumNitrite, citricAcid, tartrazine].find((i) => i.id === id)
  if (staticFound) return staticFound

  // 2. Search all scans
  for (const scan of getAllScans()) {
    const found = scan.ingredients?.find((i) => i.id === id)
    if (found) return found
  }

  return undefined
}

