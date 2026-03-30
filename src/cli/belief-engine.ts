#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { MnemeBrainClient, EvidenceInput } from 'mnemebrain';
import type { SearchResult, BeliefListItem } from 'mnemebrain';
import { formatContext } from '../belief-engine/formatter.js';

const MNEMEBRAIN_URL = process.env.MNEMEBRAIN_URL || 'http://localhost:8000';

function createClient(): MnemeBrainClient {
  return new MnemeBrainClient(MNEMEBRAIN_URL);
}

function usage(): void {
  const text = `Usage: belief-engine <command> [options]

Commands:
  believe <content>       Store a belief with evidence
    --evidence=<ref>      Evidence source reference (required)
    --category=<cat>      Belief category/tag
    --agent=<name>        Source agent name
    --phase=<phase>       Workflow phase

  context <task>          Phase-start context (markdown output)
    --max-tokens=<n>      Max tokens for output (default: 4000)

  query <text>            Semantic search over beliefs
    --limit=<n>           Max results (default: 10)

  explain <query>         Justification chain for a belief

  revise <id>             Add evidence to existing belief
    --evidence=<ref>      Evidence source reference (required)
    --polarity=<p>        supporting or attacking (default: supporting)

  retract <evidence-id>   Invalidate evidence

  contradict              Surface contradicted beliefs

  stats                   Belief counts summary

  export                  Full backup as JSON

Environment:
  MNEMEBRAIN_URL          MnemeBrain server URL (default: http://localhost:8000)
`;
  process.stderr.write(text);
}

/** Safely call MnemeBrain; on failure write to stderr and return null. */
async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`belief-engine: MnemeBrain unavailable — ${msg}\n`);
    return null;
  }
}

async function cmdBelieve(args: string[]): Promise<void> {
  // Parse remaining args after "believe"
  const { values, positionals } = parseArgs({
    args,
    options: {
      evidence: { type: 'string' },
      category: { type: 'string' },
      agent: { type: 'string' },
      phase: { type: 'string' },
    },
    allowPositionals: true,
  });

  const content = positionals.join(' ');
  if (!content || !values.evidence) {
    process.stderr.write('Error: believe requires <content> and --evidence\n');
    process.exit(1);
  }

  const client = createClient();
  const evidence = new EvidenceInput({
    sourceRef: values.evidence,
    content: content,
  });

  const tags = values.category ? [values.category] : [];
  const result = await safe(() =>
    client.believe(content, [evidence], 'inference', tags, values.agent || '')
  );

  if (result) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  }
}

async function cmdContext(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      'max-tokens': { type: 'string' },
    },
    allowPositionals: true,
  });

  const task = positionals.join(' ');
  if (!task) {
    process.stderr.write('Error: context requires <task>\n');
    process.exit(1);
  }

  const maxTokens = parseInt(values['max-tokens'] || '4000', 10);
  const client = createClient();
  const response = await safe(() => client.search(task, 20));

  if (response) {
    const md = formatContext(response.results, { task, maxTokens });
    process.stdout.write(md + '\n');
  }
}

async function cmdQuery(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      limit: { type: 'string' },
    },
    allowPositionals: true,
  });

  const text = positionals.join(' ');
  if (!text) {
    process.stderr.write('Error: query requires <text>\n');
    process.exit(1);
  }

  const limit = parseInt(values.limit || '10', 10);
  const client = createClient();
  const response = await safe(() => client.search(text, limit));

  if (response) {
    process.stdout.write(JSON.stringify(response.results, null, 2) + '\n');
  }
}

async function cmdExplain(args: string[]): Promise<void> {
  const { positionals } = parseArgs({
    args,
    options: {},
    allowPositionals: true,
  });

  const query = positionals.join(' ');
  if (!query) {
    process.stderr.write('Error: explain requires <query>\n');
    process.exit(1);
  }

  const client = createClient();

  // Try explain directly; if not found, search and explain first hit
  let result = await safe(() => client.explain(query));
  if (result === null) return; // MnemeBrain unavailable

  if (!result) {
    // Search and explain first hit
    const searchResponse = await safe(() => client.search(query, 1));
    if (searchResponse && searchResponse.results.length > 0) {
      result = await safe(() => client.explain(searchResponse!.results[0].claim));
      if (result === null) return;
    }
  }

  if (result) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } else {
    process.stdout.write(JSON.stringify({ error: 'No matching belief found' }) + '\n');
  }
}

async function cmdRevise(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      evidence: { type: 'string' },
      polarity: { type: 'string' },
      agent: { type: 'string' },
    },
    allowPositionals: true,
  });

  const beliefId = positionals[0];
  if (!beliefId || !values.evidence) {
    process.stderr.write('Error: revise requires <id> and --evidence\n');
    process.exit(1);
  }

  const polarity = values.polarity === 'attacking' ? 'attacks' : 'supports';
  const client = createClient();
  const evidence = new EvidenceInput({
    sourceRef: values.evidence,
    content: values.evidence,
    polarity,
  });

  const result = await safe(() => client.revise(beliefId, evidence));
  if (result) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  }
}

async function cmdRetract(args: string[]): Promise<void> {
  const { positionals } = parseArgs({
    args,
    options: {},
    allowPositionals: true,
  });

  const evidenceId = positionals[0];
  if (!evidenceId) {
    process.stderr.write('Error: retract requires <evidence-id>\n');
    process.exit(1);
  }

  const client = createClient();
  const result = await safe(() => client.retract(evidenceId));
  if (result) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  }
}

async function cmdContradict(): Promise<void> {
  const client = createClient();
  const result = await safe(() => client.listBeliefs({ truthState: 'both' }));
  if (result) {
    process.stdout.write(JSON.stringify(result.beliefs, null, 2) + '\n');
  }
}

async function cmdStats(): Promise<void> {
  const client = createClient();
  const result = await safe(() => client.listBeliefs({ limit: 1000 }));
  if (!result) return;

  const beliefs = result.beliefs;
  const byType: Record<string, number> = {};
  const byState: Record<string, number> = {};

  for (const b of beliefs) {
    byType[b.beliefType] = (byType[b.beliefType] || 0) + 1;
    byState[b.truthState] = (byState[b.truthState] || 0) + 1;
  }

  const stats = {
    total: result.total,
    byType,
    byState,
  };

  process.stdout.write(JSON.stringify(stats, null, 2) + '\n');
}

async function cmdExport(): Promise<void> {
  const client = createClient();
  const result = await safe(() => client.listBeliefs({ limit: 1000 }));
  if (result) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    usage();
    process.exit(0);
  }

  const command = args[0];
  const rest = args.slice(1);

  const commands: Record<string, (args: string[]) => Promise<void>> = {
    believe: cmdBelieve,
    context: cmdContext,
    query: cmdQuery,
    explain: cmdExplain,
    revise: cmdRevise,
    retract: cmdRetract,
    contradict: () => cmdContradict(),
    stats: () => cmdStats(),
    export: () => cmdExport(),
  };

  const handler = commands[command];
  if (!handler) {
    process.stderr.write(`Unknown command: ${command}\n`);
    usage();
    process.exit(1);
  }

  await handler(rest);
}

main();
