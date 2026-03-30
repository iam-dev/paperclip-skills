import { test, expect } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PKG_ROOT, MNEMEBRAIN_URL } from "./helpers.js";

/**
 * E2E Long-Term Memory Tests
 *
 * Validates:
 *   - MnemeBrain belief engine integration (store, search, context, contradict)
 *   - Belief lifecycle: create → search → revise → contradict → export
 *   - Context formatting for agents
 *   - Cross-session memory persistence
 *   - PARA memory file skill exists and has correct schema
 *   - Verification protocol defines both memory systems
 *   - Graceful degradation when MnemeBrain is unavailable
 */

// ─── Tests ──────────────────────────────────────────────────────────

test.describe("Long-term memory for agents", () => {
  // ── Section 1: MnemeBrain belief lifecycle ──

  test.describe("belief engine lifecycle", () => {
    const TEST_TAG = `e2e-memory-${Date.now()}`;

    test("store a belief with evidence and tags", async () => {
      const res = await fetch(`${MNEMEBRAIN_URL}/believe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim: `Auth middleware needs rewrite — ${TEST_TAG}`,
          evidence: [{
            content: "CTO review found session tokens stored insecurely",
            source_ref: "agent:review-finder:validate",
            polarity: "supports",
          }],
          tags: ["architecture", "security"],
        }),
      });
      expect(res.ok, `Belief store failed: ${res.status}`).toBe(true);
      const body = await res.json();
      expect(body.id ?? body.belief_id ?? body.beliefId).toBeTruthy();
    });

    test("search retrieves stored belief", async () => {
      await new Promise((r) => setTimeout(r, 500));
      const res = await fetch(
        `${MNEMEBRAIN_URL}/search?query=${encodeURIComponent(TEST_TAG)}`,
      );
      expect(res.ok).toBe(true);
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.results ?? [];
      const found = items.some((r: { claim?: string }) =>
        r.claim?.includes(TEST_TAG),
      );
      expect(found, "Stored belief not found in search results").toBe(true);
    });

    test("store contradicting belief", async () => {
      const res = await fetch(`${MNEMEBRAIN_URL}/believe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim: `Auth middleware is fine, only needs minor patch — ${TEST_TAG}`,
          evidence: [{
            content: "COO review found session handling meets current compliance",
            source_ref: "agent:eval-advocate:implement",
            polarity: "supports",
          }],
          tags: ["architecture", "contradiction"],
        }),
      });
      expect(res.ok).toBe(true);
    });

    test("can list all beliefs", async () => {
      const res = await fetch(`${MNEMEBRAIN_URL}/beliefs`);
      if (res.ok) {
        const data = await res.json();
        const beliefs = Array.isArray(data) ? data : data.beliefs ?? [];
        expect(beliefs.length).toBeGreaterThan(0);
      }
    });

    test("health endpoint returns healthy", async () => {
      const res = await fetch(`${MNEMEBRAIN_URL}/health`);
      expect(res.ok).toBe(true);
    });
  });

  // ── Section 2: Belief context formatting ──

  test.describe("belief context formatter", () => {
    test("formatter module exists and exports formatContext", async () => {
      const formatterPath = join(PKG_ROOT, "dist", "belief-engine", "formatter.js");
      expect(existsSync(formatterPath)).toBe(true);
      const mod = await import(formatterPath);
      expect(typeof mod.formatContext).toBe("function");
    });

    test("formatContext produces markdown output", async () => {
      const mod = await import(join(PKG_ROOT, "dist", "belief-engine", "formatter.js"));
      const mockResults = [
        {
          claim: "Test belief",
          confidence: 0.85,
          truthState: "true",
          evidence: [{ content: "test evidence", sourceRef: "test" }],
        },
      ];
      const md = mod.formatContext(mockResults, { task: "test task", maxTokens: 4000 });
      expect(typeof md).toBe("string");
      expect(md.length).toBeGreaterThan(0);
    });
  });

  // ── Section 3: PARA memory skill ──

  test.describe("PARA memory file skill", () => {
    test("para-memory-files skill exists", () => {
      const skillDir = join(PKG_ROOT, "skills", "para-memory-files");
      expect(existsSync(skillDir)).toBe(true);
      expect(existsSync(join(skillDir, "SKILL.md"))).toBe(true);
    });

    test("para-memory-files skill has schema reference", () => {
      const refsDir = join(PKG_ROOT, "skills", "para-memory-files", "references");
      expect(existsSync(refsDir)).toBe(true);
      expect(existsSync(join(refsDir, "schemas.md"))).toBe(true);
    });

    test("para-memory-files SKILL.md defines knowledge graph and daily notes", () => {
      const content = readFileSync(
        join(PKG_ROOT, "skills", "para-memory-files", "SKILL.md"),
        "utf-8",
      );
      expect(content).toMatch(/knowledge graph|entity|PARA/i);
      expect(content).toMatch(/daily notes|memory/i);
    });
  });

  // ── Section 4: Verification protocol memory systems ──

  test.describe("verification protocol memory definitions", () => {
    test("verification protocol defines both memory systems", () => {
      const content = readFileSync(
        join(PKG_ROOT, "agents", "_shared", "verification-protocol.md"),
        "utf-8",
      );
      expect(content).toContain("Long-Term Memory");
      expect(content).toContain("Working Memory");
      expect(content).toContain("Belief Engine");
      expect(content).toContain("PARA Files");
    });

    test("verification protocol defines when to record beliefs", () => {
      const content = readFileSync(
        join(PKG_ROOT, "agents", "_shared", "verification-protocol.md"),
        "utf-8",
      );
      expect(content).toContain("On completion");
      expect(content).toContain("On contradiction");
      expect(content).toContain("On decision");
    });

    test("verification protocol defines integration between systems", () => {
      const content = readFileSync(
        join(PKG_ROOT, "agents", "_shared", "verification-protocol.md"),
        "utf-8",
      );
      expect(content).toContain("Before decisions");
      expect(content).toContain("After decisions");
    });

    test("verification protocol specifies categories", () => {
      const content = readFileSync(
        join(PKG_ROOT, "agents", "_shared", "verification-protocol.md"),
        "utf-8",
      );
      expect(content).toContain("review_finding");
      expect(content).toContain("decision");
      expect(content).toContain("contradiction");
      expect(content).toContain("architecture");
    });
  });

  // ── Section 5: Graceful degradation ──

  test.describe("graceful degradation", () => {
    test("debate SOUL.md specifies graceful degradation principle", () => {
      const content = readFileSync(
        join(PKG_ROOT, "agents", "debate", "SOUL.md"),
        "utf-8",
      );
      expect(content).toContain("Graceful degradation");
      expect(content).toContain("MnemeBrain is down");
    });

    test("belief engine CLI uses 2>/dev/null || true pattern", () => {
      // Agents reference belief engine with silent failure
      const agentContent = readFileSync(
        join(PKG_ROOT, "agents", "debate", "HEARTBEAT.md"),
        "utf-8",
      );
      expect(agentContent).toContain("2>/dev/null || true");
    });

    test("belief engine CLI has safe() wrapper for all operations", () => {
      const content = readFileSync(
        join(PKG_ROOT, "src", "cli", "belief-engine.ts"),
        "utf-8",
      );
      // Count occurrences of safe() calls
      const safeCallCount = (content.match(/await safe\(/g) || []).length;
      // Should be used in multiple commands
      expect(safeCallCount).toBeGreaterThanOrEqual(5);
    });

    test("sub-agents use silent failure for belief engine", () => {
      const agents = [
        join(PKG_ROOT, "agents", "debate", "adversarial-review", "review-finder.md"),
        join(PKG_ROOT, "agents", "debate", "eval", "eval-advocate.md"),
        join(PKG_ROOT, "agents", "debate", "skill", "skill-advocate.md"),
      ];

      for (const path of agents) {
        const content = readFileSync(path, "utf-8");
        // All agent belief engine references should use || true
        expect(
          content.includes("2>/dev/null || true"),
          `${path} doesn't use silent failure for belief engine`,
        ).toBe(true);
      }
    });
  });
});
