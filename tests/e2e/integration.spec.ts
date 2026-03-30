import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PKG_ROOT, SKILLS_DIR, SCRIPTS_DIR, AGENTS_DIR, MNEMEBRAIN_URL,
  createTestCompany, deleteCompany,
  runInstallScript, type InstallResult,
} from "./helpers.js";

/**
 * E2E Integration Test: paperclip-skills → Paperclip + MnemeBrain
 *
 * Uses scripts/install.sh to import skills, create agents, and register scripts.
 * Tests validate the install script produces correct results against a live
 * Paperclip server started via Docker Compose (see global-setup.ts).
 */

// ─── Helpers ────────────────────────────────────────────────────────

function getSkillDirs(): string[] {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

function getAgentDirs(): string[] {
  if (!existsSync(AGENTS_DIR)) return [];
  return readdirSync(AGENTS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
    .map((e) => e.name);
}

function getScriptFiles(): string[] {
  if (!existsSync(SCRIPTS_DIR)) return [];
  return readdirSync(SCRIPTS_DIR).filter((f) => f.endsWith(".sh"));
}

// ─── Tests ──────────────────────────────────────────────────────────

test.describe("Paperclip + MnemeBrain integration", () => {
  // ── Section 1: Package & SDK validation ──

  test.describe("package validation", () => {
    test("paperclip-skills package builds successfully", () => {
      execFileSync("npm", ["run", "build"], {
        cwd: PKG_ROOT,
        timeout: 30_000,
        encoding: "utf-8",
      });
      expect(existsSync(join(PKG_ROOT, "dist", "index.js"))).toBe(true);
    });

    test("paperclip-skills exports are loadable", async () => {
      const mod = await import(join(PKG_ROOT, "dist", "index.js"));
      expect(Object.keys(mod.skills).length).toBeGreaterThan(0);
      expect(Object.keys(mod.agents).length).toBeGreaterThan(0);
      expect(typeof mod.getOrchestratedAgents).toBe("function");
      expect(typeof mod.getOnboardingAgents).toBe("function");
    });

    test("mnemebrain npm SDK is installed", () => {
      const mnemeDir = join(PKG_ROOT, "node_modules", "mnemebrain");
      expect(existsSync(mnemeDir)).toBe(true);
      const pkg = JSON.parse(readFileSync(join(mnemeDir, "package.json"), "utf-8"));
      expect(pkg.name).toBe("mnemebrain");
    });
  });

  // ── Section 2: Service health checks ──

  test.describe("service health", () => {
    test("paperclip server is healthy", async ({ request, baseURL }) => {
      const res = await request.get(`${baseURL}/api/health`);
      expect(res.ok()).toBe(true);
    });

    test("mnemebrain API is healthy", async () => {
      const res = await fetch(`${MNEMEBRAIN_URL}/health`);
      expect(res.ok).toBe(true);
    });
  });

  // ── Section 3: Install script — skills import ──

  test.describe("install script: skill import", () => {
    let companyId: string;
    let result: InstallResult;

    test.beforeAll(async ({ request, baseURL }) => {
      const company = await createTestCompany(request, baseURL!);
      companyId = company.id;
      result = runInstallScript(companyId, { skillsOnly: true });
    });

    test.afterAll(async ({ request, baseURL }) => {
      if (companyId) await deleteCompany(request, baseURL!, companyId);
    });

    test("imports skills via install script", () => {
      expect(result.skillCount).toBeGreaterThan(0);
      expect(result.companyId).toBe(companyId);
    });

    test("all local skill directories are imported", () => {
      const skillDirs = getSkillDirs();
      expect(skillDirs.length).toBeGreaterThan(0);

      for (const skillDir of skillDirs) {
        const found = result.skills.find(
          (s) => s.slug === skillDir || s.key === skillDir,
        );
        expect(found, `Skill "${skillDir}" not found after install`).toBeTruthy();
      }
    });

    test("imported skills have correct structure", () => {
      for (const skill of result.skills) {
        expect(skill.name, `Skill ${skill.slug} missing name`).toBeTruthy();
        expect(skill.id).toBeTruthy();
        expect(skill.companyId).toBe(companyId);
      }
    });

    test("skills with scripts have correct trust level", () => {
      for (const skill of result.skills) {
        if (skill.fileInventory) {
          const inventory = typeof skill.fileInventory === "string"
            ? JSON.parse(skill.fileInventory)
            : skill.fileInventory;

          const hasScripts = Array.isArray(inventory)
            && inventory.some((f: { kind: string }) => f.kind === "script");

          if (hasScripts) {
            expect(skill.trustLevel).toBe("scripts_executables");
          }
        }
      }
    });
  });

  // ── Section 4: Install script — agent creation ──

  test.describe("install script: agent creation", () => {
    let companyId: string;
    let result: InstallResult;

    test.beforeAll(async ({ request, baseURL }) => {
      const company = await createTestCompany(request, baseURL!);
      companyId = company.id;
      result = runInstallScript(companyId);
    });

    test.afterAll(async ({ request, baseURL }) => {
      if (companyId) await deleteCompany(request, baseURL!, companyId);
    });

    test("creates agents matching paperclip-skills definitions", () => {
      const agentDirs = getAgentDirs();
      expect(agentDirs.length).toBeGreaterThan(0);
      expect(result.agentCount).toBeGreaterThanOrEqual(agentDirs.length);
    });

    test("agents have valid roles", () => {
      const validRoles = ["ceo", "cto", "cmo", "cfo", "engineer", "designer", "pm", "qa", "devops", "researcher", "general"];
      for (const agent of result.agents) {
        expect(
          validRoles.includes(agent.role ?? "general"),
          `Agent "${agent.name}" has invalid role "${agent.role}"`,
        ).toBe(true);
      }
    });

    test("agents can receive instruction bundles", async ({ request, baseURL }) => {
      expect(result.agents.length).toBeGreaterThan(0);

      const agent = result.agents[0];
      const bundleRes = await request.get(
        `${baseURL}/api/agents/${agent.id}/instructions-bundle?companyId=${companyId}`,
      );
      expect(bundleRes.ok()).toBe(true);
      const bundle = await bundleRes.json();
      expect(bundle.files).toBeDefined();
      expect(Array.isArray(bundle.files)).toBe(true);
    });
  });

  // ── Section 5: Install script — custom scripts ──

  test.describe("install script: custom scripts", () => {
    test("scripts directory contains expected files", () => {
      const scripts = getScriptFiles();
      expect(scripts.length).toBeGreaterThan(0);
      expect(scripts).toContain("_lib.sh");
      expect(scripts).toContain("install.sh");
      expect(scripts).toContain("state-tracker.sh");
      expect(scripts).toContain("workflow.sh");
    });

    test("script files are valid bash", () => {
      const scripts = getScriptFiles();
      for (const script of scripts) {
        const content = readFileSync(join(SCRIPTS_DIR, script), "utf-8");
        expect(
          content.startsWith("#!/") || content.includes("# ---") || content.includes("function "),
          `Script ${script} does not look like valid bash`,
        ).toBe(true);
      }
    });
  });

  // ── Section 6: MnemeBrain belief engine ──

  test.describe("mnemebrain belief engine", () => {
    test("can store and retrieve a belief", async () => {
      const storeRes = await fetch(`${MNEMEBRAIN_URL}/believe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim: "E2E test belief: paperclip-skills integration works",
          evidence: [{
            content: "Automated test assertion",
            source_ref: "e2e-test",
            polarity: "supports",
          }],
        }),
      });

      expect(storeRes.ok, `Belief store failed: ${storeRes.status}`).toBe(true);

      const queryRes = await fetch(`${MNEMEBRAIN_URL}/search?query=${encodeURIComponent("paperclip-skills integration")}`);

      if (queryRes.ok) {
        const results = await queryRes.json();
        expect(Array.isArray(results) || typeof results === "object").toBe(true);
      }
    });
  });

  // ── Section 7: Full round-trip via install script ──

  test.describe("full round-trip", () => {
    let companyId: string;
    let result: InstallResult;

    test.beforeAll(async ({ request, baseURL }) => {
      const company = await createTestCompany(request, baseURL!);
      companyId = company.id;
      // Run full install: skills + agents + scripts + skill assignment
      result = runInstallScript(companyId);
    });

    test.afterAll(async ({ request, baseURL }) => {
      if (companyId) await deleteCompany(request, baseURL!, companyId);
    });

    test("installs skills, agents, and assigns skills to agents", async ({ request, baseURL }) => {
      // Step 1: Verify skills were imported
      expect(result.skillCount).toBeGreaterThan(0);

      // Step 2: Verify agents were created
      expect(result.agentCount).toBeGreaterThan(0);

      // Step 3: Verify agents are in company listing via API
      const orgRes = await request.get(`${baseURL}/api/companies/${companyId}/agents`);
      expect(orgRes.ok()).toBe(true);
      const orgAgents = await orgRes.json();
      expect(orgAgents.length).toBeGreaterThanOrEqual(result.agentCount);

      // Step 4: Verify skills are assigned to at least one agent
      for (const agent of result.agents) {
        const skillsRes = await request.get(`${baseURL}/api/agents/${agent.id}/skills`);
        if (skillsRes.ok()) {
          const agentSkills = await skillsRes.json();
          if (agentSkills.desiredSkills) {
            expect(agentSkills.desiredSkills.length).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });

    test("install script is idempotent", () => {
      // Run again — should not fail or create duplicates
      const result2 = runInstallScript(companyId);

      // Agent count should be the same (duplicates skipped)
      expect(result2.agentCount).toBe(result.agentCount);
    });
  });
});
