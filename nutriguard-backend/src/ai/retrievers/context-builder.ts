import type { IngredientKnowledge, KnowledgeContext } from './ingredient-knowledge.retriever.js';

/**
 * Context Builder — AI Integration Layer Phase 4.
 *
 * Assembles a structured, LLM-readable context string from the knowledge
 * retrieved by `IngredientKnowledgeRetriever`. This string is injected
 * into the "GROUNDING CONTEXT" block of every prompt that sends
 * ingredient data to a language model (see `summary-agent.prompt.ts` for
 * the prompt template that this context feeds into).
 *
 * Design decisions:
 * - Plain text with consistent headers, not JSON — models follow
 *   prose-formatted context more reliably than raw JSON in the user
 *   message (JSON is reserved for the *output* schema).
 * - Each ingredient section is self-contained so the model can reason
 *   about a single ingredient without scrolling context.
 * - Research sources are listed by label + publisher only (not full
 *   URL) to save tokens; URLs are not useful to the model for reasoning.
 * - Unresolved names are surfaced explicitly so the model can
 *   acknowledge data gaps instead of hallucinating.
 */
export class ContextBuilder {
  /**
   * Build the full grounding context block from a `KnowledgeContext`.
   *
   * @param context  — returned by `IngredientKnowledgeRetriever.retrieve()`
   * @param maxChars — optional hard cap (default 12 000) to avoid
   *                   exceeding context window limits. Truncates
   *                   health effects and sources per ingredient, not
   *                   entire ingredient entries, to preserve breadth.
   */
  build(context: KnowledgeContext, maxChars = 12_000): string {
    const sections: string[] = [];

    // Header
    sections.push('=== KNOWLEDGE BASE CONTEXT ===');
    sections.push(
      `Retrieved ${context.results.length} ingredient(s). ` +
        (context.unresolved.length > 0
          ? `${context.unresolved.length} could not be matched: ${context.unresolved.join(', ')}.`
          : 'All ingredients were matched.')
    );
    sections.push('');

    // Ingredient sections
    for (const ingredient of context.results) {
      sections.push(this.buildIngredientSection(ingredient));
    }

    // Unresolved summary
    if (context.unresolved.length > 0) {
      sections.push('--- UNRESOLVED INGREDIENTS ---');
      sections.push(
        'The following ingredients could not be found in the knowledge base. ' +
          'Do NOT invent information about them. Acknowledge the data gap.\n' +
          context.unresolved.map((n) => `- ${n}`).join('\n')
      );
    }

    const full = sections.join('\n');

    // Hard-cap: truncate at maxChars, appending a truncation notice.
    if (full.length > maxChars) {
      return full.slice(0, maxChars) + '\n\n[Context truncated to fit model context window]';
    }

    return full;
  }

  /**
   * Build a concise context string for a single ingredient — used when
   * the retriever is called per-ingredient (e.g., in the ingredient
   * detail endpoint) rather than for a full analysis.
   */
  buildSingle(ingredient: IngredientKnowledge): string {
    return this.buildIngredientSection(ingredient);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private buildIngredientSection(i: IngredientKnowledge): string {
    const lines: string[] = [];

    lines.push(`--- ${i.name.toUpperCase()} ---`);
    lines.push(`Match method: ${i.retrievalMethod} (confidence: ${(i.matchConfidence * 100).toFixed(0)}%)`);

    if (i.scientificName) lines.push(`Scientific name: ${i.scientificName}`);
    if (i.eNumber) lines.push(`E-number: ${i.eNumber}`);

    lines.push(`Risk level: ${i.riskLevel}`);
    if (i.riskSummary) lines.push(`Risk summary: ${i.riskSummary}`);

    if (i.description) lines.push(`Description: ${i.description}`);
    if (i.purpose) lines.push(`Purpose: ${i.purpose}`);

    lines.push(
      `Origin: ${[i.isNatural ? 'natural' : null, i.isSynthetic ? 'synthetic' : null].filter(Boolean).join(' / ') || 'unknown'}`
    );

    if (i.healthEffects.length > 0) {
      lines.push('Health effects:');
      // Cap at 5 effects to control token usage
      i.healthEffects.slice(0, 5).forEach((e) => {
        lines.push(`  - [${e.severity}] ${e.effect}`);
      });
      if (i.healthEffects.length > 5) {
        lines.push(`  ... (${i.healthEffects.length - 5} more effects not shown)`);
      }
    }

    if (i.researchSources.length > 0) {
      lines.push('Research sources:');
      // Cap at 3 sources
      i.researchSources.slice(0, 3).forEach((s) => {
        lines.push(`  - "${s.label}"${s.publisher ? ` (${s.publisher})` : ''}`);
      });
    }

    lines.push('');
    return lines.join('\n');
  }
}

export const contextBuilder = new ContextBuilder();
