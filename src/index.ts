import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
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

/** Orchestrated agent with onboarding assets AND sub-agents (debate) */
export interface OrchestratedAgent {
  type: 'orchestrated';
  agents: string;
  soul: string;
  heartbeat: string;
  tools: string;
  subAgents: Record<string, AgentDefinition>;
}

/** @deprecated Use OrchestratedAgent instead. Kept for backwards compatibility. */
export interface DebateAgentGroup {
  type: 'debate';
  readme: string;
  agents: Record<string, AgentDefinition>;
}

/** Shared protocols referenced by agents */
export interface SharedProtocols {
  [filename: string]: string;
}

export type AgentEntry = OnboardingAgent | OrchestratedAgent | DebateAgentGroup;

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

const ONBOARDING_FILES = new Set(['AGENTS.md', 'SOUL.md', 'HEARTBEAT.md', 'TOOLS.md', 'README.md']);

function getSubAgentFiles(dirPath: string): string[] {
  return readdirSync(dirPath).filter(f => extname(f) === '.md' && !ONBOARDING_FILES.has(f));
}

function hasSubAgentDirs(dirPath: string): boolean {
  return readdirSync(dirPath, { withFileTypes: true }).some(
    e => e.isDirectory() && !e.name.startsWith('_')
  );
}

function classifyAgentDir(dirPath: string): 'orchestrated' | 'debate' | 'onboarding' {
  const hasAgentsMd = existsSync(join(dirPath, 'AGENTS.md'));
  const hasReadme = existsSync(join(dirPath, 'README.md'));
  const topLevelSubAgents = getSubAgentFiles(dirPath);

  // Has AGENTS.md + sub-agent .md files or subdirectories → orchestrated
  if (hasAgentsMd && (topLevelSubAgents.length > 0 || hasSubAgentDirs(dirPath))) return 'orchestrated';
  // Has README.md but no AGENTS.md → legacy debate group
  if (hasReadme && !hasAgentsMd) return 'debate';
  // Has AGENTS.md only → onboarding
  return 'onboarding';
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

function loadOrchestratedAgent(agentDir: string): OrchestratedAgent {
  const subAgents: Record<string, AgentDefinition> = {};

  // Load sub-agent .md files from the top level
  for (const file of getSubAgentFiles(agentDir)) {
    const name = file.replace('.md', '');
    subAgents[name] = parseAgentDefinition(join(agentDir, file));
  }

  // Load sub-agent .md files from subdirectories
  for (const entry of readdirSync(agentDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const subDir = join(agentDir, entry.name);
    for (const file of readdirSync(subDir)) {
      if (extname(file) !== '.md') continue;
      const name = file.replace('.md', '');
      subAgents[name] = parseAgentDefinition(join(subDir, file));
    }
  }

  return {
    type: 'orchestrated',
    agents: readIfExists(join(agentDir, 'AGENTS.md')),
    soul: readIfExists(join(agentDir, 'SOUL.md')),
    heartbeat: readIfExists(join(agentDir, 'HEARTBEAT.md')),
    tools: readIfExists(join(agentDir, 'TOOLS.md')),
    subAgents,
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
    const kind = classifyAgentDir(dirPath);
    if (kind === 'orchestrated') {
      result[entry.name] = loadOrchestratedAgent(dirPath);
    } else if (kind === 'debate') {
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

/** Get all orchestrated agents (agents with AGENTS.md + sub-agents) */
export function getOrchestratedAgents(): Record<string, OrchestratedAgent> {
  const result: Record<string, OrchestratedAgent> = {};
  for (const [name, agent] of Object.entries(agents)) {
    if (agent.type === 'orchestrated') result[name] = agent;
  }
  return result;
}

/** @deprecated Use getOrchestratedAgents instead. Kept for backwards compatibility. */
export function getDebateGroups(): Record<string, DebateAgentGroup | OrchestratedAgent> {
  const result: Record<string, DebateAgentGroup | OrchestratedAgent> = {};
  for (const [name, agent] of Object.entries(agents)) {
    if (agent.type === 'debate' || agent.type === 'orchestrated') result[name] = agent;
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

/** Get a specific sub-agent definition by name */
export function getSubAgent(groupName: string, agentName: string): AgentDefinition | null {
  const group = agents[groupName];
  if (!group) return null;
  if (group.type === 'orchestrated') return group.subAgents[agentName] || null;
  if (group.type === 'debate') return group.agents[agentName] || null;
  return null;
}

/** @deprecated Use getSubAgent instead */
export function getDebateAgent(groupName: string, agentName: string): AgentDefinition | null {
  return getSubAgent(groupName, agentName);
}
