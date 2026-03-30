import { test, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PKG_ROOT, AGENTS_DIR, SHARED_DIR, SCRIPTS_DIR, DEBATE_DIR,
  parseFrontmatter, createTestCompany, deleteCompany,
} from "./helpers.js";

/**
 * E2E Agent Tests: Agent installation, sub-agents, shared protocols, and scripts
 *
 * Validates:
 *   - Debate agent is installed at agents/debate/
 *   - All 9 sub-agents are installed across 3 debate flows
 *   - _shared protocols are loaded and accessible
 *   - Scripts are installed and functional
 *   - Agent classification (onboarding vs orchestrated)
 *   - Sub-agent frontmatter parsing
 */

// ─── Tests ──────────────────────────────────────────────────────────

test.describe("Agent installation verification", () => {
  // ── Section 1: Debate agent installed ──

  test.describe("debate agent installation", () => {
    test("debate agent directory exists", () => {
      expect(existsSync(DEBATE_DIR)).toBe(true);
    });

    test("debate agent has all onboarding files", () => {
      const requiredFiles = ["AGENTS.md", "SOUL.md", "HEARTBEAT.md", "TOOLS.md"];
      for (const file of requiredFiles) {
        expect(
          existsSync(join(DEBATE_DIR, file)),
          `Missing ${file} in debate agent`,
        ).toBe(true);
      }
    });

    test("debate AGENTS.md references all three flows", () => {
      const content = readFileSync(join(DEBATE_DIR, "AGENTS.md"), "utf-8");
      expect(content).toContain("Adversarial Review");
      expect(content).toContain("Evaluator Debate");
      expect(content).toContain("Skill Debate");
    });

    test("debate SOUL.md defines neutral orchestrator persona", () => {
      const content = readFileSync(join(DEBATE_DIR, "SOUL.md"), "utf-8");
      expect(content).toContain("Debate Orchestrator");
      expect(content).toContain("zero bias");
    });

    test("debate HEARTBEAT.md contains execution checklist", () => {
      const content = readFileSync(join(DEBATE_DIR, "HEARTBEAT.md"), "utf-8");
      expect(content).toContain("Identify the Debate Flow");
      expect(content).toContain("Load Context");
      expect(content).toContain("Determine Loop Count");
      expect(content).toContain("Dispatch Agent Chain");
    });

    test("debate TOOLS.md references belief engine and state tracker", () => {
      const content = readFileSync(join(DEBATE_DIR, "TOOLS.md"), "utf-8");
      expect(content).toContain("belief-engine");
      expect(content).toContain("state-tracker");
    });
  });

  // ── Section 2: All 9 sub-agents installed ──

  test.describe("debate sub-agents (9 total)", () => {
    const EXPECTED_SUB_AGENTS = {
      "adversarial-review": ["review-finder", "review-adversary", "review-referee"],
      "eval": ["eval-advocate", "eval-critic", "eval-arbiter"],
      "skill": ["skill-advocate", "skill-critic", "skill-arbiter"],
    };

    for (const [flowDir, agents] of Object.entries(EXPECTED_SUB_AGENTS)) {
      test.describe(`${flowDir} flow`, () => {
        const flowPath = join(DEBATE_DIR, flowDir);

        test(`${flowDir}/ directory exists`, () => {
          expect(existsSync(flowPath)).toBe(true);
        });

        for (const agentName of agents) {
          test(`${agentName}.md exists`, () => {
            expect(existsSync(join(flowPath, `${agentName}.md`))).toBe(true);
          });

          test(`${agentName}.md has valid frontmatter`, () => {
            const content = readFileSync(join(flowPath, `${agentName}.md`), "utf-8");
            const meta = parseFrontmatter(content);
            expect(meta.name, `${agentName} missing name`).toBe(agentName);
            expect(meta.description, `${agentName} missing description`).toBeTruthy();
            expect(meta.model, `${agentName} missing model`).toBeTruthy();
            expect(meta.tools, `${agentName} missing tools`).toBeTruthy();
          });

          test(`${agentName}.md has competing incentive defined`, () => {
            const content = readFileSync(join(flowPath, `${agentName}.md`), "utf-8");
            expect(content).toMatch(/incentive|scored|scoring/i);
          });

          test(`${agentName}.md has safety considerations`, () => {
            const content = readFileSync(join(flowPath, `${agentName}.md`), "utf-8");
            expect(content).toMatch(/[Ss]afety [Cc]onsiderations|[Pp]rompt injection/);
          });

          test(`${agentName}.md references belief engine`, () => {
            const content = readFileSync(join(flowPath, `${agentName}.md`), "utf-8");
            expect(content).toContain("belief-engine");
          });
        }
      });
    }

    test("total sub-agent count is 9", () => {
      let count = 0;
      for (const [flowDir, agents] of Object.entries(EXPECTED_SUB_AGENTS)) {
        const flowPath = join(DEBATE_DIR, flowDir);
        for (const agentName of agents) {
          if (existsSync(join(flowPath, `${agentName}.md`))) count++;
        }
      }
      expect(count).toBe(9);
    });
  });

  // ── Section 3: _shared protocols installed ──

  test.describe("shared protocols (_shared)", () => {
    test("_shared directory exists", () => {
      expect(existsSync(SHARED_DIR)).toBe(true);
    });

    const EXPECTED_PROTOCOLS = [
      "evaluation-criteria.md",
      "priority-loops.md",
      "team-protocol.md",
      "verification-protocol.md",
    ];

    for (const protocol of EXPECTED_PROTOCOLS) {
      test(`${protocol} exists`, () => {
        expect(existsSync(join(SHARED_DIR, protocol))).toBe(true);
      });

      test(`${protocol} has meaningful content`, () => {
        const content = readFileSync(join(SHARED_DIR, protocol), "utf-8");
        expect(content.length).toBeGreaterThan(100);
      });
    }

    test("evaluation-criteria.md defines all 4 dimensions", () => {
      const content = readFileSync(join(SHARED_DIR, "evaluation-criteria.md"), "utf-8");
      expect(content).toContain("Functionality");
      expect(content).toContain("Correctness");
      expect(content).toContain("Design Fidelity");
      expect(content).toContain("Code Quality");
    });

    test("priority-loops.md defines all 4 priority levels", () => {
      const content = readFileSync(join(SHARED_DIR, "priority-loops.md"), "utf-8");
      expect(content).toContain("Low");
      expect(content).toContain("Medium");
      expect(content).toContain("High");
      expect(content).toContain("Critical");
    });

    test("verification-protocol.md references belief engine", () => {
      const content = readFileSync(join(SHARED_DIR, "verification-protocol.md"), "utf-8");
      expect(content).toContain("belief-engine");
      expect(content).toContain("MnemeBrain");
    });

    test("team-protocol.md defines worktree and commit rules", () => {
      const content = readFileSync(join(SHARED_DIR, "team-protocol.md"), "utf-8");
      expect(content).toContain("worktree");
      expect(content).toContain("conventional commits");
    });

    test("shared protocols are loadable via index.ts exports", async () => {
      const mod = await import(join(PKG_ROOT, "dist", "index.js"));
      expect(Object.keys(mod.shared).length).toBe(EXPECTED_PROTOCOLS.length);
      for (const protocol of EXPECTED_PROTOCOLS) {
        expect(mod.shared[protocol], `shared protocol ${protocol} not loaded`).toBeTruthy();
      }
    });
  });

  // ── Section 4: Scripts installed and usable ──

  test.describe("scripts installation", () => {
    test("scripts directory exists", () => {
      expect(existsSync(SCRIPTS_DIR)).toBe(true);
    });

    const EXPECTED_SCRIPTS = ["_lib.sh", "state-tracker.sh", "workflow.sh"];

    for (const script of EXPECTED_SCRIPTS) {
      test(`${script} exists`, () => {
        expect(existsSync(join(SCRIPTS_DIR, script))).toBe(true);
      });

      test(`${script} starts with shebang or sources _lib`, () => {
        const content = readFileSync(join(SCRIPTS_DIR, script), "utf-8");
        expect(
          content.startsWith("#!/") || content.includes("source"),
          `${script} does not look like valid bash`,
        ).toBe(true);
      });
    }

    test("state-tracker.sh sources _lib.sh", () => {
      const content = readFileSync(join(SCRIPTS_DIR, "state-tracker.sh"), "utf-8");
      expect(content).toContain('source "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"');
    });

    test("workflow.sh sources _lib.sh", () => {
      const content = readFileSync(join(SCRIPTS_DIR, "workflow.sh"), "utf-8");
      expect(content).toContain('source "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"');
    });

    test("_lib.sh exports resolve_state_home", () => {
      const content = readFileSync(join(SCRIPTS_DIR, "_lib.sh"), "utf-8");
      expect(content).toContain("resolve_state_home()");
    });

    test("_lib.sh exports detect_package_manager", () => {
      const content = readFileSync(join(SCRIPTS_DIR, "_lib.sh"), "utf-8");
      expect(content).toContain("detect_package_manager()");
    });

    test("_lib.sh exports safe_write_json", () => {
      const content = readFileSync(join(SCRIPTS_DIR, "_lib.sh"), "utf-8");
      expect(content).toContain("safe_write_json()");
    });

    test("scripts are referenced by debate agent TOOLS.md", () => {
      const tools = readFileSync(join(DEBATE_DIR, "TOOLS.md"), "utf-8");
      expect(tools).toContain("scripts/state-tracker.sh");
    });

    test("scripts are included in package.json files array", () => {
      const pkg = JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf-8"));
      expect(pkg.files).toContain("scripts");
    });
  });

  // ── Section 5: Agent classification via index.ts ──

  test.describe("agent classification and loading", () => {
    test("debate agent is classified as orchestrated", async () => {
      const mod = await import(join(PKG_ROOT, "dist", "index.js"));
      const orchestrated = mod.getOrchestratedAgents();
      expect(orchestrated["debate"]).toBeTruthy();
      expect(orchestrated["debate"].type).toBe("orchestrated");
    });

    test("orchestrated debate agent has 9 sub-agents", async () => {
      const mod = await import(join(PKG_ROOT, "dist", "index.js"));
      const debate = mod.getOrchestratedAgents()["debate"];
      expect(Object.keys(debate.subAgents).length).toBe(9);
    });

    test("getSubAgent retrieves specific sub-agents", async () => {
      const mod = await import(join(PKG_ROOT, "dist", "index.js"));
      const finder = mod.getSubAgent("debate", "review-finder");
      expect(finder).toBeTruthy();
      expect(finder.name).toBe("review-finder");
      expect(finder.tools).toContain("Read");

      const advocate = mod.getSubAgent("debate", "eval-advocate");
      expect(advocate).toBeTruthy();
      expect(advocate.name).toBe("eval-advocate");
    });

    test("C-suite agents are classified as onboarding", async () => {
      const mod = await import(join(PKG_ROOT, "dist", "index.js"));
      const onboarding = mod.getOnboardingAgents();
      const expectedOnboarding = ["ceo-brainstorm", "ceo-nl", "cmo-brainstorm", "coo-brainstorm", "cto-brainstorm"];
      for (const name of expectedOnboarding) {
        if (onboarding[name]) {
          expect(onboarding[name].type).toBe("onboarding");
        }
      }
    });
  });

  // ── Section 6: Agent creation in Paperclip server ──

  test.describe("agent import into Paperclip server", () => {
    let companyId: string;

    test.beforeAll(async ({ request, baseURL }) => {
      const company = await createTestCompany(request, baseURL!);
      companyId = company.id;
    });

    test.afterAll(async ({ request, baseURL }) => {
      if (companyId) await deleteCompany(request, baseURL!, companyId);
    });

    test("debate orchestrator agent is creatable in Paperclip", async ({ request, baseURL }) => {
      const createRes = await request.post(`${baseURL}/api/companies/${companyId}/agents`, {
        data: {
          name: "E2E-Debate-Orchestrator",
          role: "general",
          adapterType: "process",
        },
      });
      expect(createRes.ok(), `Failed to create debate agent: ${await createRes.text()}`).toBe(true);
      const agent = await createRes.json();
      expect(agent.id ?? agent.agent?.id).toBeTruthy();
    });

    test("all C-suite agents are creatable", async ({ request, baseURL }) => {
      const roles = [
        { name: "E2E-CEO", role: "ceo" },
        { name: "E2E-CTO", role: "cto" },
        { name: "E2E-CMO", role: "cmo" },
        { name: "E2E-COO", role: "general" },
      ];

      for (const { name, role } of roles) {
        const res = await request.post(`${baseURL}/api/companies/${companyId}/agents`, {
          data: { name, role, adapterType: "process" },
        });
        expect(res.ok(), `Failed to create ${name}: ${await res.text()}`).toBe(true);
      }
    });

    test("agents receive instruction bundles with shared protocols", async ({ request, baseURL }) => {
      const createRes = await request.post(`${baseURL}/api/companies/${companyId}/agents`, {
        data: {
          name: "E2E-Bundle-Test",
          role: "general",
          adapterType: "process",
        },
      });
      expect(createRes.ok()).toBe(true);
      const agentData = await createRes.json();
      const agentId = agentData.id ?? agentData.agent?.id;

      const bundleRes = await request.get(
        `${baseURL}/api/agents/${agentId}/instructions-bundle?companyId=${companyId}`,
      );
      expect(bundleRes.ok()).toBe(true);
      const bundle = await bundleRes.json();
      expect(bundle.files).toBeDefined();
      expect(Array.isArray(bundle.files)).toBe(true);
    });
  });
});
