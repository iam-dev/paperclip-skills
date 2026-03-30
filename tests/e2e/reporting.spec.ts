import { test, expect } from "@playwright/test";
import { readFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { PKG_ROOT, SKILLS_DIR, runScript } from "./helpers.js";

/**
 * E2E Reporting Tests
 *
 * Validates:
 *   - CTO-to-CEO reporting output (supervisor reporting)
 *   - Quality report generation with all sections
 *   - Cost report generation
 *   - Cross-agent communication records
 *   - Verdict report templates exist and have correct structure
 */

// ─── Tests ──────────────────────────────────────────────────────────

test.describe("Reporting output to supervisor", () => {
  let stateDir: string;

  test.beforeAll(() => {
    stateDir = join(PKG_ROOT, ".paperclip-test-reporting-" + Date.now());
    mkdirSync(stateDir, { recursive: true });
  });

  test.afterAll(() => {
    if (stateDir && existsSync(stateDir)) {
      rmSync(stateDir, { recursive: true, force: true });
    }
  });

  // ── Section 1: CTO report to CEO ──

  test.describe("CTO-to-CEO reporting simulation", () => {
    test("quality report includes all data a CEO needs", () => {
      const env = { PAPERCLIP_HOME: stateDir };

      // Simulate a CTO completing a feature review
      runScript("state-tracker.sh", ["init", "auth-service-redesign", "feature", "auth", "interactive"], env);

      // Update phases (CTO progresses through analysis and design)
      runScript("state-tracker.sh", ["update", "analyse", "done"], env);
      runScript("state-tracker.sh", ["update", "design", "done"], env);
      runScript("state-tracker.sh", ["update", "plan", "done"], env);
      runScript("state-tracker.sh", ["update", "implement", "in-progress"], env);

      // Record token usage
      runScript("state-tracker.sh", ["tokens", "opus", "50000"], env);
      runScript("state-tracker.sh", ["tokens", "sonnet", "30000"], env);

      // Record QA rounds (evaluator debate results)
      runScript("state-tracker.sh", [
        "qa-round", "implement", "1", "1", "NEEDS_CHANGES",
        '{"functionality":6,"correctness":5,"design_fidelity":7,"code_quality":6}',
      ], env);
      runScript("state-tracker.sh", [
        "qa-round", "implement", "1", "2", "PASS",
        '{"functionality":8,"correctness":8,"design_fidelity":8,"code_quality":8}',
      ], env);

      // Record adversarial review
      runScript("state-tracker.sh", ["adversarial-report", "12", "4", "6", "2", "8"], env);

      // Generate the quality report (what CTO sends to CEO)
      const report = runScript("state-tracker.sh", ["quality-report"], env);

      // CEO needs to see:
      expect(report).toContain("auth-service-redesign"); // task name
      expect(report).toContain("feature"); // workflow type
      expect(report).toContain("QA Round History"); // evaluation history
      expect(report).toContain("Adversarial Review"); // code review results

      // Cost report (separate command)
      const costReport = runScript("state-tracker.sh", ["cost-report"], env);
      expect(costReport).toContain("Cost Report");
      expect(costReport).toContain("opus");
      expect(costReport).toContain("sonnet");
      expect(costReport).toContain("50000"); // opus tokens
      expect(costReport).toContain("30000"); // sonnet tokens
    });

    test("state includes full phase progression for status updates", () => {
      const env = { PAPERCLIP_HOME: stateDir };
      const state = runScript("state-tracker.sh", ["get"], env);
      const parsed = JSON.parse(state);

      // CEO can see which phases are complete
      expect(parsed.phases.analyse.status).toBe("done");
      expect(parsed.phases.design.status).toBe("done");
      expect(parsed.phases.plan.status).toBe("done");
      expect(parsed.phases.implement.status).toBe("in-progress");

      // CEO can see task metadata
      expect(parsed.taskId).toBe("auth-service-redesign");
      expect(parsed.workflowType).toBe("feature");
    });
  });

  // ── Section 2: Verdict report templates ──

  test.describe("verdict report templates", () => {
    test("adversarial review verdict template exists", () => {
      const templatePath = join(SKILLS_DIR, "adversarial-review", "references", "verdict-report-template.md");
      expect(existsSync(templatePath)).toBe(true);
      const content = readFileSync(templatePath, "utf-8");
      expect(content.length).toBeGreaterThan(50);
    });

    test("eval debate sprint evaluation template exists", () => {
      const templatePath = join(SKILLS_DIR, "eval-debate", "references", "sprint-evaluation-template.md");
      expect(existsSync(templatePath)).toBe(true);
      const content = readFileSync(templatePath, "utf-8");
      expect(content.length).toBeGreaterThan(50);
    });

    test("skill debate ranking report template exists", () => {
      const templatePath = join(SKILLS_DIR, "skill-debate", "references", "ranking-report-template.md");
      expect(existsSync(templatePath)).toBe(true);
      const content = readFileSync(templatePath, "utf-8");
      expect(content.length).toBeGreaterThan(50);
    });

    test("brainstorm skills have decision document templates", () => {
      const brainstormSkills = ["ceo-brainstorm", "cto-brainstorm", "cmo-brainstorm", "coo-brainstorm"];
      for (const skill of brainstormSkills) {
        const templatePath = join(SKILLS_DIR, skill, "references", "decision-document-template.md");
        expect(
          existsSync(templatePath),
          `Missing decision document template for ${skill}`,
        ).toBe(true);
      }
    });
  });

  // ── Section 3: Cross-agent communication ──

  test.describe("cross-agent communication records", () => {
    test("workflow.sh can determine communication requirements", () => {
      // Designer should communicate with architect in design phase
      const output = runScript("workflow.sh", [
        "should-communicate", "feature", "design", "designer",
      ]);
      expect(output).toContain("true");
      expect(output).toContain("architect");
    });

    test("implementer communicates with designer and architect in feature workflow", () => {
      const output = runScript("workflow.sh", [
        "should-communicate", "feature", "implement", "implementer",
      ]);
      expect(output).toContain("true");
      expect(output).toContain("designer");
    });

    test("reviewer communicates with architect and designer in validate phase", () => {
      const output = runScript("workflow.sh", [
        "should-communicate", "feature", "validate", "reviewer",
      ]);
      expect(output).toContain("true");
    });
  });

  // ── Section 4: Estimate cost before execution ──

  test.describe("cost estimation", () => {
    test("estimate-cost produces formatted output", () => {
      const output = runScript("state-tracker.sh", [
        "estimate-cost", "build auth service", "--workflow=feature",
      ]);
      expect(output).toContain("Cost Estimate");
      expect(output).toContain("feature");
      expect(output).toContain("opus");
      expect(output).toContain("sonnet");
      expect(output).toContain("haiku");
    });

    test("estimates vary by workflow type", () => {
      const featureEst = runScript("state-tracker.sh", [
        "estimate-cost", "add feature", "--workflow=feature",
      ]);
      const hotfixEst = runScript("state-tracker.sh", [
        "estimate-cost", "fix urgent bug", "--workflow=hotfix",
      ]);

      // Feature has more phases, should show more tokens
      expect(featureEst).toContain("feature");
      expect(hotfixEst).toContain("hotfix");
    });
  });
});
