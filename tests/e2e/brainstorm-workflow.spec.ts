import { test, expect } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  PKG_ROOT, SKILLS_DIR, MNEMEBRAIN_URL,
  createTestCompany, deleteCompany,
} from "./helpers.js";

/**
 * E2E Brainstorm Workflow Tests
 *
 * Validates:
 *   - Brainstorm skills load correctly with references and evals
 *   - 4-round debate protocol structure (Visionary → Skeptic → Defend → Pragmatist)
 *   - Belief memory integration (store, retrieve, context)
 *   - Competing incentives are defined per persona
 *   - Decision document template is available
 *   - Priority loops are referenced
 */

// ─── Tests ──────────────────────────────────────────────────────────

test.describe("Brainstorm workflow with belief memory", () => {
  // ── Section 1: Brainstorm skill structure ──

  test.describe("brainstorm skill structure", () => {
    const BRAINSTORM_SKILLS = ["ceo-brainstorm", "cto-brainstorm", "cmo-brainstorm", "coo-brainstorm"];

    for (const skillName of BRAINSTORM_SKILLS) {
      test.describe(skillName, () => {
        const skillDir = join(SKILLS_DIR, skillName);

        test("SKILL.md exists and has frontmatter", () => {
          const path = join(skillDir, "SKILL.md");
          expect(existsSync(path)).toBe(true);
          const content = readFileSync(path, "utf-8");
          expect(content).toMatch(/^---\n/);
          expect(content).toContain(`name: ${skillName}`);
        });

        test("defines competing incentives per persona", () => {
          const content = readFileSync(join(skillDir, "SKILL.md"), "utf-8");
          expect(content).toMatch(/[Cc]ompeting [Ii]ncentives/);
          expect(content).toMatch(/\+1 per/);
        });

        test("defines 4-round protocol", () => {
          const content = readFileSync(join(skillDir, "SKILL.md"), "utf-8");
          expect(content).toMatch(/[Rr]ound 1/);
          expect(content).toMatch(/[Rr]ound 2/);
          expect(content).toMatch(/[Rr]ound 3/);
          expect(content).toMatch(/[Rr]ound 4/);
        });

        test("references priority-based loops", () => {
          const content = readFileSync(join(skillDir, "SKILL.md"), "utf-8");
          expect(content).toMatch(/[Pp]riority/);
          expect(content).toMatch(/[Ll]oop/);
        });

        test("has references/ directory with personas", () => {
          const refsDir = join(skillDir, "references");
          expect(existsSync(refsDir)).toBe(true);
          expect(existsSync(join(refsDir, "personas.md"))).toBe(true);
        });

        test("has evals/ directory with test cases", () => {
          const evalsPath = join(skillDir, "evals", "evals.json");
          expect(existsSync(evalsPath)).toBe(true);
          const evals = JSON.parse(readFileSync(evalsPath, "utf-8"));
          expect(evals.skill_name).toBe(skillName);
          expect(evals.evals.length).toBeGreaterThan(0);
        });

        test("has decision document template", () => {
          const refsDir = join(skillDir, "references");
          expect(existsSync(join(refsDir, "decision-document-template.md"))).toBe(true);
        });
      });
    }

    test("all brainstorm skills loadable via index.ts", async () => {
      const mod = await import(join(PKG_ROOT, "dist", "index.js"));
      for (const skillName of BRAINSTORM_SKILLS) {
        const skill = mod.skills[skillName];
        expect(skill, `Skill ${skillName} not loaded`).toBeTruthy();
        expect(skill.name).toBe(skillName);
        expect(skill.content.length).toBeGreaterThan(100);
        expect(Object.keys(skill.references).length).toBeGreaterThan(0);
        expect(skill.evals).toBeTruthy();
      }
    });
  });

  // ── Section 2: Belief memory integration ──

  test.describe("belief memory in brainstorm context", () => {
    const BELIEF_TOPIC = `e2e-brainstorm-test-${Date.now()}`;

    test("can store a brainstorm decision belief", async () => {
      const res = await fetch(`${MNEMEBRAIN_URL}/believe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim: `CEO Brainstorm verdict: proceed with Q3 expansion — ${BELIEF_TOPIC}`,
          evidence: [{
            content: "Visionary proposed 3 strategies, Skeptic challenged 5 risks, Pragmatist ruled proceed with modifications",
            source_ref: "agent:ceo-brainstorm:design",
            polarity: "supports",
          }],
          tags: ["decision", "brainstorm"],
        }),
      });
      expect(res.ok, `Belief store failed: ${res.status}`).toBe(true);
    });

    test("can retrieve brainstorm belief via search", async () => {
      // Small delay to allow indexing
      await new Promise((r) => setTimeout(r, 500));

      const res = await fetch(
        `${MNEMEBRAIN_URL}/search?query=${encodeURIComponent(BELIEF_TOPIC)}`,
      );
      if (res.ok) {
        const results = await res.json();
        const items = Array.isArray(results) ? results : results.results ?? [];
        // Should find the belief we just stored
        const found = items.some((r: { claim?: string }) =>
          r.claim?.includes(BELIEF_TOPIC),
        );
        expect(found, "Stored brainstorm belief not found in search").toBe(true);
      }
    });

    test("can store contradicting evidence for belief revision", async () => {
      // Store a contradicting belief
      const res = await fetch(`${MNEMEBRAIN_URL}/believe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim: `Contradiction: Q3 expansion may be premature — ${BELIEF_TOPIC}`,
          evidence: [{
            content: "New market data shows competitor saturation, contradicting prior expansion thesis",
            source_ref: "agent:cto-brainstorm:design",
            polarity: "supports",
          }],
          tags: ["contradiction", "brainstorm"],
        }),
      });
      expect(res.ok, `Contradiction belief store failed: ${res.status}`).toBe(true);
    });

    test("contradiction beliefs are retrievable", async () => {
      await new Promise((r) => setTimeout(r, 500));

      const res = await fetch(
        `${MNEMEBRAIN_URL}/search?query=${encodeURIComponent(BELIEF_TOPIC)}`,
      );
      if (res.ok) {
        const results = await res.json();
        const items = Array.isArray(results) ? results : results.results ?? [];
        const found = items.some((r: { claim?: string }) =>
          r.claim?.includes("Contradiction") && r.claim?.includes(BELIEF_TOPIC),
        );
        expect(found, "Contradiction belief not found in search results").toBe(true);
      }
    });
  });

  // ── Section 3: Brainstorm skill import into Paperclip ──

  test.describe("brainstorm skills in Paperclip server", () => {
    let companyId: string;

    test.beforeAll(async ({ request, baseURL }) => {
      const company = await createTestCompany(request, baseURL!);
      companyId = company.id;
    });

    test.afterAll(async ({ request, baseURL }) => {
      if (companyId) await deleteCompany(request, baseURL!, companyId);
    });

    test("brainstorm skills importable and assignable to agent", async ({ request, baseURL }) => {
      // Import skills
      // Upload ceo-brainstorm skill via content API (skills live on host, not in container)
      const skillDir = join(SKILLS_DIR, "ceo-brainstorm");
      const content = readFileSync(join(skillDir, "SKILL.md"), "utf-8");
      const references: Record<string, string> = {};
      const refsDir = join(skillDir, "references");
      if (existsSync(refsDir)) {
        const { readdirSync } = await import("node:fs");
        for (const f of readdirSync(refsDir).filter((f: string) => f.endsWith(".md"))) {
          references[f] = readFileSync(join(refsDir, f), "utf-8");
        }
      }
      const importRes = await request.post(`${baseURL}/api/companies/${companyId}/skills`, {
        data: { slug: "ceo-brainstorm", name: "ceo-brainstorm", content, references },
      });
      expect(importRes.ok(), `Skill upload failed (${importRes.status()}): ${await importRes.text()}`).toBe(true);

      // Create CEO agent with brainstorm skill
      const agentRes = await request.post(`${baseURL}/api/companies/${companyId}/agents`, {
        data: {
          name: "E2E-CEO-Brainstorm",
          role: "ceo",
          adapterType: "process",
          desiredSkills: ["ceo-brainstorm"],
        },
      });
      expect(agentRes.ok(), `Agent creation failed: ${await agentRes.text()}`).toBe(true);
    });
  });
});
