import { test, expect } from "@playwright/test";
import { readFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { PKG_ROOT, runScript, runScriptWithExit } from "./helpers.js";

/**
 * E2E Priority Loops Tests
 *
 * Validates:
 *   - Priority levels (Low=1, Medium=2, High=3, Critical=5) loop counts
 *   - State tracker qa-round records scores per loop
 *   - Feedback output from one loop feeds into the next
 *   - Early exit when no new findings
 *   - QA regression detection between rounds
 *   - QA budget enforcement
 *   - Adversarial report recording
 */

// ─── Tests ──────────────────────────────────────────────────────────

test.describe("Priority loops and feedback output", () => {
  let stateDir: string;

  test.beforeAll(() => {
    // Create isolated state directory for tests
    stateDir = join(PKG_ROOT, ".paperclip-test-priority-" + Date.now());
    mkdirSync(stateDir, { recursive: true });
  });

  test.afterAll(() => {
    if (stateDir && existsSync(stateDir)) {
      rmSync(stateDir, { recursive: true, force: true });
    }
  });

  // ── Section 1: Priority loop table verification ──

  test.describe("priority loop table", () => {
    test("priority-loops.md defines correct loop counts", () => {
      const content = readFileSync(
        join(PKG_ROOT, "agents", "_shared", "priority-loops.md"),
        "utf-8",
      );

      // Verify the loop table
      expect(content).toMatch(/Low.*\|.*1/i);
      expect(content).toMatch(/Medium.*\|.*2/i);
      expect(content).toMatch(/High.*\|.*3/i);
      expect(content).toMatch(/Critical.*\|.*5/i);
    });

    test("debate AGENTS.md references priority loops", () => {
      const content = readFileSync(
        join(PKG_ROOT, "agents", "debate", "AGENTS.md"),
        "utf-8",
      );
      expect(content).toContain("priority-loops.md");
    });

    test("debate HEARTBEAT.md includes loop count determination", () => {
      const content = readFileSync(
        join(PKG_ROOT, "agents", "debate", "HEARTBEAT.md"),
        "utf-8",
      );
      expect(content).toContain("Determine Loop Count");
      expect(content).toMatch(/Low.*\|.*1/i);
      expect(content).toMatch(/Critical.*\|.*5/i);
    });
  });

  // ── Section 2: State tracker QA round recording ──

  test.describe("state tracker QA rounds", () => {
    test("can init state and record QA round", () => {
      const env = { PAPERCLIP_HOME: stateDir };

      // Init state
      const initOut = runScript("state-tracker.sh", ["init", "test-task", "feature", "test-slug", "interactive"], env);
      expect(initOut).toContain("State initialized");

      // Record a QA round (low priority = 1 loop)
      const qaOut = runScript("state-tracker.sh", [
        "qa-round", "implement", "1", "1", "PASS",
        '{"functionality":8,"correctness":7,"design_fidelity":8,"code_quality":7}',
      ], env);
      expect(qaOut).toContain("QA round 1");
      expect(qaOut).toContain("PASS");
    });

    test("records multiple QA rounds for medium priority (2 loops)", () => {
      const env = { PAPERCLIP_HOME: stateDir + "-medium" };
      mkdirSync(env.PAPERCLIP_HOME, { recursive: true });

      try {
        runScript("state-tracker.sh", ["init", "medium-task", "feature", "test", "interactive"], env);

        // Round 1 - NEEDS_CHANGES
        const r1 = runScript("state-tracker.sh", [
          "qa-round", "implement", "1", "1", "NEEDS_CHANGES",
          '{"functionality":6,"correctness":5,"design_fidelity":7,"code_quality":6}',
        ], env);
        expect(r1).toContain("NEEDS_CHANGES");

        // Round 2 - PASS (feedback from round 1 leads to improvement)
        const r2 = runScript("state-tracker.sh", [
          "qa-round", "implement", "1", "2", "PASS",
          '{"functionality":8,"correctness":7,"design_fidelity":8,"code_quality":7}',
        ], env);
        expect(r2).toContain("PASS");

        // Verify 2 rounds recorded
        const rounds = runScript("state-tracker.sh", ["get-qa-rounds", "implement", "1"], env);
        expect(parseInt(rounds)).toBe(2);
      } finally {
        rmSync(env.PAPERCLIP_HOME, { recursive: true, force: true });
      }
    });

    test("records 3 QA rounds for high priority", () => {
      const env = { PAPERCLIP_HOME: stateDir + "-high" };
      mkdirSync(env.PAPERCLIP_HOME, { recursive: true });

      try {
        runScript("state-tracker.sh", ["init", "high-task", "feature", "test", "interactive"], env);

        for (let round = 1; round <= 3; round++) {
          const verdict = round < 3 ? "NEEDS_CHANGES" : "PASS";
          const score = round < 3 ? 6 : 8;
          runScript("state-tracker.sh", [
            "qa-round", "implement", "1", String(round), verdict,
            `{"functionality":${score},"correctness":${score},"design_fidelity":${score},"code_quality":${score}}`,
          ], env);
        }

        const rounds = runScript("state-tracker.sh", ["get-qa-rounds", "implement", "1"], env);
        expect(parseInt(rounds)).toBe(3);
      } finally {
        rmSync(env.PAPERCLIP_HOME, { recursive: true, force: true });
      }
    });

    test("records 5 QA rounds for critical priority", () => {
      const env = { PAPERCLIP_HOME: stateDir + "-critical" };
      mkdirSync(env.PAPERCLIP_HOME, { recursive: true });

      try {
        runScript("state-tracker.sh", ["init", "critical-task", "feature", "test", "interactive"], env);

        for (let round = 1; round <= 5; round++) {
          const verdict = round < 5 ? "NEEDS_CHANGES" : "PASS";
          const score = 5 + round; // Scores improve each round
          runScript("state-tracker.sh", [
            "qa-round", "implement", "1", String(round), verdict,
            `{"functionality":${score},"correctness":${score},"design_fidelity":${score},"code_quality":${score}}`,
          ], env);
        }

        const rounds = runScript("state-tracker.sh", ["get-qa-rounds", "implement", "1"], env);
        expect(parseInt(rounds)).toBe(5);
      } finally {
        rmSync(env.PAPERCLIP_HOME, { recursive: true, force: true });
      }
    });
  });

  // ── Section 3: Feedback output to next loop ──

  test.describe("feedback between loops", () => {
    test("QA round verdict is retrievable for next loop input", () => {
      const env = { PAPERCLIP_HOME: stateDir + "-feedback" };
      mkdirSync(env.PAPERCLIP_HOME, { recursive: true });

      try {
        runScript("state-tracker.sh", ["init", "feedback-task", "feature", "test", "interactive"], env);

        // Round 1 with NEEDS_CHANGES
        runScript("state-tracker.sh", [
          "qa-round", "implement", "1", "1", "NEEDS_CHANGES",
          '{"functionality":5,"correctness":4,"design_fidelity":6,"code_quality":5}',
        ], env);

        // Get state to verify feedback is stored
        const state = runScript("state-tracker.sh", ["get"], env);
        const parsed = JSON.parse(state);

        expect(parsed.quality).toBeTruthy();
        expect(parsed.quality.rounds).toBeTruthy();
        const sprintKey = "implement:sprint-1";
        expect(parsed.quality.rounds[sprintKey]).toBeTruthy();
        expect(parsed.quality.rounds[sprintKey].length).toBe(1);

        const round1 = parsed.quality.rounds[sprintKey][0];
        expect(round1.verdict).toBe("NEEDS_CHANGES");
        expect(round1.scores.functionality).toBe(5);
        expect(round1.scores.correctness).toBe(4);
        expect(round1.weightedAverage).toBeTruthy();

        // Round 2 uses feedback to improve
        runScript("state-tracker.sh", [
          "qa-round", "implement", "1", "2", "PASS",
          '{"functionality":8,"correctness":8,"design_fidelity":8,"code_quality":7}',
        ], env);

        const state2 = runScript("state-tracker.sh", ["get"], env);
        const parsed2 = JSON.parse(state2);
        const rounds = parsed2.quality.rounds[sprintKey];
        expect(rounds.length).toBe(2);

        // Verify score improvement between rounds
        expect(rounds[1].weightedAverage).toBeGreaterThan(rounds[0].weightedAverage);
      } finally {
        rmSync(env.PAPERCLIP_HOME, { recursive: true, force: true });
      }
    });
  });

  // ── Section 4: QA regression detection ──

  test.describe("QA regression detection", () => {
    test("detects score regression between rounds", () => {
      const env = { PAPERCLIP_HOME: stateDir + "-regression" };
      mkdirSync(env.PAPERCLIP_HOME, { recursive: true });

      try {
        runScript("state-tracker.sh", ["init", "regression-task", "feature", "test", "interactive"], env);

        // Round 1 with good scores
        runScript("state-tracker.sh", [
          "qa-round", "implement", "1", "1", "PASS",
          '{"functionality":8,"correctness":8,"design_fidelity":8,"code_quality":8}',
        ], env);

        // Check regression with worse scores
        const result = runScriptWithExit("state-tracker.sh", [
          "check-qa-regression", "implement", "1",
          '{"functionality":5,"correctness":5,"design_fidelity":5,"code_quality":5}',
        ], env);
        expect(result.stdout).toContain("REGRESSION_DETECTED");
        expect(result.exitCode).toBe(1);
      } finally {
        rmSync(env.PAPERCLIP_HOME, { recursive: true, force: true });
      }
    });

    test("no regression when scores improve", () => {
      const env = { PAPERCLIP_HOME: stateDir + "-no-regression" };
      mkdirSync(env.PAPERCLIP_HOME, { recursive: true });

      try {
        runScript("state-tracker.sh", ["init", "no-regression-task", "feature", "test", "interactive"], env);

        runScript("state-tracker.sh", [
          "qa-round", "implement", "1", "1", "NEEDS_CHANGES",
          '{"functionality":5,"correctness":5,"design_fidelity":5,"code_quality":5}',
        ], env);

        const result = runScriptWithExit("state-tracker.sh", [
          "check-qa-regression", "implement", "1",
          '{"functionality":8,"correctness":8,"design_fidelity":8,"code_quality":8}',
        ], env);
        expect(result.stdout).toContain("OK");
        expect(result.exitCode).toBe(0);
      } finally {
        rmSync(env.PAPERCLIP_HOME, { recursive: true, force: true });
      }
    });
  });

  // ── Section 5: QA budget enforcement ──

  test.describe("QA budget enforcement", () => {
    test("budget check passes within limits", () => {
      const env = { PAPERCLIP_HOME: stateDir + "-budget-ok" };
      mkdirSync(env.PAPERCLIP_HOME, { recursive: true });

      try {
        runScript("state-tracker.sh", ["init", "budget-ok-task", "feature", "test", "interactive"], env);

        runScript("state-tracker.sh", [
          "qa-round", "implement", "1", "1", "PASS",
          '{"functionality":8,"correctness":8,"design_fidelity":8,"code_quality":8}',
        ], env);

        const result = runScriptWithExit("state-tracker.sh", ["check-qa-budget", "implement", "1"], env);
        expect(result.stdout).toContain("OK");
        expect(result.exitCode).toBe(0);
      } finally {
        rmSync(env.PAPERCLIP_HOME, { recursive: true, force: true });
      }
    });
  });

  // ── Section 6: Adversarial review report ──

  test.describe("adversarial review reporting", () => {
    test("records adversarial review results with accuracy metrics", () => {
      const env = { PAPERCLIP_HOME: stateDir + "-adv-report" };
      mkdirSync(env.PAPERCLIP_HOME, { recursive: true });

      try {
        runScript("state-tracker.sh", ["init", "adv-task", "feature", "test", "interactive"], env);

        // Record adversarial review: 10 found, 3 killed, 5 survived, 2 disputed, 7 real
        const output = runScript("state-tracker.sh", [
          "adversarial-report", "10", "3", "5", "2", "7",
        ], env);
        expect(output).toContain("Adversarial review");
        expect(output).toContain("10 found");
        expect(output).toContain("3 killed");
        expect(output).toContain("7 real");

        // Verify state contains the report
        const state = runScript("state-tracker.sh", ["get"], env);
        const parsed = JSON.parse(state);
        expect(parsed.quality.adversarialReview).toBeTruthy();
        expect(parsed.quality.adversarialReview.found).toBe(10);
        expect(parsed.quality.adversarialReview.killed).toBe(3);
        expect(parsed.quality.adversarialReview.survived).toBe(5);
        expect(parsed.quality.adversarialReview.disputed).toBe(2);
        expect(parsed.quality.adversarialReview.realIssues).toBe(7);
        expect(parsed.quality.adversarialReview.finderAccuracy).toBe(70);
        expect(parsed.quality.adversarialReview.falsePositiveRate).toBe(30);
      } finally {
        rmSync(env.PAPERCLIP_HOME, { recursive: true, force: true });
      }
    });
  });

  // ── Section 7: Quality report output ──

  test.describe("quality report for supervisor", () => {
    test("quality report includes QA history and adversarial review", () => {
      const env = { PAPERCLIP_HOME: stateDir + "-quality-report" };
      mkdirSync(env.PAPERCLIP_HOME, { recursive: true });

      try {
        runScript("state-tracker.sh", ["init", "report-task", "feature", "test", "interactive"], env);

        // Add QA rounds
        runScript("state-tracker.sh", [
          "qa-round", "implement", "1", "1", "NEEDS_CHANGES",
          '{"functionality":6,"correctness":5,"design_fidelity":7,"code_quality":6}',
        ], env);
        runScript("state-tracker.sh", [
          "qa-round", "implement", "1", "2", "PASS",
          '{"functionality":8,"correctness":8,"design_fidelity":8,"code_quality":8}',
        ], env);

        // Add adversarial review
        runScript("state-tracker.sh", [
          "adversarial-report", "15", "5", "8", "2", "10",
        ], env);

        // Get quality report
        const report = runScript("state-tracker.sh", ["quality-report"], env);
        expect(report).toContain("Quality Report");
        expect(report).toContain("report-task");
        expect(report).toContain("feature");
        expect(report).toContain("QA Round History");
        expect(report).toContain("Adversarial Review");
      } finally {
        rmSync(env.PAPERCLIP_HOME, { recursive: true, force: true });
      }
    });
  });
});
