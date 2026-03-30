import { type APIRequestContext, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PKG_ROOT = join(__dirname, "..", "..");
export const AGENTS_DIR = join(PKG_ROOT, "agents");
export const SHARED_DIR = join(AGENTS_DIR, "_shared");
export const SCRIPTS_DIR = join(PKG_ROOT, "scripts");
export const SKILLS_DIR = join(PKG_ROOT, "skills");
export const DEBATE_DIR = join(AGENTS_DIR, "debate");

export const MNEMEBRAIN_PORT = Number(process.env.MNEMEBRAIN_PORT ?? 8000);
export const MNEMEBRAIN_URL = `http://127.0.0.1:${MNEMEBRAIN_PORT}`;

// ─── Frontmatter parser ─────────────────────────────────────────────

export function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  return meta;
}

// ─── Paperclip API helpers ──────────────────────────────────────────

export async function createTestCompany(request: APIRequestContext, baseURL: string) {
  const res = await request.post(`${baseURL}/api/companies`, {
    data: { name: `E2E-Test-${Date.now()}` },
  });
  expect(res.ok(), `Failed to create company: ${res.status()}`).toBe(true);
  return res.json();
}

export async function deleteCompany(request: APIRequestContext, baseURL: string, id: string) {
  await request.delete(`${baseURL}/api/companies/${id}`);
}

// ─── Script execution helpers ───────────────────────────────────────

export function runScript(script: string, args: string[], env: Record<string, string> = {}): string {
  try {
    return execFileSync("bash", [join(SCRIPTS_DIR, script), ...args], {
      cwd: PKG_ROOT,
      encoding: "utf-8",
      timeout: 10_000,
      env: { ...process.env, ...env },
    }).trim();
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string };
    return (e.stdout?.trim() ?? "") + (e.stderr?.trim() ?? "");
  }
}

export function runScriptWithExit(
  script: string,
  args: string[],
  env: Record<string, string> = {},
): { stdout: string; exitCode: number } {
  try {
    const stdout = execFileSync("bash", [join(SCRIPTS_DIR, script), ...args], {
      cwd: PKG_ROOT,
      encoding: "utf-8",
      timeout: 10_000,
      env: { ...process.env, ...env },
    }).trim();
    return { stdout, exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: (e.stdout?.trim() ?? "") + (e.stderr?.trim() ?? ""),
      exitCode: e.status ?? 1,
    };
  }
}

// ─── Install script helpers ──────────────────────────────────────────

export const PAPERCLIP_PORT = Number(process.env.PAPERCLIP_PORT ?? 3199);
export const PAPERCLIP_URL = `http://127.0.0.1:${PAPERCLIP_PORT}`;

export interface InstallResult {
  companyId: string;
  paperclipUrl: string;
  mnemebrainUrl: string;
  skills: Array<{ id: string; slug?: string; key?: string; name?: string; companyId?: string; fileInventory?: string; trustLevel?: string }>;
  agents: Array<{ id: string; name: string; role?: string }>;
  skillCount: number;
  agentCount: number;
}

/**
 * Run scripts/install.sh with --json output and return parsed results.
 *
 * @param companyId  Company ID to install into
 * @param opts       Additional options (sourcePath for Docker-mounted paths, flags)
 */
export function runInstallScript(
  companyId: string,
  opts: {
    sourcePath?: string;
    skillsOnly?: boolean;
    agentsOnly?: boolean;
    noAssign?: boolean;
  } = {},
): InstallResult {
  const args = [
    "--url", PAPERCLIP_URL,
    "--company-id", companyId,
    "--json",
  ];

  if (opts.sourcePath) args.push("--source-path", opts.sourcePath);
  if (opts.skillsOnly) args.push("--skills-only");
  if (opts.agentsOnly) args.push("--agents-only");
  if (opts.noAssign) args.push("--no-assign");

  const raw = execFileSync("bash", [join(SCRIPTS_DIR, "install.sh"), ...args], {
    cwd: PKG_ROOT,
    encoding: "utf-8",
    timeout: 60_000,
    env: { ...process.env, PAPERCLIP_URL, MNEMEBRAIN_URL },
  });

  // The JSON output is the last block — extract it (skip log lines)
  const jsonStart = raw.indexOf("{");
  if (jsonStart === -1) throw new Error(`install.sh did not produce JSON output:\n${raw}`);
  return JSON.parse(raw.slice(jsonStart));
}
