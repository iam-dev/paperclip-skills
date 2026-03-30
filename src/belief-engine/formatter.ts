import type { SearchResult } from 'mnemebrain';

interface FormatterOptions {
  task: string;
  maxTokens: number;
}

/**
 * Format search results as markdown context for agent consumption.
 * Groups by truthState, shows confidence %, and truncates to maxTokens.
 */
export function formatContext(results: SearchResult[], options: FormatterOptions): string {
  const { task, maxTokens } = options;

  const lines: string[] = [
    '# Belief Engine — Relevant Context',
    '',
    `**Task**: ${task}`,
    `**Backend**: MnemeBrain`,
    '',
  ];

  // Group by truthState since SearchResult doesn't have category
  const byState: Record<string, SearchResult[]> = {};
  for (const r of results) {
    const key = r.truthState || 'TRUE';
    if (!byState[key]) byState[key] = [];
    byState[key].push(r);
  }

  for (const [state, items] of Object.entries(byState).sort(([a], [b]) => a.localeCompare(b))) {
    const heading = state.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    lines.push(`## ${heading}`);
    for (const r of items) {
      let tag = '';
      if (r.truthState === 'both') {
        tag = ' **[CONTRADICTED]**';
      } else if (r.truthState === 'false') {
        tag = ' ~~(retracted)~~';
      }
      const pct = `${Math.round(r.confidence * 100)}%`;
      lines.push(`- [${pct}] ${r.claim}${tag}`);
    }
    lines.push('');
  }

  // Surface contradictions separately
  const contras = results.filter(r => r.truthState === 'both');
  if (contras.length > 0) {
    lines.push('## Contradictions (Needs Resolution)');
    for (const r of contras) {
      lines.push(`- **${r.beliefId}**: ${r.claim}`);
    }
    lines.push('');
  }

  let md = lines.join('\n');
  const maxChars = maxTokens * 4;
  if (md.length > maxChars) {
    md = md.slice(0, maxChars) + '\n\n*... (truncated)*';
  }
  return md;
}
