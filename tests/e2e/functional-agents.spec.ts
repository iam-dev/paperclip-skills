import { test, expect } from "@playwright/test";
import { readFileSync, existsSync, readdirSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { PKG_ROOT, AGENTS_DIR, SCRIPTS_DIR, runScript, runScriptWithExit } from "./helpers.js";

/**
 * E2E Functional Agent Tests
 *
 * Validates:
 *   - All agents functional (structure, tools, references)
 *   - _shared protocols are referenced by agents
 *   - Scripts are used by agents (state-tracker, workflow)
 *   - Workflow detection and routing
 *   - State tracker init/update/get cycle
 *   - Circuit breaker and iteration tracking
 */

// ─── Tests ──────────────────────────────────────────────────────────

test.describe("Functional agent tests", () => {
  // ── Section 1: All agents have required structure ──

  test.describe("agent structure validation", () => {
    const agentDirs = existsSync(AGENTS_DIR)
      ? readdirSync(AGENTS_DIR, { withFileTypes: true })
          .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
          .map((e) => e.name)
      : [];

    for (const agentName of agentDirs) {
      test(`${agentName} has AGENTS.md`, () => {
        // All agents need either AGENTS.md or README.md
        const hasAgents = existsSync(join(AGENTS_DIR, agentName, "AGENTS.md"));
        const hasReadme = existsSync(join(AGENTS_DIR, agentName, "README.md"));
        expect(hasAgents || hasReadme, `${agentName} missing AGENTS.md or README.md`).toBe(true);
      });
    }

    test("all C-suite agents have SOUL.md", () => {
      const csuite = ["ceo-brainstorm", "ceo-nl", "cto-brainstorm", "cmo-brainstorm", "coo-brainstorm"];
      for (const agent of csuite) {
        const path = join(AGENTS_DIR, agent, "SOUL.md");
        if (existsSync(join(AGENTS_DIR, agent))) {
          expect(existsSync(path), `${agent} missing SOUL.md`).toBe(true);
        }
      }
    });

    test("all C-suite agents have HEARTBEAT.md", () => {
      const csuite = ["ceo-brainstorm", "ceo-nl", "cto-brainstorm", "cmo-brainstorm", "coo-brainstorm"];
      for (const agent of csuite) {
        const path = join(AGENTS_DIR, agent, "HEARTBEAT.md");
        if (existsSync(join(AGENTS_DIR, agent))) {
          expect(existsSync(path), `${agent} missing HEARTBEAT.md`).toBe(true);
        }
      }
    });

    test("all C-suite agents have TOOLS.md", () => {
      const csuite = ["ceo-brainstorm", "ceo-nl", "cto-brainstorm", "cmo-brainstorm", "coo-brainstorm"];
      for (const agent of csuite) {
        const path = join(AGENTS_DIR, agent, "TOOLS.md");
        if (existsSync(join(AGENTS_DIR, agent))) {
          expect(existsSync(path), `${agent} missing TOOLS.md`).toBe(true);
        }
      }
    });
  });

  // ── Section 2: Agents reference _shared protocols ──

  test.describe("agents reference shared protocols", () => {
    test("debate AGENTS.md references priority-loops.md", () => {
      const content = readFileSync(join(AGENTS_DIR, "debate", "AGENTS.md"), "utf-8");
      expect(content).toContain("priority-loops.md");
    });

    test("debate sub-agents reference verification-protocol.md", () => {
      const finderContent = readFileSync(
        join(AGENTS_DIR, "debate", "adversarial-review", "review-finder.md"),
        "utf-8",
      );
      expect(finderContent).toContain("verification-protocol.md");
    });

    test("debate sub-agents reference evaluation-criteria.md", () => {
      const advocateContent = readFileSync(
        join(AGENTS_DIR, "debate", "eval", "eval-advocate.md"),
        "utf-8",
      );
      expect(advocateContent).toContain("evaluation-criteria.md");
    });
  });

  // ── Section 3: Agents use scripts ──

  test.describe("agents use scripts", () => {
    test("debate TOOLS.md references state-tracker.sh", () => {
      const content = readFileSync(join(AGENTS_DIR, "debate", "TOOLS.md"), "utf-8");
      expect(content).toContain("state-tracker.sh");
    });

    test("debate AGENTS.md references state-tracker.sh commands", () => {
      const content = readFileSync(join(AGENTS_DIR, "debate", "AGENTS.md"), "utf-8");
      expect(content).toContain("adversarial-report");
      expect(content).toContain("qa-round");
    });

    test("sub-agents reference belief-engine CLI", () => {
      const subAgentPaths = [
        join(AGENTS_DIR, "debate", "adversarial-review", "review-finder.md"),
        join(AGENTS_DIR, "debate", "eval", "eval-advocate.md"),
        join(AGENTS_DIR, "debate", "skill", "skill-advocate.md"),
      ];

      for (const path of subAgentPaths) {
        const content = readFileSync(path, "utf-8");
        expect(content, `${path} doesn't reference belief-engine`).toContain("belief-engine");
      }
    });
  });

  // ── Section 4: Workflow detection ──

  test.describe("workflow detection and routing", () => {
    test("detects feature workflow", () => {
      const output = runScript("workflow.sh", ["detect", "add user authentication"]);
      expect(output).toBe("feature");
    });

    test("detects bugfix workflow", () => {
      const output = runScript("workflow.sh", ["detect", "fix login error for OAuth users"]);
      expect(output).toBe("bugfix");
    });

    test("detects hotfix workflow", () => {
      const output = runScript("workflow.sh", ["detect", "urgent production crash fix"]);
      expect(output).toBe("hotfix");
    });

    test("detects security-fix workflow", () => {
      const output = runScript("workflow.sh", ["detect", "patch SQL injection vulnerability"]);
      expect(output).toBe("security-fix");
    });

    test("detects refactor workflow", () => {
      const output = runScript("workflow.sh", ["detect", "refactor auth middleware to clean architecture"]);
      expect(output).toBe("refactor");
    });

    test("detects migration workflow", () => {
      const output = runScript("workflow.sh", ["detect", "database migration for user schema"]);
      expect(output).toBe("migration");
    });

    test("detects optimization workflow", () => {
      const output = runScript("workflow.sh", ["detect", "optimize API performance for slow endpoints"]);
      expect(output).toBe("optimization");
    });

    test("get-phases returns phases for each workflow type", () => {
      const workflows = ["feature", "bugfix", "hotfix", "refactor", "security-fix", "optimization", "migration"];
      for (const wf of workflows) {
        const phases = runScript("workflow.sh", ["get-phases", wf]);
        expect(phases.length, `No phases for ${wf}`).toBeGreaterThan(0);
        expect(phases).toContain("implement");
      }
    });

    test("get-agent returns correct agent for phase", () => {
      const agent = runScript("workflow.sh", ["get-agent", "feature", "analyse"]);
      expect(agent).toBe("architect");

      const designer = runScript("workflow.sh", ["get-agent", "feature", "design"]);
      expect(designer).toBe("designer");

      const implementer = runScript("workflow.sh", ["get-agent", "feature", "implement"]);
      expect(implementer).toBe("implementer");
    });
  });

  // ── Section 5: State tracker full lifecycle ──

  test.describe("state tracker lifecycle", () => {
    let stateDir: string;

    test.beforeAll(() => {
      stateDir = join(PKG_ROOT, ".paperclip-test-functional-" + Date.now());
      mkdirSync(stateDir, { recursive: true });
    });

    test.afterAll(() => {
      if (stateDir && existsSync(stateDir)) {
        rmSync(stateDir, { recursive: true, force: true });
      }
    });

    test("full init → update → get cycle", () => {
      const env = { PAPERCLIP_HOME: stateDir };

      // Init
      const initOut = runScript("state-tracker.sh", ["init", "lifecycle-task", "feature", "auth", "interactive"], env);
      expect(initOut).toContain("State initialized");

      // Update phase to in-progress
      const updateOut = runScript("state-tracker.sh", ["update", "analyse", "in-progress"], env);
      expect(updateOut).toContain("analyse");

      // Get state
      const state = runScript("state-tracker.sh", ["get"], env);
      const parsed = JSON.parse(state);
      expect(parsed.taskId).toBe("lifecycle-task");
      expect(parsed.workflowType).toBe("feature");
      expect(parsed.phases.analyse.status).toBe("in-progress");
      expect(parsed.currentPhase).toBe("analyse");

      // Complete phase
      runScript("state-tracker.sh", ["update", "analyse", "done"], env);
      const state2 = JSON.parse(runScript("state-tracker.sh", ["get"], env));
      expect(state2.phases.analyse.status).toBe("done");
      expect(state2.phases.analyse.completedAt).toBeTruthy();
      expect(state2.currentPhase).toBeNull();
    });

    test("resume finds next pending phase", () => {
      const env = { PAPERCLIP_HOME: stateDir };
      const output = runScript("state-tracker.sh", ["resume"], env);
      expect(output).toContain("Resume");
      expect(output).toContain("design"); // next phase after analyse
    });

    test("token tracking works", () => {
      const env = { PAPERCLIP_HOME: stateDir };
      runScript("state-tracker.sh", ["tokens", "opus", "10000"], env);
      runScript("state-tracker.sh", ["tokens", "sonnet", "5000"], env);

      const state = JSON.parse(runScript("state-tracker.sh", ["get"], env));
      expect(state.tokensUsed.opus).toBe(10000);
      expect(state.tokensUsed.sonnet).toBe(5000);
    });

    test("error recording works", () => {
      const env = { PAPERCLIP_HOME: stateDir };
      runScript("state-tracker.sh", ["error", "test error message", "implement"], env);

      const state = JSON.parse(runScript("state-tracker.sh", ["get"], env));
      expect(state.errors.length).toBeGreaterThan(0);
      expect(state.errors[0].message).toBe("test error message");
      expect(state.errors[0].phase).toBe("implement");
    });
  });

  // ── Section 6: Circuit breaker ──

  test.describe("circuit breaker", () => {
    test("circuit breaker OK for fresh state", () => {
      const dir = join(PKG_ROOT, ".paperclip-test-cb-" + Date.now());
      mkdirSync(dir, { recursive: true });
      const env = { PAPERCLIP_HOME: dir };

      try {
        runScript("state-tracker.sh", ["init", "cb-task", "feature", "test", "interactive"], env);

        const result = runScriptWithExit("state-tracker.sh", ["check-circuit-breaker", "implement"], env);
        expect(result.stdout).toContain("OK");
        expect(result.exitCode).toBe(0);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    test("circuit breaker trips after max retries", () => {
      const dir = join(PKG_ROOT, ".paperclip-test-cb-trip-" + Date.now());
      mkdirSync(dir, { recursive: true });
      const env = { PAPERCLIP_HOME: dir };

      try {
        runScript("state-tracker.sh", ["init", "cb-trip-task", "feature", "test", "interactive"], env);

        // Increment 3 times (default max)
        runScript("state-tracker.sh", ["increment-iteration", "implement"], env);
        runScript("state-tracker.sh", ["increment-iteration", "implement"], env);
        runScript("state-tracker.sh", ["increment-iteration", "implement"], env);

        const result = runScriptWithExit("state-tracker.sh", ["check-circuit-breaker", "implement"], env);
        expect(result.stdout).toContain("TRIPPED");
        expect(result.exitCode).toBe(1);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  // ── Section 7: Checkpoint save/restore ──

  test.describe("checkpoint save and restore", () => {
    test("can save and restore checkpoint", () => {
      const dir = join(PKG_ROOT, ".paperclip-test-checkpoint-" + Date.now());
      mkdirSync(dir, { recursive: true });
      const env = { PAPERCLIP_HOME: dir };

      try {
        runScript("state-tracker.sh", ["init", "checkpoint-task", "feature", "test", "interactive"], env);
        runScript("state-tracker.sh", ["update", "analyse", "done"], env);

        // Save checkpoint
        const saveOut = runScript("state-tracker.sh", ["save-checkpoint"], env);
        expect(saveOut).toContain("Checkpoint saved");

        // Make more changes
        runScript("state-tracker.sh", ["update", "design", "done"], env);

        // Restore checkpoint
        const restoreOut = runScript("state-tracker.sh", ["restore-checkpoint", "test rollback"], env);
        expect(restoreOut).toContain("Checkpoint restored");

        // Verify state is back to checkpoint (design should be pending)
        const state = JSON.parse(runScript("state-tracker.sh", ["get"], env));
        expect(state.phases.analyse.status).toBe("done");
        expect(state.phases.design.status).toBe("pending");
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });
});
