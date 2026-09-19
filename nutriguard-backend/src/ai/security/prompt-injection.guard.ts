import { aiLogger } from '../monitoring/ai-logger.js';

/**
 * Known prompt injection / jailbreak patterns.
 * Grouped by attack family for maintainability.
 *
 * IMPORTANT: This list is a defense-in-depth measure, NOT a complete
 * injection prevention strategy. The primary defenses are:
 *  1. Strict system prompts that constrain model behaviour.
 *  2. Structured output (JSON Schema) enforcement — the model cannot
 *     output arbitrary prose even if manipulated.
 *  3. Response validation (Zod schema + grounding check) that rejects
 *     outputs containing suspicious phrases.
 *
 * This guard adds a fast pre-flight check BEFORE the input reaches the
 * LLM, catching unsophisticated attacks cheaply.
 */
const INJECTION_PATTERNS: { pattern: RegExp; family: string }[] = [
  // Role override / persona hijack
  { pattern: /ignore\s+(previous|all|above|prior)\s+instruction/i, family: 'role_override' },
  { pattern: /you\s+are\s+now\s+(a|an|the)\s+/i,                  family: 'role_override' },
  { pattern: /act\s+as\s+(a|an|the|if)\s+/i,                      family: 'role_override' },
  { pattern: /pretend\s+(you|to)\s+(are|be)\s+/i,                  family: 'role_override' },
  { pattern: /forget\s+(everything|all|your|the)\s+/i,             family: 'role_override' },
  { pattern: /disregard\s+(all|your|previous)\s+/i,                family: 'role_override' },

  // Jailbreak keywords
  { pattern: /\bDAN\b/,                                            family: 'jailbreak' },
  { pattern: /jailbreak/i,                                         family: 'jailbreak' },
  { pattern: /developer\s+mode/i,                                  family: 'jailbreak' },
  { pattern: /god\s+mode/i,                                        family: 'jailbreak' },
  { pattern: /unrestricted\s+mode/i,                               family: 'jailbreak' },

  // Prompt delimiter injection — attempts to close the system prompt block
  { pattern: /(<\|system\|>|<\|endofprompt\|>|<\|end\|>)/i,       family: 'delimiter_injection' },
  { pattern: /```\s*(system|user|assistant)/i,                     family: 'delimiter_injection' },

  // Data exfiltration attempts
  { pattern: /reveal\s+(your|the)\s+(system|secret|hidden)\s+prompt/i, family: 'exfiltration' },
  { pattern: /print\s+(your|the)\s+(prompt|instructions|context)/i,    family: 'exfiltration' },
  { pattern: /show\s+(me|your)\s+(instructions|system\s+prompt)/i,     family: 'exfiltration' },
];

/** Unicode lookalike confusables — e.g., Cyrillic "а" (U+0430) ≈ Latin "a". */
const UNICODE_CONFUSABLE_MAP: [RegExp, string][] = [
  [/[\u0430]/g, 'a'], // Cyrillic small а → Latin a
  [/[\u0435]/g, 'e'], // Cyrillic small е → Latin e
  [/[\u043E]/g, 'o'], // Cyrillic small о → Latin o
  [/[\u0440]/g, 'r'], // Cyrillic small р → Latin r
  [/[\u0441]/g, 'c'], // Cyrillic small с → Latin c
  [/[\u0456]/g, 'i'], // Ukrainian і → Latin i
  [/[\u04BB]/g, 'h'], // Cyrillic ħ → Latin h
];

export interface InjectionGuardResult {
  /** `true` when the input is safe to forward to the LLM. */
  safe: boolean;
  /** The original input with dangerous patterns stripped (for logging only). */
  sanitized: string;
  /** Human-readable reason for blocking, present only when `safe === false`. */
  blockedReason?: string;
  /** The attack family that matched, if any. */
  matchedPattern?: string;
}

/**
 * Prompt Injection Guard — AI Integration Layer Phase 9.
 *
 * Performs a fast pattern-based pre-flight check on user-supplied text
 * BEFORE it is passed to any LLM call. Operates in two stages:
 *
 *   Stage 1 — Unicode normalization
 *     Replaces common confusable lookalike characters with their ASCII
 *     equivalents to defeat homoglyph bypass attempts (e.g., writing
 *     "IgnorE prеvious instructions" using Cyrillic characters).
 *
 *   Stage 2 — Pattern matching
 *     Scans the normalized text against the INJECTION_PATTERNS list.
 *     Any match causes the guard to return `safe: false`.
 *
 * On a `safe: false` result, the caller (analysis workflow) MUST NOT
 * forward the input to the LLM. It should return a 422 validation error
 * to the client explaining that the input contains disallowed content.
 *
 * Returns `{ safe: true, sanitized: text }` for clean input, allowing
 * the pipeline to continue normally.
 */
export function checkPromptInjection(text: string): InjectionGuardResult {
  // Stage 1: Unicode normalization
  let normalized = text;
  for (const [from, to] of UNICODE_CONFUSABLE_MAP) {
    normalized = normalized.replace(from, to);
  }
  // Additional NFD normalization to catch composed characters
  normalized = normalized.normalize('NFKD');

  // Stage 2: Pattern scan
  for (const { pattern, family } of INJECTION_PATTERNS) {
    if (pattern.test(normalized)) {
      const reason = `Input matched injection pattern family: ${family}`;
      aiLogger.injectionBlocked({
        reason,
        inputLength: text.length,
        matchedPattern: family,
      });
      return {
        safe: false,
        sanitized: normalized,
        blockedReason: reason,
        matchedPattern: family,
      };
    }
  }

  return { safe: true, sanitized: normalized };
}
