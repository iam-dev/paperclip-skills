import { execFileSync, type ExecFileSyncOptions } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const COMPOSE_DIR = dirname(fileURLToPath(import.meta.url));
const COMPOSE_FILE = join(COMPOSE_DIR, "docker-compose.yml");
const PROJECT_NAME = "paperclip-skills-e2e";
const SETUP_STATE_FILE = join(COMPOSE_DIR, ".setup-state.json");

const execOpts: ExecFileSyncOptions = {
  cwd: COMPOSE_DIR,
  stdio: "inherit",
  timeout: 60_000,
};

async function deleteSetupCompany() {
  if (!existsSync(SETUP_STATE_FILE)) return;
  try {
    const state = JSON.parse(readFileSync(SETUP_STATE_FILE, "utf-8"));
    await fetch(`${state.paperclipUrl}/api/companies/${state.companyId}`, { method: "DELETE" });
  } catch {
    // best-effort cleanup
  }
  unlinkSync(SETUP_STATE_FILE);
}

export default async function globalTeardown() {
  const keepAlive = process.env.E2E_KEEP_SERVICES === "true";

  await deleteSetupCompany();

  if (keepAlive) {
    console.log("[global-teardown] E2E_KEEP_SERVICES=true — leaving containers running.");
    return;
  }

  console.log("[global-teardown] Stopping and removing containers...");
  execFileSync(
    "docker",
    ["compose", "-f", COMPOSE_FILE, "-p", PROJECT_NAME, "down", "--volumes", "--remove-orphans"],
    execOpts,
  );
  console.log("[global-teardown] Cleanup complete.");
}
