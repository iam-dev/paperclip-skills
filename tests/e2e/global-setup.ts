import { execFileSync, type ExecFileSyncOptions } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const COMPOSE_DIR = dirname(fileURLToPath(import.meta.url));
const COMPOSE_FILE = join(COMPOSE_DIR, "docker-compose.yml");
const PKG_ROOT = join(COMPOSE_DIR, "..", "..");
const INSTALL_SCRIPT = join(PKG_ROOT, "scripts", "install.sh");
const PROJECT_NAME = "paperclip-skills-e2e";
const SETUP_STATE_FILE = join(COMPOSE_DIR, ".setup-state.json");

function docker(timeoutMs: number, ...args: string[]) {
  execFileSync("docker", ["compose", "-f", COMPOSE_FILE, "-p", PROJECT_NAME, ...args], {
    cwd: COMPOSE_DIR,
    stdio: "inherit",
    timeout: timeoutMs,
  });
}

async function waitForHealth(url: string, timeoutMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 2_000));
  }
  throw new Error(`Service at ${url} did not become healthy within ${timeoutMs}ms`);
}

async function createCompany(paperclipUrl: string): Promise<string> {
  const res = await fetch(`${paperclipUrl}/api/companies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "E2E-Setup" }),
  });
  if (!res.ok) throw new Error(`Failed to create company: ${res.status}`);
  const data = await res.json() as { id: string };
  return data.id;
}

function runInstall(paperclipUrl: string, mnemebrainUrl: string, companyId: string) {
  execFileSync("bash", [INSTALL_SCRIPT, "--url", paperclipUrl, "--company-id", companyId], {
    cwd: PKG_ROOT,
    stdio: "inherit",
    timeout: 60_000,
    env: { ...process.env, PAPERCLIP_URL: paperclipUrl, MNEMEBRAIN_URL: mnemebrainUrl },
  });
}

export default async function globalSetup() {
  const paperclipPort = process.env.PAPERCLIP_PORT ?? "3199";
  const mnemebrainPort = process.env.MNEMEBRAIN_PORT ?? "8000";
  const paperclipUrl = `http://127.0.0.1:${paperclipPort}`;
  const mnemebrainUrl = `http://127.0.0.1:${mnemebrainPort}`;

  console.log("\n[global-setup] Building images (this may take a while)...");
  docker(600_000, "build");

  console.log("[global-setup] Starting services...");
  docker(60_000, "up", "-d");

  console.log("[global-setup] Waiting for Paperclip health...");
  await waitForHealth(`${paperclipUrl}/api/health`);

  console.log("[global-setup] Waiting for MnemeBrain health...");
  await waitForHealth(`${mnemebrainUrl}/health`);

  console.log("[global-setup] All services healthy.");

  console.log("[global-setup] Creating company and running install script...");
  const companyId = await createCompany(paperclipUrl);
  runInstall(paperclipUrl, mnemebrainUrl, companyId);

  // Persist setup state so tests and teardown can reference it
  writeFileSync(SETUP_STATE_FILE, JSON.stringify({ companyId, paperclipUrl, mnemebrainUrl }));

  console.log(`[global-setup] Install complete. Company: ${companyId}\n`);
}
