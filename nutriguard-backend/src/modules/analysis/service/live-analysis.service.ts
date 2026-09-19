import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '@shared/config/env.js';
import { logger } from '@shared/logger/logger.js';

export interface LiveAnalysisInput {
  product_name?: string;
  ingredient_text: string;
  brand_name?: string;
}

export interface LiveIngredient {
  id: string;
  name: string;
  scientificName?: string | null;
  risk: 'safe' | 'moderate' | 'high' | 'unknown';
  reason: string;
  purpose?: string | null;
  description?: string | null;
  healthEffects?: string[];
  countries?: { country: string; flag: string; status: 'Approved' | 'Restricted' | 'Banned' }[];
  alternatives?: { id: string; name: string; scoreDelta?: number; reason: string }[];
}

export interface LiveNutritionFact {
  name: string;
  amount: string;
  unit: string;
  dailyValue?: number;
  goodFor?: string[];
  badFor?: string[];
  benefitLabel?: string;
}

export interface LiveNutritionProfile {
  calories?: number;
  servingSize?: string;
  macros?: LiveNutritionFact[];
  vitamins?: LiveNutritionFact[];
  minerals?: LiveNutritionFact[];
}

export interface LiveAnalysisResult {
  id: string;
  productName: string;
  brand: string;
  scanDate: string;
  safetyScore: number;
  verdict: string;
  aiSummary: string;
  allergyWarning?: string | null;
  ingredients: LiveIngredient[];
  nutritionProfile?: LiveNutritionProfile;
}

export class LiveAnalysisService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }

  private getStorePath(): string {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // ignore
      }
    }
    return path.join(dataDir, 'scans_store.json');
  }

  getAllScans(): LiveAnalysisResult[] {
    try {
      const p = this.getStorePath();
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Deduplicate by normalized product name so no conflicting duplicate cards exist
          const seen = new Map<string, LiveAnalysisResult>();
          for (const s of parsed) {
            // Exclude old erroneous scan if present
            if (s.id === 'scan-1789794009678') continue;
            const norm = (s.productName || '').trim().toLowerCase();
            if (!norm) continue;
            if (!seen.has(norm)) {
              seen.set(norm, s);
            } else {
              const existing = seen.get(norm)!;
              const sRichness = (s.nutritionProfile?.macros?.length || 0) + (s.ingredients?.length || 0);
              const exRichness = (existing.nutritionProfile?.macros?.length || 0) + (existing.ingredients?.length || 0);
              if (sRichness > exRichness) {
                seen.set(norm, s);
              }
            }
          }
          return Array.from(seen.values());
        }
      }
    } catch (err) {
      logger.warn({ err }, 'Failed to read scans store');
    }
    return [];
  }

  saveScan(scan: LiveAnalysisResult): void {
    try {
      const p = this.getStorePath();
      const current = this.getAllScans();
      const norm = (scan.productName || '').trim().toLowerCase();
      const updated = [
        scan,
        ...current.filter((s) => s.id !== scan.id && (s.productName || '').trim().toLowerCase() !== norm),
      ];
      fs.writeFileSync(p, JSON.stringify(updated, null, 2), 'utf-8');
      logger.info({ scanId: scan.id, productName: scan.productName }, 'Persisted scan to backend store');
    } catch (err) {
      logger.error({ err }, 'Failed to save scan to store');
    }
  }

  deleteScan(scanId: string): boolean {
    try {
      const p = this.getStorePath();
      const current = this.getAllScans();
      const updated = current.filter((s) => s.id !== scanId);
      fs.writeFileSync(p, JSON.stringify(updated, null, 2), 'utf-8');
      logger.info({ scanId }, 'Deleted scan from backend store');
      return true;
    } catch (err) {
      logger.error({ err }, 'Failed to delete scan from store');
      return false;
    }
  }

  clearAllScans(): void {
    try {
      const p = this.getStorePath();
      fs.writeFileSync(p, JSON.stringify([], null, 2), 'utf-8');
      logger.info('Cleared all scans from backend store');
    } catch (err) {
      logger.error({ err }, 'Failed to clear scans store');
    }
  }

  async analyze(input: LiveAnalysisInput): Promise<LiveAnalysisResult> {
    const productName = (input.product_name || 'Custom Product').trim();
    const ingredientText = (input.ingredient_text || '').trim();
    const brandName = (input.brand_name || 'Home/Custom').trim();
    const scanId = `scan-${Date.now()}`;
    const scanDate = new Date().toISOString().split('T')[0] ?? '2026-09-11';

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-3.6-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const prompt = `You are NutriGuard AI, an expert clinical food toxicologist and nutrition scientist.
Analyze the following product and its ingredients:
Product Name: "${productName}"
Brand: "${brandName}"
Ingredients: "${ingredientText}"

CRITICAL RULES:
1. NUTRITION, VITAMINS & MINERALS (REAL DATA):
   - Estimate realistic nutritional facts based on standard USDA/scientific food composition databases for "${productName}".
   - Provide standard serving size and calories.
   - Include complete macronutrients: Protein, Total Fat, Saturated Fat, Total Carbohydrates, Dietary Fiber, Total Sugars, Sodium.
   - Include key vitamins present (e.g. Vitamin A, Vitamin D, Vitamin C, Vitamin B12, Vitamin B6, Vitamin E, Niacin) with amounts and % Daily Values (DV%).
   - Include key minerals present (e.g. Calcium, Iron, Potassium, Phosphorus, Magnesium, Zinc) with amounts and % Daily Values (DV%).
   - Use full names without truncation ("Total Carbohydrates", "Dietary Fiber", "Vitamin B12", "Phosphorus").

2. SAFER ALTERNATIVES:
   - If safetyScore is < 95, you MUST suggest 1 to 3 safer alternatives.
   - The alternatives MUST keep the core ingredients IDENTICAL (e.g. keep authentic base), replacing only problematic refined oils, excess added sugars, artificial dyes, or chemical preservatives.
   - Each alternative must have a positive scoreDelta (+7 to +18 points).
   - If safetyScore >= 95, alternatives can be an empty array [].

Generate a comprehensive, scientifically accurate health and food safety report. Return ONLY valid JSON with this exact structure:
{
  "safetyScore": <integer 0-100, where 80-100 is Safe/wholesome, 55-79 is Moderate Risk, <55 is High Risk>,
  "verdict": "<'Safe' | 'Moderate Risk' | 'High Risk'>",
  "aiSummary": "<2-3 sentence overview explaining nutritional profile, safety concerns, and health impact>",
  "allergyWarning": "<e.g. 'Contains Wheat (Gluten), Milk (Dairy), and Eggs.' or null if no common allergens>",
  "nutritionProfile": {
    "calories": <number in kcal>,
    "servingSize": "<e.g. 2/3 cup (140g) or 1 serving (100g)>",
    "macros": [
      { "name": "Protein", "amount": "<e.g. 6>", "unit": "g", "dailyValue": 12, "goodFor": ["Muscle Gain"] },
      { "name": "Total Fat", "amount": "<e.g. 18>", "unit": "g", "dailyValue": 23 },
      { "name": "Saturated Fat", "amount": "<e.g. 11>", "unit": "g", "dailyValue": 55, "badFor": ["Heart Disease"] },
      { "name": "Total Carbohydrates", "amount": "<e.g. 34>", "unit": "g", "dailyValue": 12 },
      { "name": "Dietary Fiber", "amount": "<e.g. 1>", "unit": "g", "dailyValue": 4 },
      { "name": "Total Sugars", "amount": "<e.g. 29>", "unit": "g", "dailyValue": 58, "badFor": ["Diabetes"] },
      { "name": "Sodium", "amount": "<e.g. 95>", "unit": "mg", "dailyValue": 4 }
    ],
    "vitamins": [
      { "name": "Vitamin A", "amount": "140", "unit": "mcg", "dailyValue": 16 },
      { "name": "Vitamin D", "amount": "1.3", "unit": "mcg", "dailyValue": 13 },
      { "name": "Vitamin B12", "amount": "0.6", "unit": "mcg", "dailyValue": 25 }
    ],
    "minerals": [
      { "name": "Calcium", "amount": "160", "unit": "mg", "dailyValue": 16, "benefitLabel": "Bone density" },
      { "name": "Phosphorus", "amount": "135", "unit": "mg", "dailyValue": 11 },
      { "name": "Potassium", "amount": "240", "unit": "mg", "dailyValue": 5 }
    ]
  },
  "ingredients": [
    {
      "id": "<kebab-case-name>",
      "name": "<Capitalized Ingredient Name>",
      "scientificName": "<Scientific or chemical name or null>",
      "risk": "<'safe' | 'moderate' | 'high'>",
      "reason": "<Direct reason for risk classification>",
      "purpose": "<Culinary or processing purpose in this product>",
      "description": "<Concise overview of what this ingredient is>",
      "healthEffects": ["<health effect 1>", "<health effect 2>"],
      "countries": [
        { "country": "United States", "flag": "🇺🇸", "status": "Approved" },
        { "country": "European Union", "flag": "🇪🇺", "status": "<'Approved' | 'Restricted' | 'Banned'>" },
        { "country": "India", "flag": "🇮🇳", "status": "Approved" }
      ],
      "alternatives": [
        { "id": "<alt-id>", "name": "<Healthier alternative with identical core ingredients>", "scoreDelta": 12, "reason": "<Why it is better while keeping core ingredients identical>" }
      ]
    }
  ]
}`;

      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const text = response.response.text();
      const parsed = JSON.parse(text);

      const rawIngredients: LiveIngredient[] = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
      const score = typeof parsed.safetyScore === 'number' ? parsed.safetyScore : 80;

      // Ensure 1-3 alternatives keeping core ingredients identical if score < 95
      if (score < 95) {
        const existingAlts = rawIngredients.flatMap((i) => i.alternatives ?? []);
        if (existingAlts.length === 0 && rawIngredients.length > 0) {
          const coreIngs = rawIngredients
            .filter((i) => !/preservative|color|dye|nitrite|flavor|oil|syrup|shortening|additive/i.test(`${i.name} ${i.purpose ?? ''} ${i.reason ?? ''}`))
            .map((i) => i.name);
          const coreDesc = coreIngs.length > 0 ? coreIngs.slice(0, 3).join(' & ') : productName;

          rawIngredients[0]!.alternatives = [
            {
              id: `alt-1-${Date.now()}`,
              name: `Organic Pure & Low-Glycemic ${productName}`,
              scoreDelta: Math.min(12, Math.max(7, 96 - score)),
              reason: `Retains 100% authentic core ingredients (${coreDesc}), replacing refined sugars and artificial additives with natural clean ingredients.`,
            },
            {
              id: `alt-2-${Date.now()}`,
              name: `Mineral-Rich Unrefined ${productName}`,
              scoreDelta: Math.min(15, Math.max(9, 97 - score)),
              reason: `Preserves identical core (${coreDesc}) while swapping processed chemical additives with natural whole nutrients.`,
            },
            {
              id: `alt-3-${Date.now()}`,
              name: `Probiotic Slow-Cultured Clean ${productName}`,
              scoreDelta: Math.min(18, Math.max(11, 98 - score)),
              reason: `Uses identical ${coreDesc} crafted with zero chemical stabilizers or synthetic colors.`,
            },
          ];
        }
      }

      const result: LiveAnalysisResult = {
        id: scanId,
        productName,
        brand: brandName,
        scanDate,
        safetyScore: score,
        verdict: parsed.verdict || (score >= 80 ? 'Safe' : score >= 60 ? 'Moderate Risk' : 'High Risk'),
        aiSummary: parsed.aiSummary || `Nutritional analysis of ${productName}.`,
        allergyWarning: parsed.allergyWarning || null,
        ingredients: rawIngredients,
        nutritionProfile: parsed.nutritionProfile,
      };
      this.saveScan(result);
      return result;
    } catch (err) {
      logger.warn({ err }, 'Gemini live analysis failed or timed out, using fallback parser');
      return this.fallbackAnalysis(productName, brandName, ingredientText, scanId, scanDate);
    }
  }

  private fallbackAnalysis(
    productName: string,
    brandName: string,
    ingredientText: string,
    scanId: string,
    scanDate: string
  ): LiveAnalysisResult {
    const rawItems = ingredientText
      .split(/[,;\n]/)
      .map((s) => s.replace(/^and\s+/i, '').trim())
      .filter(Boolean);

    const allergens: string[] = [];
    let flaggedCount = 0;

    const parsedIngredients: LiveIngredient[] = rawItems.map((item, idx) => {
      const lower = item.toLowerCase();
      let risk: 'safe' | 'moderate' | 'high' = 'safe';
      let reason = 'Common dietary ingredient with standard safety profile';
      let purpose = 'Provides texture and flavor';

      if (/sugar|syrup|fructose|dextrose|sucrose|glucose|maltodextrin|corn syrup/i.test(lower)) {
        risk = 'moderate';
        reason = 'Added sugar or refined sweetener with high glycemic impact';
        purpose = 'Sweetener and flavor enhancer';
        flaggedCount++;
      } else if (/caffeine|taurine|guarana|energy blend/i.test(lower)) {
        risk = 'moderate';
        reason = 'Central nervous system stimulant; may cause elevated heart rate, jitteriness, or sleep disruption';
        purpose = 'Stimulant and alertness enhancer';
        flaggedCount++;
      } else if (/vegetable oil|palm oil|canola oil|shortening|hydrogenated/i.test(lower)) {
        risk = 'moderate';
        reason = 'Refined fat source high in omega-6 fatty acids';
        purpose = 'Texture, moisture, and mouthfeel';
        flaggedCount++;
      } else if (/nitrite|nitrate|benzoate|bha|bht|aspartame|sucralose|acesulfame/i.test(lower)) {
        risk = 'high';
        reason = 'Synthetic preservative or artificial additive flagged by health agencies';
        purpose = 'Extends shelf life or artificial sweetness';
        flaggedCount += 2;
      } else if (/red 40|yellow 5|yellow 6|tartrazine|blue 1|artificial flavor|artificial color|colors/i.test(lower)) {
        risk = 'moderate';
        reason = 'Synthetic food dye or artificial flavoring';
        purpose = 'Artificial coloring and flavor';
        flaggedCount++;
      }

      if (/wheat|flour|gluten/i.test(lower) && !allergens.includes('Wheat (Gluten)')) allergens.push('Wheat (Gluten)');
      if (/milk|dairy|butter|cream|whey/i.test(lower) && !allergens.includes('Milk (Dairy)')) allergens.push('Milk (Dairy)');
      if (/egg/i.test(lower) && !allergens.includes('Eggs')) allergens.push('Eggs');
      if (/soy/i.test(lower) && !allergens.includes('Soy')) allergens.push('Soy');
      if (/peanut|almond|walnut|cashew|hazelnut/i.test(lower) && !allergens.includes('Tree Nuts/Peanuts')) allergens.push('Tree Nuts/Peanuts');

      return {
        id: `ing-${idx}-${item.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: item.charAt(0).toUpperCase() + item.slice(1),
        scientificName: null,
        risk,
        reason,
        purpose,
        description: `${item} used in ${productName}.`,
        healthEffects: [reason],
        countries: [
          { country: 'United States', flag: '🇺🇸', status: 'Approved' },
          { country: 'European Union', flag: '🇪🇺', status: risk === 'high' ? 'Restricted' : 'Approved' },
          { country: 'India', flag: '🇮🇳', status: 'Approved' },
        ],
        alternatives: [],
      };
    });

    const baseScore = Math.max(40, 95 - flaggedCount * 8);
    const verdict = baseScore >= 80 ? 'Safe' : baseScore >= 60 ? 'Moderate Risk' : 'High Risk';
    const allergyWarning = allergens.length > 0 ? `Contains ${allergens.join(', ')}.` : null;

    // Attach 1-3 core-identical alternatives with higher safety score if baseScore < 95
    if (baseScore < 95 && parsedIngredients.length > 0) {
      const coreIngs = parsedIngredients
        .filter((i) => !/preservative|color|dye|nitrite|flavor|oil|syrup|shortening|additive/i.test(`${i.name} ${i.purpose ?? ''} ${i.reason ?? ''}`))
        .map((i) => i.name);
      const coreDesc = coreIngs.length > 0 ? coreIngs.slice(0, 3).join(' & ') : productName;

      parsedIngredients[0]!.alternatives = [
        {
          id: `alt-fallback-1-${Date.now()}`,
          name: `Cold-Pressed Olive Oil & Natural Spiced ${productName}`,
          scoreDelta: Math.min(12, Math.max(7, 96 - baseScore)),
          reason: `Retains 100% identical core ingredients (${coreDesc}), replacing refined cooking oils with cold-pressed olive oil & whole spices.`,
        },
        {
          id: `alt-fallback-2-${Date.now()}`,
          name: `Low-Sodium Himalayan Pink Salt ${productName}`,
          scoreDelta: Math.min(15, Math.max(9, 97 - baseScore)),
          reason: `Preserves identical core (${coreDesc}) while swapping commercial table salts with mineral-rich pink salt.`,
        },
        {
          id: `alt-fallback-3-${Date.now()}`,
          name: `Probiotic-Marinated Slow-Dum Clean ${productName}`,
          scoreDelta: Math.min(18, Math.max(11, 98 - baseScore)),
          reason: `Uses identical ${coreDesc} marinated in organic probiotic yogurt with zero chemical tenderizers or artificial colors.`,
        },
      ];
    }

    const fallbackResult: LiveAnalysisResult = {
      id: scanId,
      productName,
      brand: brandName,
      scanDate,
      safetyScore: baseScore,
      verdict,
      aiSummary: `${productName} contains ${parsedIngredients.length} analyzed ingredients. ${
        flaggedCount > 0
          ? `${flaggedCount} ingredient(s) carry moderate or elevated health considerations.`
          : 'Overall, the ingredients show a generally safe nutritional profile.'
      }`,
      allergyWarning,
      ingredients: parsedIngredients,
    };
    this.saveScan(fallbackResult);
    return fallbackResult;
  }
}

export const liveAnalysisService = new LiveAnalysisService();
