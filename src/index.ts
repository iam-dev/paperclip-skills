import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';

const PKG_ROOT = resolve(__dirname, '..');

// --- Skill types ---

export interface SkillReference {
  [filename: string]: string;
}

export interface SkillEval {
  skill_name: string;
  evals: Array<{
    id: number;
    prompt: string;
    expected_output: string;
    files: string[];
    assertions: Array<{ id: string; text: string }>;
  }>;
}

export interface Skill {
  name: string;
  content: string;
  references: SkillReference;
  evals: SkillEval | null;
}

// --- Agent types ---

/** C-suite agent with structured onboarding assets (CEO, CTO, CMO, COO) */
export interface OnboardingAgent {
  type: 'onboarding';
  agents: string;
  soul: string;
  heartbeat: string;
  tools: string;
}

/** Individual agent definition parsed from a markdown file with frontmatter */
export interface AgentDefinition {
  name: string;
  description: string;
  model: string;
  tools: string[];
  content: string;
}

/** Debate agent group (adversarial-review, eval-debate, skill-debate) */
export interface DebateAgentGroup {
  type: 'debate';
  readme: string;
  agents: Record<string, AgentDefinition>;
}

/** Shared protocols referenced by agents */
export interface SharedProtocols {
  [filename: string]: string;
}

export type AgentEntry = OnboardingAgent | DebateAgentGroup;

// --- Loaders ---

function readIfExists(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf-8') : '';
}

function parseFrontmatter(content: string): { meta: Record<string, string>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  return { meta, body: match[2] };
}

function parseAgentDefinition(filePath: string): AgentDefinition {
  const content = readFileSync(filePath, 'utf-8');
  const { meta, body } = parseFrontmatter(content);
  return {
    name: meta.name || '',
    description: meta.description || '',
    model: meta.model || '',
    tools: (meta.tools || '').split(',').map(t => t.trim()).filter(Boolean),
    content: body,
  };
}

function isDebateDir(dirPath: string): boolean {
  // Debate dirs have a README.md + multiple .md agent files (no AGENTS.md)
  const hasReadme = existsSync(join(dirPath, 'README.md'));
  const hasAgentsMd = existsSync(join(dirPath, 'AGENTS.md'));
  return hasReadme && !hasAgentsMd;
}

function loadOnboardingAgent(agentDir: string): OnboardingAgent {
  return {
    type: 'onboarding',
    agents: readIfExists(join(agentDir, 'AGENTS.md')),
    soul: readIfExists(join(agentDir, 'SOUL.md')),
    heartbeat: readIfExists(join(agentDir, 'HEARTBEAT.md')),
    tools: readIfExists(join(agentDir, 'TOOLS.md')),
  };
}

function loadDebateAgentGroup(agentDir: string): DebateAgentGroup {
  const readme = readIfExists(join(agentDir, 'README.md'));
  const agents: Record<string, AgentDefinition> = {};

  for (const file of readdirSync(agentDir)) {
    if (file === 'README.md') continue;
    if (extname(file) !== '.md') continue;
    const name = file.replace('.md', '');
    agents[name] = parseAgentDefinition(join(agentDir, file));
  }

  return { type: 'debate', readme, agents };
}

function loadSkill(skillDir: string): Skill {
  const content = readFileSync(join(skillDir, 'SKILL.md'), 'utf-8');
  const nameMatch = content.match(/^name:\s*(.+)$/m);
  const name = nameMatch ? nameMatch[1].trim() : '';

  const references: SkillReference = {};
  const refsDir = join(skillDir, 'references');
  if (existsSync(refsDir)) {
    for (const file of readdirSync(refsDir)) {
      references[file] = readFileSync(join(refsDir, file), 'utf-8');
    }
  }

  let evals: SkillEval | null = null;
  const evalsPath = join(skillDir, 'evals', 'evals.json');
  if (existsSync(evalsPath)) {
    evals = JSON.parse(readFileSync(evalsPath, 'utf-8'));
  }

  return { name, content, references, evals };
}

function loadSharedProtocols(dir: string): SharedProtocols {
  const result: SharedProtocols = {};
  if (!existsSync(dir)) return result;
  for (const file of readdirSync(dir)) {
    if (extname(file) === '.md') {
      result[file] = readFileSync(join(dir, file), 'utf-8');
    }
  }
  return result;
}

// --- Main exports ---

function loadSkills(): Record<string, Skill> {
  const result: Record<string, Skill> = {};
  const baseDir = join(PKG_ROOT, 'skills');
  if (!existsSync(baseDir)) return result;
  for (const entry of readdirSync(baseDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      result[entry.name] = loadSkill(join(baseDir, entry.name));
    }
  }
  return result;
}

function loadAgents(): Record<string, AgentEntry> {
  const result: Record<string, AgentEntry> = {};
  const baseDir = join(PKG_ROOT, 'agents');
  if (!existsSync(baseDir)) return result;
  for (const entry of readdirSync(baseDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const dirPath = join(baseDir, entry.name);
    if (isDebateDir(dirPath)) {
      result[entry.name] = loadDebateAgentGroup(dirPath);
    } else {
      result[entry.name] = loadOnboardingAgent(dirPath);
    }
  }
  return result;
}

export const skills: Record<string, Skill> = loadSkills();
export const agents: Record<string, AgentEntry> = loadAgents();
export const shared: SharedProtocols = loadSharedProtocols(join(PKG_ROOT, 'agents', '_shared'));

// --- Convenience helpers ---

/** Get all debate agent groups */
export function getDebateGroups(): Record<string, DebateAgentGroup> {
  const result: Record<string, DebateAgentGroup> = {};
  for (const [name, agent] of Object.entries(agents)) {
    if (agent.type === 'debate') result[name] = agent;
  }
  return result;
}

/** Get all onboarding agents */
export function getOnboardingAgents(): Record<string, OnboardingAgent> {
  const result: Record<string, OnboardingAgent> = {};
  for (const [name, agent] of Object.entries(agents)) {
    if (agent.type === 'onboarding') result[name] = agent;
  }
  return result;
}

/** Get a specific agent definition from a debate group by name */
export function getDebateAgent(groupName: string, agentName: string): AgentDefinition | null {
  const group = agents[groupName];
  if (!group || group.type !== 'debate') return null;
  return group.agents[agentName] || null;
}
