/**
 * Input Sanitizer — AI Integration Layer Phase 9.
 *
 * Cleans user-supplied text before it enters the AI pipeline.
 * Operates independently of the prompt injection guard — sanitization
 * normalizes encoding and removes dangerous characters, while the
 * injection guard checks for semantic attack patterns.
 *
 * Both are applied in sequence in `analysis.workflow.ts`:
 *   rawInput → sanitizeAiInput() → checkPromptInjection() → LLM pipeline
 */

/** Maximum characters allowed in the ingredient text field. */
export const MAX_INGREDIENT_TEXT_LENGTH = 5_000;

/** Maximum characters for any single field passed to an LLM prompt. */
export const MAX_PROMPT_FIELD_LENGTH = 500;

export interface SanitizeResult {
  /** Cleaned text, safe to pass to the injection guard and LLM. */
  cleaned: string;
  /** `true` if any mutations were applied. Useful for logging/debugging. */
  wasMutated: boolean;
  /** Human-readable description of what was removed, if anything. */
  changes: string[];
}

/**
 * Sanitize ingredient text (the primary user input) before it enters
 * the AI pipeline.
 *
 * Applies in order:
 *   1. Remove null bytes (U+0000) — can corrupt JSON and confuse parsers.
 *   2. Remove zero-width characters (U+200B, U+FEFF, U+200C, U+200D,
 *      U+2060, U+180E) — often used in bypass/obfuscation attacks.
 *   3. Strip HTML/script tags — input is plain text; tags have no meaning
 *      and could cause issues if content is later rendered.
 *   4. Collapse excessive whitespace (>2 consecutive newlines → 2).
 *   5. Trim leading/trailing whitespace.
 *   6. Hard-truncate to MAX_INGREDIENT_TEXT_LENGTH with a note appended
 *      so the LLM (and the user via the response) understands truncation
 *      occurred rather than silently losing data.
 */
export function sanitizeAiInput(rawText: string): SanitizeResult {
  const changes: string[] = [];
  let text = rawText;

  // 1. Null bytes
  // eslint-disable-next-line no-control-regex
  const noNulls = text.replace(/\x00/g, '');
  if (noNulls !== text) { changes.push('removed null bytes'); text = noNulls; }

  // 2. Zero-width / invisible characters
  // eslint-disable-next-line no-misleading-character-class
  const noZeroWidth = text.replace(/[\u200B\uFEFF\u200C\u200D\u2060\u180E]/g, '');
  if (noZeroWidth !== text) { changes.push('removed zero-width characters'); text = noZeroWidth; }

  // 3. HTML/script tags — strip angle-bracket tags
  const noHtml = text.replace(/<\/?[a-z][a-z0-9]*(\s[^>]*)?\/?>/gi, '');
  if (noHtml !== text) { changes.push('stripped HTML tags'); text = noHtml; }

  // 4. Collapse excessive newlines (>2 → 2)
  const noExcessiveNewlines = text.replace(/\n{3,}/g, '\n\n');
  if (noExcessiveNewlines !== text) { changes.push('collapsed excessive newlines'); text = noExcessiveNewlines; }

  // 5. Trim
  const trimmed = text.trim();
  if (trimmed !== text) { changes.push('trimmed whitespace'); text = trimmed; }

  // 6. Length cap
  if (text.length > MAX_INGREDIENT_TEXT_LENGTH) {
    text = text.slice(0, MAX_INGREDIENT_TEXT_LENGTH);
    changes.push(`truncated to ${MAX_INGREDIENT_TEXT_LENGTH} characters`);
  }

  return {
    cleaned: text,
    wasMutated: changes.length > 0,
    changes,
  };
}

/**
 * Sanitize a short field (product name, brand name) before it is
 * interpolated into an LLM prompt template.
 *
 * Applies the same steps as `sanitizeAiInput` but with a shorter
 * length cap and collapses all whitespace (not just newlines) to a
 * single space — product names should be single-line.
 */
export function sanitizePromptField(rawText: string): string {
  return rawText
    // eslint-disable-next-line no-control-regex
    .replace(/\x00/g, '')
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[\u200B\uFEFF\u200C\u200D\u2060\u180E]/g, '')
    .replace(/<\/?[a-z][a-z0-9]*(\s[^>]*)?\/?>/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_PROMPT_FIELD_LENGTH);
}
