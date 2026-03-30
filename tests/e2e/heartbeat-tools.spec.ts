import { test, expect } from "@playwright/test";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PKG_ROOT, AGENTS_DIR, DEBATE_DIR, parseFrontmatter } from "./helpers.js";

/**
 * E2E Heartbeat and Tool Usage Tests
 *
 * Validates:
 *   - Every agent has a HEARTBEAT.md with actionable checklist
 *   - Every agent has a TOOLS.md with tool inventory
 *   - Sub-agent frontmatter defines allowed tools
 *   - Tool scope enforcement (read-only for reviewers, etc.)
 *   - Heartbeat checklists reference correct scripts and tools
 *   - Belief engine CLI is properly defined as a tool
 */

// ─── Tests ──────────────────────────────────────────────────────────

test.describe("Heartbeats and tool usage", () => {
  // ── Section 1: Agent heartbeats ──

  test.describe("agent heartbeat validation", () => {
    const AGENT_DIRS = existsSync(AGENTS_DIR)
      ? readdirSync(AGENTS_DIR, { withFileTypes: true })
          .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
          .map((e) => e.name)
      : [];

    for (const agentName of AGENT_DIRS) {
      test(`${agentName} has HEARTBEAT.md`, () => {
        const path = join(AGENTS_DIR, agentName, "HEARTBEAT.md");
        expect(existsSync(path), `${agentName} missing HEARTBEAT.md`).toBe(true);
      });

      test(`${agentName} HEARTBEAT.md has numbered steps`, () => {
        const path = join(AGENTS_DIR, agentName, "HEARTBEAT.md");
        if (existsSync(path)) {
          const content = readFileSync(path, "utf-8");
          // Should have numbered steps (## 1., ## 2., etc.)
          expect(content).toMatch(/## \d+\./);
        }
      });
    }

    test("debate HEARTBEAT.md has all 6 steps", () => {
      const content = readFileSync(join(DEBATE_DIR, "HEARTBEAT.md"), "utf-8");
      expect(content).toContain("## 1.");
      expect(content).toContain("## 2.");
      expect(content).toContain("## 3.");
      expect(content).toContain("## 4.");
      expect(content).toContain("## 5.");
      expect(content).toContain("## 6.");
    });
  });

  // ── Section 2: Agent tool inventories ──

  test.describe("agent tool inventories", () => {
    const AGENT_DIRS = existsSync(AGENTS_DIR)
      ? readdirSync(AGENTS_DIR, { withFileTypes: true })
          .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
          .map((e) => e.name)
      : [];

    for (const agentName of AGENT_DIRS) {
      test(`${agentName} has TOOLS.md`, () => {
        const path = join(AGENTS_DIR, agentName, "TOOLS.md");
        expect(existsSync(path), `${agentName} missing TOOLS.md`).toBe(true);
      });
    }

    test("debate TOOLS.md defines belief engine commands", () => {
      const content = readFileSync(join(DEBATE_DIR, "TOOLS.md"), "utf-8");
      expect(content).toContain("context"); // Load context command
      expect(content).toContain("believe"); // Record results command
      expect(content).toContain("contradict"); // Surface contradictions
    });

    test("debate TOOLS.md defines state tracker commands", () => {
      const content = readFileSync(join(DEBATE_DIR, "TOOLS.md"), "utf-8");
      expect(content).toContain("adversarial-report");
      expect(content).toContain("qa-round");
      expect(content).toContain("check-qa-regression");
    });

    test("debate TOOLS.md defines PARA memory commands", () => {
      const content = readFileSync(join(DEBATE_DIR, "TOOLS.md"), "utf-8");
      expect(content).toContain("qmd");
      expect(content).toContain("para-memory-files");
    });
  });

  // ── Section 3: Sub-agent tool scope ──

  test.describe("sub-agent tool scope enforcement", () => {
    const READ_ONLY_AGENTS = [
      { path: "adversarial-review/review-finder.md", name: "review-finder" },
      { path: "adversarial-review/review-adversary.md", name: "review-adversary" },
      { path: "adversarial-review/review-referee.md", name: "review-referee" },
      { path: "eval/eval-advocate.md", name: "eval-advocate" },
      { path: "eval/eval-critic.md", name: "eval-critic" },
      { path: "eval/eval-arbiter.md", name: "eval-arbiter" },
      { path: "skill/skill-advocate.md", name: "skill-advocate" },
      { path: "skill/skill-critic.md", name: "skill-critic" },
      { path: "skill/skill-arbiter.md", name: "skill-arbiter" },
    ];

    for (const { path, name } of READ_ONLY_AGENTS) {
      test(`${name} defines tools in frontmatter`, () => {
        const content = readFileSync(join(DEBATE_DIR, path), "utf-8");
        const meta = parseFrontmatter(content);
        expect(meta.tools, `${name} missing tools in frontmatter`).toBeTruthy();
        const tools = meta.tools.split(",").map((t) => t.trim());
        expect(tools.length).toBeGreaterThan(0);
      });

      test(`${name} has read-only tool scope`, () => {
        const content = readFileSync(join(DEBATE_DIR, path), "utf-8");
        // All debate sub-agents should have read-only tool scope
        expect(content).toMatch(/[Rr]ead-only/);
        expect(content).toMatch(/AVOID.*Write|AVOID.*Edit/);
      });

      test(`${name} includes Read and Grep in tools`, () => {
        const content = readFileSync(join(DEBATE_DIR, path), "utf-8");
        const meta = parseFrontmatter(content);
        const tools = meta.tools.split(",").map((t) => t.trim());
        expect(tools).toContain("Read");
        expect(tools).toContain("Grep");
      });
    }
  });

  // ── Section 4: Belief engine CLI tool definition ──

  test.describe("belief engine CLI", () => {
    test("belief-engine.ts compiles to dist", async () => {
      expect(existsSync(join(PKG_ROOT, "dist", "cli", "belief-engine.js"))).toBe(true);
    });

    test("belief-engine is defined as CLI bin in package.json", () => {
      const pkg = JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf-8"));
      expect(pkg.bin["belief-engine"]).toBe("dist/cli/belief-engine.js");
    });

    test("belief-engine.ts has all required commands", () => {
      const content = readFileSync(join(PKG_ROOT, "src", "cli", "belief-engine.ts"), "utf-8");
      const expectedCommands = ["believe", "context", "query", "explain", "revise", "retract", "contradict", "stats", "export"];
      for (const cmd of expectedCommands) {
        expect(content, `belief-engine missing command: ${cmd}`).toContain(cmd);
      }
    });

    test("belief-engine.ts has graceful degradation (safe wrapper)", () => {
      const content = readFileSync(join(PKG_ROOT, "src", "cli", "belief-engine.ts"), "utf-8");
      expect(content).toContain("async function safe");
      expect(content).toContain("MnemeBrain unavailable");
    });
  });

  // ── Section 5: Heartbeat references tools correctly ──

  test.describe("heartbeat-tool cross-references", () => {
    test("debate HEARTBEAT references belief engine from TOOLS", () => {
      const heartbeat = readFileSync(join(DEBATE_DIR, "HEARTBEAT.md"), "utf-8");
      // HEARTBEAT should reference TOOLS.md
      expect(heartbeat).toContain("TOOLS.md");
    });

    test("debate HEARTBEAT references dispatch of all 3 flows", () => {
      const heartbeat = readFileSync(join(DEBATE_DIR, "HEARTBEAT.md"), "utf-8");
      expect(heartbeat).toContain("review-finder");
      expect(heartbeat).toContain("eval-advocate");
      expect(heartbeat).toContain("skill-advocate");
    });

    test("debate HEARTBEAT references state recording verification", () => {
      const heartbeat = readFileSync(join(DEBATE_DIR, "HEARTBEAT.md"), "utf-8");
      expect(heartbeat).toContain("Verify State Recording");
      expect(heartbeat).toContain("state-tracker.sh");
    });
  });
});
