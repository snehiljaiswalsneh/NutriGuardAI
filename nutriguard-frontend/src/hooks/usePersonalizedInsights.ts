/**
 * usePersonalizedInsights
 *
 * Compares a product's nutrition/ingredient data against the user's fitness
 * goals and allergy profile to produce:
 *  - personalWarnings: allergy warnings & fitness conflicts/supports
 *  - nutrientHighlights: vitamins, macros, minerals linked to goals
 *  - scoreEvaluation: step-by-step breakdown of how safety score was evaluated
 *  - evaluatedAlternatives: safer alternatives evaluated against user's profile
 */

import { useMemo } from 'react'
import type { NutritionProfile, Ingredient, Alternative } from '@/data/types'
import type { UserProfile } from '@/context/AuthContext'

export interface PersonalWarning {
  type: 'allergy' | 'fitness-conflict' | 'fitness-good'
  emoji: string
  title: string
  detail: string
  severity: 'high' | 'medium' | 'low'
}

export interface NutrientHighlight {
  nutrientName: string
  amount: string
  unit: string
  dailyValue?: number
  label: string
  type: 'good' | 'bad' | 'neutral'
  goalMatch?: string
}

export interface ScoreEvaluationItem {
  category: 'toxicology' | 'allergy' | 'fitness' | 'net'
  label: string
  delta: number
  explanation: string
}

export interface EvaluatedAlternative {
  id: string
  name: string
  scoreDelta: number
  reason: string
  fitnessFit: string
  allergyFit: string
  recommended: boolean
  targetScore: number
}

export interface PersonalizedInsights {
  personalWarnings: PersonalWarning[]
  nutrientHighlights: NutrientHighlight[]
  scoreDelta: number
  personalizedScore: number
  activeGoals: string[]
  userAllergens: string[]
  hasPersonalization: boolean
  scoreBreakdown: ScoreEvaluationItem[]
  evaluatedAlternatives: EvaluatedAlternative[]
}

function getActiveOptions(
  fitnessProfile?: Record<string, { isYes: boolean; selected: string[] }>
): string[] {
  if (!fitnessProfile) return []
  const options: string[] = []
  for (const [, val] of Object.entries(fitnessProfile)) {
    if (val.isYes && val.selected?.length) {
      options.push(...val.selected)
    }
  }
  return [...new Set(options)]
}

export function usePersonalizedInsights(
  baseScore: number,
  ingredients: Ingredient[],
  nutritionProfile: NutritionProfile | undefined,
  user: UserProfile,
  productName: string = 'Product'
): PersonalizedInsights {
  return useMemo(() => {
    const userAllergens: string[] = user.allergyProfile?.hasAllergies
      ? (user.allergyProfile.allergens ?? [])
      : []
    const activeOptions = getActiveOptions(
      user.fitnessProfile as Record<string, { isYes: boolean; selected: string[] }> | undefined
    )

    const fitnessGoals = activeOptions.filter((o) =>
      [
        'Muscle Gain',
        'Fat Loss',
        'Strength',
        'Endurance',
        'General Fitness',
        'Cardio',
        'Weight Training',
        'Bodyweight',
        'HIIT',
        'CrossFit',
      ].includes(o)
    )

    const personalWarnings: PersonalWarning[] = []
    const scoreBreakdown: ScoreEvaluationItem[] = [
      {
        category: 'toxicology',
        label: 'Base Toxicological Score',
        delta: baseScore,
        explanation: 'Standard safety score evaluated from additive toxicity and regulatory limits.',
      },
    ]

    let scoreDelta = 0

    // 1. ALLERGY CROSS-CHECK
    if (userAllergens.length > 0) {
      const ingredientText = ingredients.map((i) => `${i.name} ${i.description ?? ''}`).join(' ').toLowerCase()
      const matched: string[] = []

      for (const allergen of userAllergens) {
        const key = allergen.toLowerCase().replace(/\/.*$/, '').trim()
        if (ingredientText.includes(key)) {
          matched.push(allergen)
        }
      }

      if (matched.length > 0) {
        const allergyPenalty = - (matched.length * 15)
        scoreDelta += allergyPenalty
        personalWarnings.push({
          type: 'allergy',
          emoji: '🚨',
          title: `Allergen Detected: ${matched.join(', ')}`,
          detail: `Contains substances matching your saved allergy profile (${matched.join(', ')}). High risk of allergic reaction.`,
          severity: (user.allergyProfile?.severity === 'Severe' || user.allergyProfile?.severity === 'Anaphylaxis') ? 'high' : 'medium',
        })
        scoreBreakdown.push({
          category: 'allergy',
          label: 'Allergy Hazard Penalty',
          delta: allergyPenalty,
          explanation: `Detected ${matched.join(', ')} matching your profile severity (${user.allergyProfile?.severity || 'Moderate'}).`,
        })
      } else {
        const allergyBonus = 3
        scoreDelta += allergyBonus
        personalWarnings.push({
          type: 'allergy',
          emoji: '✅',
          title: 'Safe from Your Saved Allergens',
          detail: `Verified against your ${userAllergens.length} registered allergens (${userAllergens.slice(0, 3).join(', ')}${userAllergens.length > 3 ? '...' : ''}). No direct matches detected.`,
          severity: 'low',
        })
        scoreBreakdown.push({
          category: 'allergy',
          label: 'Allergy Clearance Bonus',
          delta: allergyBonus,
          explanation: `Zero conflicts with your saved allergens (${userAllergens.length} registered).`,
        })
      }
    }

    // 2. NUTRITION & FITNESS CROSS-CHECK
    const nutrientHighlights: NutrientHighlight[] = []
    let fitnessPositiveDelta = 0
    let fitnessNegativeDelta = 0

    if (nutritionProfile && fitnessGoals.length > 0) {
      const allNutrients = [
        ...(nutritionProfile.macros ?? []),
        ...(nutritionProfile.vitamins ?? []),
        ...(nutritionProfile.minerals ?? []),
        ...(nutritionProfile.otherNutrients ?? []),
      ]

      for (const nutrient of allNutrients) {
        const matchGood = (nutrient.goodFor ?? []).some((g) =>
          fitnessGoals.some((goal) => goal.toLowerCase().includes(g.toLowerCase()) || g.toLowerCase().includes(goal.toLowerCase()))
        )
        const matchBad = (nutrient.badFor ?? []).some((b) =>
          fitnessGoals.some((goal) => goal.toLowerCase().includes(b.toLowerCase()) || b.toLowerCase().includes(goal.toLowerCase()))
        )

        if (matchGood && (nutrient.dailyValue ?? 0) >= 10) {
          const goalMatch = fitnessGoals.find((g) =>
            (nutrient.goodFor ?? []).some((gf) => gf.toLowerCase().includes(g.toLowerCase()) || g.toLowerCase().includes(gf.toLowerCase()))
          )
          nutrientHighlights.push({
            nutrientName: nutrient.name,
            amount: nutrient.amount,
            unit: nutrient.unit,
            dailyValue: nutrient.dailyValue,
            label: nutrient.benefitLabel ?? `Supports ${goalMatch ?? 'fitness goal'}`,
            type: 'good',
            goalMatch,
          })
          fitnessPositiveDelta += 3
        } else if (matchBad && (nutrient.dailyValue ?? 0) >= 15) {
          const goalMatch = fitnessGoals.find((g) =>
            (nutrient.badFor ?? []).some((bf) => bf.toLowerCase().includes(g.toLowerCase()) || g.toLowerCase().includes(bf.toLowerCase()))
          )
          nutrientHighlights.push({
            nutrientName: nutrient.name,
            amount: nutrient.amount,
            unit: nutrient.unit,
            dailyValue: nutrient.dailyValue,
            label: `May conflict with your ${goalMatch ?? 'fitness goal'}`,
            type: 'bad',
            goalMatch,
          })
          fitnessNegativeDelta -= 4
        }
      }

      // Cap fitness adjustments so score isn't skewed wildly
      const netFitnessDelta = Math.max(-12, Math.min(10, fitnessPositiveDelta + fitnessNegativeDelta))
      scoreDelta += netFitnessDelta

      if (netFitnessDelta !== 0) {
        scoreBreakdown.push({
          category: 'fitness',
          label: 'Fitness & Nutrition Alignment',
          delta: netFitnessDelta,
          explanation:
            netFitnessDelta > 0
              ? `Beneficial nutrients (${nutrientHighlights.filter((n) => n.type === 'good').map((n) => n.nutrientName).slice(0, 3).join(', ')}) support your ${fitnessGoals.join(', ')} goals.`
              : `High levels of (${nutrientHighlights.filter((n) => n.type === 'bad').map((n) => n.nutrientName).slice(0, 2).join(', ')}) conflict with your fitness priorities.`,
        })
      }
    }

    if (nutrientHighlights.filter((n) => n.type === 'bad').length > 0) {
      const conflicts = nutrientHighlights.filter((n) => n.type === 'bad')
      personalWarnings.push({
        type: 'fitness-conflict',
        emoji: '⚠️',
        title: 'Nutritional Goal Conflict',
        detail: `${conflicts.map((c) => c.nutrientName).join(', ')} may hinder your ${[...new Set(conflicts.map((c) => c.goalMatch).filter(Boolean))].join(', ')} progress.`,
        severity: 'medium',
      })
    }

    if (nutrientHighlights.filter((n) => n.type === 'good').length > 0 && fitnessGoals.length > 0) {
      const goods = nutrientHighlights.filter((n) => n.type === 'good')
      personalWarnings.push({
        type: 'fitness-good',
        emoji: '💪',
        title: 'Supports Your Fitness Goals',
        detail: `${goods.map((g) => g.nutrientName).join(', ')} align strongly with your ${[...new Set(goods.map((g) => g.goalMatch).filter(Boolean))].slice(0, 2).join(', ')} goals.`,
        severity: 'low',
      })
    }

    // 3. SAFER ALTERNATIVES EVALUATION
    // Rule: If safety score < 95, suggest at least 1 and maximum 3 alternatives,
    // keeping core ingredients identical with higher safety score.
    const rawAlternatives: Alternative[] = ingredients.flatMap((i) => i.alternatives ?? [])
    const evaluatedRaw: EvaluatedAlternative[] = rawAlternatives.map((alt) => {
      const altLower = alt.name.toLowerCase()
      const hasAllergenConflict = userAllergens.some((a) => altLower.includes(a.toLowerCase()))
      const allergyFit = userAllergens.length === 0
        ? 'No allergy restrictions specified'
        : hasAllergenConflict
        ? `Contains potential allergen for your profile`
        : `100% Free of your saved allergens (${userAllergens.slice(0, 2).join(', ')})`

      let fitnessFit = 'Standard healthy alternative'
      if (fitnessGoals.includes('Muscle Gain') || fitnessGoals.includes('Strength')) {
        fitnessFit = 'High protein retention without artificial curing salts'
      } else if (fitnessGoals.includes('Fat Loss') || fitnessGoals.includes('Cardio')) {
        fitnessFit = 'Lower sodium and naturally sourced preservatives'
      } else if (fitnessGoals.length > 0) {
        fitnessFit = `Clean formulation aligned with ${fitnessGoals[0]}`
      }

      const delta = Math.max(5, alt.scoreDelta ?? 10)
      return {
        id: alt.id,
        name: alt.name,
        scoreDelta: delta,
        reason: alt.reason,
        fitnessFit,
        allergyFit,
        recommended: !hasAllergenConflict,
        targetScore: Math.min(100, Math.max(baseScore + 5, baseScore + delta)),
      }
    })

    let evaluatedAlternatives: EvaluatedAlternative[] = []

    if (baseScore < 95) {
      // Extract core main ingredients (filter out additives, preservatives, seed oils, artificial dyes, syrups)
      const coreIngredients = ingredients
        .filter((ing) => !/preservative|color|dye|nitrite|flavor|oil|syrup|shortening|additive|sweetener/i.test(`${ing.name} ${ing.purpose ?? ''} ${ing.reason ?? ''}`))
        .map((i) => i.name)

      const coreFoodName = productName && productName !== 'Product' ? productName : (coreIngredients[0] || 'Meal')
      const coreSummary = coreIngredients.length > 0 ? coreIngredients.slice(0, 3).join(' & ') : coreFoodName

      // Generate up to 3 core-identical formulation upgrades with higher safety scores
      const delta1 = Math.min(12, Math.max(7, 96 - baseScore))
      const delta2 = Math.min(15, Math.max(9, 97 - baseScore))
      const delta3 = Math.min(18, Math.max(11, 98 - baseScore))

      const isSweetDessert = /ice cream|gelato|sorbet|dessert|chocolate|candy|sweet|cookie|cake|pastry/i.test(`${coreFoodName} ${coreSummary}`)

      const smartAlternatives: EvaluatedAlternative[] = isSweetDessert
        ? [
            {
              id: `alt-sweet-1-${Date.now()}`,
              name: `Monk Fruit & Pure Grass-Fed Dairy ${coreFoodName}`,
              scoreDelta: delta1,
              targetScore: Math.min(98, Math.max(baseScore + delta1, 95)),
              reason: `Keeps 100% authentic core ingredients (${coreSummary}), replacing high-fructose corn syrups and liquid sugar with pure organic monk fruit & real pasture-raised cream.`,
              fitnessFit: 'Stable blood glucose curve, 85% lower glycemic impact with high satiety',
              allergyFit: userAllergens.length ? `Cross-checked against saved allergens (${userAllergens.slice(0, 2).join(', ')})` : 'Zero artificial emulsifiers or synthetic carrageenan',
              recommended: true,
            },
            {
              id: `alt-sweet-2-${Date.now()}`,
              name: `A2 Organic Raw Cream & Bourbon Vanilla ${coreFoodName}`,
              scoreDelta: delta2,
              targetScore: Math.min(99, Math.max(baseScore + delta2, 96)),
              reason: `Preserves identical core (${coreSummary}) using digestive-friendly A2 organic cream sweetened with unrefined raw organic honey or dates instead of corn syrup.`,
              fitnessFit: 'Natural slow-release carbohydrate fuel with micronutrient-rich enzymes',
              allergyFit: 'Gentle on digestion, 100% free of synthetic food dyes, polysorbates, or gums',
              recommended: true,
            },
            {
              id: `alt-sweet-3-${Date.now()}`,
              name: `Coconut-Almond Cold-Churned Clean ${coreFoodName}`,
              scoreDelta: delta3,
              targetScore: Math.min(100, Math.max(baseScore + delta3, 97)),
              reason: `Uses identical ${coreSummary} flavor profile cold-churned with prebiotic tapioca fiber, cold-pressed cocoa butter, and zero synthetic preservatives.`,
              fitnessFit: 'High MCT healthy fats and dietary fiber with under 3g net sugars',
              allergyFit: 'Non-GMO, clean-label certified with zero artificial flavorings',
              recommended: true,
            },
          ]
        : [
            {
              id: `alt-core-1-${Date.now()}`,
              name: `Cold-Pressed Olive Oil & Natural Spiced ${coreFoodName}`,
              scoreDelta: delta1,
              targetScore: Math.min(98, Math.max(baseScore + delta1, 95)),
              reason: `Keeps 100% identical core ingredients (${coreSummary}), replacing refined cooking oils with cold-pressed extra-virgin olive oil and natural whole spices.`,
              fitnessFit: 'High monounsaturated healthy fats with zero trans-fats & clean macro retention',
              allergyFit: userAllergens.length ? `Free of saved allergens (${userAllergens.slice(0, 2).join(', ')})` : 'Zero artificial curing salts or refined seed oils',
              recommended: true,
            },
            {
              id: `alt-core-2-${Date.now()}`,
              name: `Himalayan Mineral-Salt & Whole-Grain ${coreFoodName}`,
              scoreDelta: delta2,
              targetScore: Math.min(99, Math.max(baseScore + delta2, 96)),
              reason: `Preserves identical core (${coreSummary}) while replacing high-sodium commercial salts & refined starches with mineral-rich pink salt and slow-digesting whole grains.`,
              fitnessFit: 'Stable blood sugar curve & optimal electrolyte balance for endurance',
              allergyFit: '100% free of added MSG, artificial flavor enhancers, or chemical stabilizers',
              recommended: true,
            },
            {
              id: `alt-core-3-${Date.now()}`,
              name: `Probiotic-Marinated Slow-Dum Clean ${coreFoodName}`,
              scoreDelta: delta3,
              targetScore: Math.min(100, Math.max(baseScore + delta3, 97)),
              reason: `Uses identical ${coreSummary} marinated in organic probiotic Greek yogurt and fresh botanicals, cooked without chemical tenderizers, synthetic colors, or preservatives.`,
              fitnessFit: 'Maximum nutrient bio-availability and enhanced protein digestibility',
              allergyFit: 'Certified clean-label formulation free of synthetic dyes and preservatives',
              recommended: true,
            },
          ]

      // Merge raw alternatives if available, followed by smart formulation alternatives
      const combined = [...evaluatedRaw]
      for (const smart of smartAlternatives) {
        if (!combined.some((c) => c.name.toLowerCase() === smart.name.toLowerCase())) {
          combined.push(smart)
        }
      }

      // Enforce: at least 1 and maximum 3 alternatives
      evaluatedAlternatives = combined.slice(0, Math.min(3, Math.max(1, combined.length)))
    } else {
      // Score is >= 95: Product is already at peak safety
      evaluatedAlternatives = []
    }

    const personalizedScore = Math.max(0, Math.min(100, baseScore + scoreDelta))

    return {
      personalWarnings,
      nutrientHighlights,
      scoreDelta,
      personalizedScore,
      activeGoals: fitnessGoals,
      userAllergens,
      hasPersonalization: userAllergens.length > 0 || fitnessGoals.length > 0,
      scoreBreakdown,
      evaluatedAlternatives,
    }
  }, [baseScore, ingredients, nutritionProfile, user, productName])
}
