#!/usr/bin/env bash
# scripts/workflow.sh — Workflow management for Paperclip agent pipeline
# Usage:
#   bash scripts/workflow.sh detect <task_description>
#   bash scripts/workflow.sh load <workflow_type>
#   bash scripts/workflow.sh get-phases <workflow_type>
#   bash scripts/workflow.sh validate-phase <workflow> <phase> <status>
#   bash scripts/workflow.sh get-agent <workflow> <phase>
#   bash scripts/workflow.sh should-communicate <workflow> <phase> <agent>
#   bash scripts/workflow.sh get-checkpoints <workflow> <phase>
#   bash scripts/workflow.sh get-rollback-triggers <workflow>
#   bash scripts/workflow.sh supports-parallel <workflow> <phase>
#   bash scripts/workflow.sh get-parallel-config <workflow> <phase>
#   bash scripts/workflow.sh get-plugin-skills <plugin> <phase> <hook-type>
#   bash scripts/workflow.sh get-default-plugins

set -uo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

# require_jq is provided by _lib.sh
require_jq

if [[ -n "${CLAUDE_PLUGIN_ROOT:-}" ]]; then
  WORKFLOW_DIR="${CLAUDE_PLUGIN_ROOT}/workflows"
else
  WORKFLOW_DIR="workflows"
fi
PAPERCLIP_HOME=$(resolve_state_home)
STATE_FILE="$PAPERCLIP_HOME/state.json"
BELIEF_SCRIPT="node dist/cli/belief-engine.js"

# Detect workflow type from task description
detect_workflow() {
  local TASK="$1"
  local TASK_LOWER=$(echo "$TASK" | tr '[:upper:]' '[:lower:]')

  # Security-related keywords
  if echo "$TASK_LOWER" | grep -qE "(security|vulnerability|cve|exploit|injection|xss|csrf|sqli)"; then
    echo "security-fix"
    return
  fi

  # Hotfix/urgent keywords
  if echo "$TASK_LOWER" | grep -qE "(hotfix|urgent|critical|emergency|production.*down|crash|breaking)"; then
    echo "hotfix"
    return
  fi

  # Bug fix keywords
  if echo "$TASK_LOWER" | grep -qE "(fix|bug|issue|error|broken|fail|repair)"; then
    echo "bugfix"
    return
  fi

  # Migration keywords
  if echo "$TASK_LOWER" | grep -qE "(migration|migrate|database.*change|schema.*update|upgrade)"; then
    echo "migration"
    return
  fi

  # Optimization/performance keywords
  if echo "$TASK_LOWER" | grep -qE "(optimize|performance|speed|slow|bottleneck|improve.*performance|reduce.*memory)"; then
    echo "optimization"
    return
  fi

  # Refactor keywords
  if echo "$TASK_LOWER" | grep -qE "(refactor|clean|reorganize|restructure|simplify|improve.*code)"; then
    echo "refactor"
    return
  fi

  # Default to feature for new additions
  echo "feature"
}

# Check Python3+PyYAML availability (cached)
_PYTHON_YAML_AVAILABLE=""
check_python_yaml() {
  if [ -z "$_PYTHON_YAML_AVAILABLE" ]; then
    if python3 -c "import yaml" 2>/dev/null; then
      _PYTHON_YAML_AVAILABLE="yes"
    else
      _PYTHON_YAML_AVAILABLE="no"
      echo "WARNING: python3 or PyYAML not available — using fallback workflow phases." >&2
      echo "  Install: pip3 install pyyaml" >&2
      echo "  This means workflow YAML configs won't be parsed; reduced phase list will be used." >&2
    fi
  fi
  [ "$_PYTHON_YAML_AVAILABLE" = "yes" ]
}

# Default workflow phases (used when YAML files are missing or can't be parsed)
# These MUST stay in sync with the YAML workflow definitions in workflows/
# Note: migrate is conditional in feature.yaml (only if DB changes needed) but included here for completeness
DEFAULT_FEATURE_PHASES='["analyse","design","plan","migrate","implement","test","validate","update","ship"]'
DEFAULT_BUGFIX_PHASES='["analyse","plan","implement","test","validate","update","ship"]'
DEFAULT_HOTFIX_PHASES='["analyse","implement","test","ship"]'
DEFAULT_REFACTOR_PHASES='["analyse","design","plan","implement","test","validate"]'
DEFAULT_SECURITY_PHASES='["analyse","plan","implement","test","validate","update","ship"]'
DEFAULT_OPTIMIZATION_PHASES='["analyse","plan","implement","test","validate"]'
DEFAULT_MIGRATION_PHASES='["analyse","plan","implement","test","validate","ship"]'
DEFAULT_GENERIC_PHASES='["analyse","implement","test","validate","ship"]'

# Fallback checkpoints per workflow type (kept in sync with YAML definitions)
get_fallback_checkpoints() {
  local WORKFLOW_TYPE="$1"
  case "$WORKFLOW_TYPE" in
    feature)
      cat <<'EOCP'
{"design":{"requires":["architect_approval","feasibility_confirmed"]},"implement":{"requires":["integrity_check_pass","unit_tests_pass"]},"validate":{"requires":["security_scan_pass","review_complete","no_critical_issues"]}}
EOCP
      ;;
    bugfix)
      cat <<'EOCP'
{"analyse":{"requires":["root_cause_identified","affected_areas_mapped"]},"implement":{"requires":["fix_addresses_root_cause","no_new_issues_introduced"]},"test":{"requires":["regression_tests_added","all_tests_pass"]},"validate":{"requires":["fix_confirmed","no_side_effects"]}}
EOCP
      ;;
    hotfix)
      cat <<'EOCP'
{"analyse":{"requires":["issue_understood","fix_approach_defined"]},"implement":{"requires":["fix_applied","no_data_corruption_risk"]},"test":{"requires":["critical_path_tested","fix_verified"]},"ship":{"requires":["rollback_plan_ready"]}}
EOCP
      ;;
    refactor)
      cat <<'EOCP'
{"analyse":{"requires":["improvement_areas_identified","risk_assessment_complete"]},"design":{"requires":["refactor_strategy_defined","behavior_preservation_plan"]},"implement":{"requires":["no_behavior_changes","tests_still_pass"]},"test":{"requires":["all_existing_tests_pass","no_functionality_broken"]},"validate":{"requires":["code_quality_improved","performance_not_degraded"]}}
EOCP
      ;;
    security-fix)
      cat <<'EOCP'
{"analyse":{"requires":["vulnerability_understood","attack_vector_identified","impact_assessed"]},"plan":{"requires":["fix_strategy_secure","no_new_vulnerabilities"]},"implement":{"requires":["vulnerability_patched","secure_coding_practices"]},"test":{"requires":["security_tests_added","penetration_test_pass"]},"validate":{"requires":["vulnerability_closed","security_scan_clean","no_new_issues"]}}
EOCP
      ;;
    optimization)
      cat <<'EOCP'
{"analyse":{"requires":["bottleneck_identified","baseline_metrics_captured","improvement_targets_set"]},"plan":{"requires":["optimization_strategy_defined","risk_assessment_complete"]},"implement":{"requires":["no_functionality_broken","tests_still_pass"]},"test":{"requires":["performance_tests_pass","no_regressions"]},"validate":{"requires":["metrics_improved","no_side_effects"]}}
EOCP
      ;;
    migration)
      cat <<'EOCP'
{"analyse":{"requires":["migration_scope_defined","data_impact_assessed","rollback_plan_exists"]},"plan":{"requires":["migration_steps_documented","backward_compatibility_verified","rollback_tested"]},"implement":{"requires":["migration_scripts_created","idempotent_execution"]},"test":{"requires":["migration_tested_with_sample_data","rollback_tested","no_data_loss"]},"validate":{"requires":["data_integrity_verified","performance_acceptable","no_breaking_changes"]}}
EOCP
      ;;
    *)
      echo '{}'
      ;;
  esac
}

# Fallback rollback triggers per workflow type (kept in sync with YAML definitions)
get_fallback_rollback_triggers() {
  local WORKFLOW_TYPE="$1"
  case "$WORKFLOW_TYPE" in
    feature)
      echo '["security_vulnerability_found","critical_test_failure","architect_veto","data_corruption_risk"]'
      ;;
    bugfix)
      echo '["introduces_new_bugs","performance_regression","test_coverage_decreased"]'
      ;;
    hotfix)
      echo '["makes_situation_worse","introduces_instability","breaks_other_features"]'
      ;;
    refactor)
      echo '["behavior_changed","tests_failing","performance_degraded","functionality_broken"]'
      ;;
    security-fix)
      echo '["introduces_new_vulnerability","breaks_security_features","exposes_sensitive_data"]'
      ;;
    optimization)
      echo '["functionality_broken","tests_failing","performance_worse","memory_leak_introduced","stability_degraded"]'
      ;;
    migration)
      echo '["data_loss_detected","data_corruption","migration_timeout","integrity_check_failed","performance_degradation","dependent_service_failure"]'
      ;;
    *)
      echo '[]'
      ;;
  esac
}

# Get fallback JSON for a workflow type
get_fallback_workflow() {
  local WORKFLOW_TYPE="$1"
  local PHASES
  case "$WORKFLOW_TYPE" in
    feature)      PHASES="$DEFAULT_FEATURE_PHASES" ;;
    bugfix)       PHASES="$DEFAULT_BUGFIX_PHASES" ;;
    hotfix)       PHASES="$DEFAULT_HOTFIX_PHASES" ;;
    refactor)     PHASES="$DEFAULT_REFACTOR_PHASES" ;;
    security-fix)   PHASES="$DEFAULT_SECURITY_PHASES" ;;
    optimization)   PHASES="$DEFAULT_OPTIMIZATION_PHASES" ;;
    migration)      PHASES="$DEFAULT_MIGRATION_PHASES" ;;
    *)              PHASES="$DEFAULT_GENERIC_PHASES" ;;
  esac

  local CHECKPOINTS=$(get_fallback_checkpoints "$WORKFLOW_TYPE")
  local ROLLBACK_TRIGGERS=$(get_fallback_rollback_triggers "$WORKFLOW_TYPE")

  local PLAN_AGENT="coordinator"
  local VALIDATE_AGENT="guardian,reviewer"
  # bugfix uses self for plan, reviewer for validate
  if [[ "$WORKFLOW_TYPE" == "bugfix" ]]; then
    PLAN_AGENT="self"
    VALIDATE_AGENT="reviewer"
  fi
  # hotfix has no plan or validate phase
  if [[ "$WORKFLOW_TYPE" == "hotfix" ]]; then
    PLAN_AGENT="self"
    VALIDATE_AGENT="reviewer"
  fi

  jq -n \
    --arg type "$WORKFLOW_TYPE" \
    --argjson phases "$PHASES" \
    --arg plan_agent "$PLAN_AGENT" \
    --arg validate_agent "$VALIDATE_AGENT" \
    --argjson checkpoints "$CHECKPOINTS" \
    --argjson rollback_triggers "$ROLLBACK_TRIGGERS" \
    '{
      type: $type,
      phases: $phases,
      agents: {
        analyse: "architect",
        design: "designer",
        plan: $plan_agent,
        migrate: "implementer",
        implement: "implementer",
        test: "tester",
        validate: $validate_agent,
        update: "documenter",
        ship: "self"
      },
      communication: {},
      checkpoints: $checkpoints,
      rollback_triggers: $rollback_triggers
    }'
}

# Load workflow configuration
load_workflow() {
  local WORKFLOW_TYPE="$1"
  local WORKFLOW_FILE="$WORKFLOW_DIR/${WORKFLOW_TYPE}.yaml"

  if [ ! -f "$WORKFLOW_FILE" ]; then
    # Return default workflow if specific YAML doesn't exist
    get_fallback_workflow "$WORKFLOW_TYPE"
  elif check_python_yaml; then
    # Parse YAML to JSON with Python3+PyYAML
    python3 -c "
import yaml, json, sys
with open(sys.argv[1], 'r') as f:
    data = yaml.safe_load(f)
print(json.dumps(data))
" "$WORKFLOW_FILE" 2>/dev/null || get_fallback_workflow "$WORKFLOW_TYPE"
  else
    # Python/PyYAML not available — use typed fallback
    get_fallback_workflow "$WORKFLOW_TYPE"
  fi
}

# Get phases for workflow
get_phases() {
  local WORKFLOW_TYPE="$1"
  local WORKFLOW=$(load_workflow "$WORKFLOW_TYPE")
  echo "$WORKFLOW" | jq -r '.phases[]'
}

# Validate if phase can transition based on workflow rules
validate_phase_transition() {
  local WORKFLOW_TYPE="$1"
  local CURRENT_PHASE="$2"
  local NEXT_PHASE="$3"

  local WORKFLOW=$(load_workflow "$WORKFLOW_TYPE")

  # Check if both phases exist in workflow
  local HAS_CURRENT=$(echo "$WORKFLOW" | jq --arg phase "$CURRENT_PHASE" '.phases | contains([$phase])')
  local HAS_NEXT=$(echo "$WORKFLOW" | jq --arg phase "$NEXT_PHASE" '.phases | contains([$phase])')

  if [ "$HAS_CURRENT" != "true" ] || [ "$HAS_NEXT" != "true" ]; then
    echo "invalid"
    return
  fi

  # Check dependencies if defined
  local DEPENDENCIES=$(echo "$WORKFLOW" | jq -r --arg phase "$NEXT_PHASE" '.dependencies[$phase][]?' 2>/dev/null)
  if [ -n "$DEPENDENCIES" ]; then
    while IFS= read -r dep; do
      # Check if dependency is completed
      if [ -f "$STATE_FILE" ]; then
        local DEP_STATUS=$(jq -r --arg phase "$dep" '.phases[$phase].status' "$STATE_FILE")
        if [ "$DEP_STATUS" != "done" ]; then
          echo "dependency_not_met:$dep"
          return
        fi
      fi
    done <<< "$DEPENDENCIES"
  fi

  echo "valid"
}

# Get agent assignment for phase
get_agent_for_phase() {
  local WORKFLOW_TYPE="$1"
  local PHASE="$2"

  local WORKFLOW=$(load_workflow "$WORKFLOW_TYPE")
  local AGENT=$(echo "$WORKFLOW" | jq -r --arg phase "$PHASE" '.agents[$phase] // "self"')

  # Check for conditional agent selection based on context
  if [ "$AGENT" = "conditional" ]; then
    # Analyze context to select appropriate agent
    local CONTEXT=$($BELIEF_SCRIPT context "$PHASE execution" 2>/dev/null | head -5)

    case "$PHASE" in
      design)
        if echo "$CONTEXT" | grep -qi "frontend\|ui\|component"; then
          AGENT="designer"
        else
          AGENT="architect"
        fi
        ;;
      implement)
        # Could select specialist based on detected stack
        AGENT="implementer"
        ;;
      *)
        AGENT="self"
        ;;
    esac
  fi

  echo "$AGENT"
}

# Check if agents should communicate in this phase
should_communicate() {
  local WORKFLOW_TYPE="$1"
  local PHASE="$2"
  local FROM_AGENT="$3"
  local TO_AGENT="${4:-}"

  local WORKFLOW=$(load_workflow "$WORKFLOW_TYPE")

  # Check communication rules
  local COMM_RULES=$(echo "$WORKFLOW" | jq -r --arg phase "$PHASE" '.communication[$phase][]?' 2>/dev/null)

  if [ -n "$COMM_RULES" ]; then
    while IFS= read -r rule; do
      local FROM
      local TO
      FROM=$(echo "$rule" | cut -d: -f1)
      TO=$(echo "$rule" | cut -d: -f2)

      if [ "$FROM" = "$FROM_AGENT" ]; then
        if [ -z "$TO_AGENT" ] || [ "$TO" = "$TO_AGENT" ]; then
          echo "true:$TO"
          return
        fi
      fi
    done <<< "$COMM_RULES"
  fi

  # Default communication patterns
  case "$PHASE:$FROM_AGENT" in
    "design:designer")
      echo "true:architect"  # Designer should validate with architect
      ;;
    "implement:implementer")
      if [ "$WORKFLOW_TYPE" = "feature" ]; then
        echo "true:designer,architect"  # Check back with designers
      else
        echo "false"
      fi
      ;;
    "validate:reviewer")
      echo "true:architect,designer"  # Reviewer validates against design
      ;;
    *)
      echo "false"
      ;;
  esac
}

# Record inter-agent communication
record_communication() {
  local FROM_AGENT="$1"
  local TO_AGENT="$2"
  local MESSAGE="$3"
  local PHASE="${4:-unknown}"

  # Store in belief engine as communication record
  $BELIEF_SCRIPT believe \
    "[$FROM_AGENT → $TO_AGENT] $MESSAGE" \
    --evidence="agent:$FROM_AGENT:$PHASE" --category=communication \
    --agent="$FROM_AGENT" --phase="$PHASE" 2>/dev/null

  # Also append to state file if exists
  if [ -f "$STATE_FILE" ]; then
    local _comm_result
    _comm_result=$(jq --arg from "$FROM_AGENT" \
       --arg to "$TO_AGENT" \
       --arg msg "$MESSAGE" \
       --arg phase "$PHASE" \
       --arg ts "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
       '.communications += [{
          "from": $from,
          "to": $to,
          "message": $msg,
          "phase": $phase,
          "timestamp": $ts
        }]' \
       "$STATE_FILE")
    safe_write_json "$STATE_FILE" "$_comm_result"
  fi
}

# Get checkpoint requirements for a phase
get_checkpoints() {
  local WORKFLOW_TYPE="$1"
  local PHASE="$2"

  local WORKFLOW=$(load_workflow "$WORKFLOW_TYPE")
  local REQUIRES=$(echo "$WORKFLOW" | jq -r --arg phase "$PHASE" '.checkpoints[$phase].requires[]?' 2>/dev/null)

  if [ -z "$REQUIRES" ]; then
    echo "No checkpoints defined for phase '$PHASE' in workflow '$WORKFLOW_TYPE'" >&2
    return 0
  fi

  echo "$REQUIRES"
}

# Get rollback triggers for a workflow
get_rollback_triggers() {
  local WORKFLOW_TYPE="$1"

  local WORKFLOW=$(load_workflow "$WORKFLOW_TYPE")
  local TRIGGERS=$(echo "$WORKFLOW" | jq -r '.rollback_triggers[]?' 2>/dev/null)

  if [ -z "$TRIGGERS" ]; then
    echo "No rollback triggers defined for workflow '$WORKFLOW_TYPE'" >&2
    return 0
  fi

  echo "$TRIGGERS"
}

# Get workflow recommendations
get_recommendations() {
  local WORKFLOW_TYPE="$1"
  local PHASE="$2"

  case "$WORKFLOW_TYPE:$PHASE" in
    "feature:design")
      echo "- Consider both frontend UI/UX and backend architecture"
      echo "- Document API contracts and data models"
      echo "- Include error handling and edge cases"
      ;;
    "bugfix:analyse")
      echo "- Identify root cause, not just symptoms"
      echo "- Check for similar issues in codebase"
      echo "- Consider regression test requirements"
      ;;
    security-fix:*)
      echo "- Follow OWASP guidelines"
      echo "- Ensure complete fix without introducing new vulnerabilities"
      echo "- Add security tests to prevent regression"
      ;;
    "optimization:analyse")
      echo "- Profile current performance metrics"
      echo "- Identify bottlenecks with data"
      echo "- Set measurable improvement targets"
      ;;
    "migration:plan")
      echo "- Ensure backward compatibility"
      echo "- Create rollback plan"
      echo "- Test with production-like data"
      ;;
    *)
      echo "- Follow established patterns in codebase"
      ;;
  esac
}

# Check if a phase supports parallel execution
supports_parallel() {
  local WORKFLOW_TYPE="$1"
  local PHASE="$2"

  local WORKFLOW=$(load_workflow "$WORKFLOW_TYPE")

  # Check YAML phase_config for parallel flag
  local PARALLEL_FLAG
  PARALLEL_FLAG=$(echo "$WORKFLOW" | jq -r --arg phase "$PHASE" \
    '.phase_config[$phase].parallel // .phase_config[$phase].parallel_execution // false')

  if [ "$PARALLEL_FLAG" = "true" ]; then
    echo "true"
    return
  fi

  # Hotfix is a streamlined sequential workflow — never parallelize
  if [[ "$WORKFLOW_TYPE" == "hotfix" ]]; then
    echo "false"
    return
  fi

  # Fallback: known parallelizable phases
  case "$PHASE" in
    implement|test|validate|analyse|design)
      echo "true"
      ;;
    *)
      echo "false"
      ;;
  esac
}

# Get parallel execution config for a phase
get_parallel_config() {
  local WORKFLOW_TYPE="$1"
  local PHASE="$2"

  local WORKFLOW=$(load_workflow "$WORKFLOW_TYPE")

  local CONFIG
  CONFIG=$(echo "$WORKFLOW" | jq --arg phase "$PHASE" '{
    parallel: (.phase_config[$phase].parallel // .phase_config[$phase].parallel_execution // true),
    min_tasks: (.phase_config[$phase].min_tasks_for_parallel // 2),
    max_agents: (.phase_config[$phase].max_parallel_agents // 4)
  }')

  echo "$CONFIG"
}

# Resolve plugin skill name for a given plugin, phase, and hook type.
# Returns the skill name if the plugin convention matches, empty string otherwise.
# The caller (orchestration prompt) uses the Skill tool to invoke it;
# if the skill doesn't exist the Skill tool silently does nothing.
get_plugin_skills() {
  local PLUGIN_NAME="$1"
  local PHASE="$2"
  local HOOK_TYPE="$3"  # pre, post, on-fail, wrap

  if [ -z "$PLUGIN_NAME" ] || [ -z "$PHASE" ] || [ -z "$HOOK_TYPE" ]; then
    echo ""
    return
  fi

  # Check per-plugin phase restriction from .paperclip.json
  if [ -f ".paperclip.json" ]; then
    local PLUGIN_PHASES
    PLUGIN_PHASES=$(jq -r --arg name "$PLUGIN_NAME" --arg phase "$PHASE" \
      '.plugins.config[$name].phases // [] | if length == 0 then "all" elif contains([$phase]) then "match" else "skip" end' \
      ".paperclip.json" 2>/dev/null)

    if [ "$PLUGIN_PHASES" = "skip" ]; then
      echo ""
      return
    fi
  fi

  # Return the conventional skill name: <plugin>:<hook-type>-<phase>
  echo "${PLUGIN_NAME}:${HOOK_TYPE}-${PHASE}"
}

# Get default plugins from .paperclip.json
get_default_plugins() {
  if [ -f ".paperclip.json" ]; then
    jq -r '.plugins.defaults[]? // empty' ".paperclip.json" 2>/dev/null
  fi
}

# Get sub-steps for a phase (deterministic + agentic blueprint pattern)
# Returns JSON array of steps, or empty array if no steps defined
get_steps() {
  local WORKFLOW_TYPE="$1"
  local PHASE="$2"

  local WORKFLOW=$(load_workflow "$WORKFLOW_TYPE")
  local STEPS
  STEPS=$(echo "$WORKFLOW" | jq --arg phase "$PHASE" '.phase_config[$phase].steps // []' 2>/dev/null)

  if [ "$STEPS" = "null" ] || [ "$STEPS" = "[]" ]; then
    echo "[]"
    return
  fi

  echo "$STEPS"
}

# Get feedback gates for a phase
# Returns JSON array of feedback gate definitions
get_feedback_gates() {
  local WORKFLOW_TYPE="$1"
  local PHASE="$2"

  local WORKFLOW=$(load_workflow "$WORKFLOW_TYPE")
  local GATES
  GATES=$(echo "$WORKFLOW" | jq --arg phase "$PHASE" '.phase_config[$phase].feedback_gates // []' 2>/dev/null)

  if [ "$GATES" = "null" ] || [ "$GATES" = "[]" ]; then
    echo "[]"
    return
  fi

  echo "$GATES"
}

# Get iteration limits for a phase
# Returns JSON object with max_iterations and max_ci_rounds
get_iteration_limits() {
  local WORKFLOW_TYPE="$1"
  local PHASE="$2"

  local WORKFLOW=$(load_workflow "$WORKFLOW_TYPE")

  # Get from workflow YAML first
  local YAML_MAX_ITER YAML_MAX_CI
  YAML_MAX_ITER=$(echo "$WORKFLOW" | jq -r --arg phase "$PHASE" '.phase_config[$phase].max_iterations // empty' 2>/dev/null)
  YAML_MAX_CI=$(echo "$WORKFLOW" | jq -r --arg phase "$PHASE" '.phase_config[$phase].max_ci_rounds // empty' 2>/dev/null)

  # Override with .paperclip.json if present
  local JSON_MAX_ITER JSON_MAX_CI JSON_MAX_GATE
  if [ -f ".paperclip.json" ]; then
    JSON_MAX_ITER=$(jq -r '.limits.maxPhaseRetries // empty' ".paperclip.json" 2>/dev/null)
    JSON_MAX_CI=$(jq -r '.limits.maxCIRounds // empty' ".paperclip.json" 2>/dev/null)
    JSON_MAX_GATE=$(jq -r '.limits.maxIterationsPerFeedbackGate // empty' ".paperclip.json" 2>/dev/null)
  fi

  # Priority: .paperclip.json > workflow YAML > defaults
  local MAX_ITER=${JSON_MAX_ITER:-${YAML_MAX_ITER:-3}}
  local MAX_CI=${JSON_MAX_CI:-${YAML_MAX_CI:-2}}
  local MAX_GATE=${JSON_MAX_GATE:-3}

  jq -n \
    --argjson max_iterations "$MAX_ITER" \
    --argjson max_ci_rounds "$MAX_CI" \
    --argjson max_gate_iterations "$MAX_GATE" \
    '{max_iterations: $max_iterations, max_ci_rounds: $max_ci_rounds, max_gate_iterations: $max_gate_iterations}'
}

# Main command dispatcher
CMD="${1:-help}"
shift 2>/dev/null || true

case "$CMD" in
  detect)
    TASK="${*:-}"
    if [ -z "$TASK" ]; then
      echo "Error: Task description required"
      exit 1
    fi
    detect_workflow "$TASK"
    ;;

  load)
    WORKFLOW_TYPE="${1:-feature}"
    load_workflow "$WORKFLOW_TYPE"
    ;;

  get-phases)
    WORKFLOW_TYPE="${1:-feature}"
    get_phases "$WORKFLOW_TYPE"
    ;;

  validate-transition)
    WORKFLOW_TYPE="${1:-feature}"
    CURRENT="${2:-}"
    NEXT="${3:-}"
    validate_phase_transition "$WORKFLOW_TYPE" "$CURRENT" "$NEXT"
    ;;

  get-agent)
    WORKFLOW_TYPE="${1:-feature}"
    PHASE="${2:-analyse}"
    get_agent_for_phase "$WORKFLOW_TYPE" "$PHASE"
    ;;

  should-communicate)
    WORKFLOW_TYPE="${1:-feature}"
    PHASE="${2:-}"
    FROM_AGENT="${3:-}"
    TO_AGENT="${4:-}"
    should_communicate "$WORKFLOW_TYPE" "$PHASE" "$FROM_AGENT" "$TO_AGENT"
    ;;

  record-communication)
    FROM="${1:-unknown}"
    TO="${2:-unknown}"
    MESSAGE="${3:-}"
    PHASE="${4:-unknown}"
    record_communication "$FROM" "$TO" "$MESSAGE" "$PHASE"
    ;;

  get-checkpoints)
    WORKFLOW_TYPE="${1:-feature}"
    PHASE="${2:-}"
    if [ -z "$PHASE" ]; then
      echo "Error: Phase required" >&2
      exit 1
    fi
    get_checkpoints "$WORKFLOW_TYPE" "$PHASE"
    ;;

  get-rollback-triggers)
    WORKFLOW_TYPE="${1:-feature}"
    get_rollback_triggers "$WORKFLOW_TYPE"
    ;;

  recommendations)
    WORKFLOW_TYPE="${1:-feature}"
    PHASE="${2:-analyse}"
    get_recommendations "$WORKFLOW_TYPE" "$PHASE"
    ;;

  supports-parallel)
    WORKFLOW_TYPE="${1:-feature}"
    PHASE="${2:-implement}"
    supports_parallel "$WORKFLOW_TYPE" "$PHASE"
    ;;

  get-parallel-config)
    WORKFLOW_TYPE="${1:-feature}"
    PHASE="${2:-implement}"
    get_parallel_config "$WORKFLOW_TYPE" "$PHASE"
    ;;

  get-plugin-skills)
    PLUGIN_NAME="${1:-}"
    PHASE="${2:-}"
    HOOK_TYPE="${3:-pre}"
    get_plugin_skills "$PLUGIN_NAME" "$PHASE" "$HOOK_TYPE"
    ;;

  get-default-plugins)
    get_default_plugins
    ;;

  get-steps)
    WORKFLOW_TYPE="${1:-feature}"
    PHASE="${2:-implement}"
    get_steps "$WORKFLOW_TYPE" "$PHASE"
    ;;

  get-feedback-gates)
    WORKFLOW_TYPE="${1:-feature}"
    PHASE="${2:-implement}"
    get_feedback_gates "$WORKFLOW_TYPE" "$PHASE"
    ;;

  get-iteration-limits)
    WORKFLOW_TYPE="${1:-feature}"
    PHASE="${2:-implement}"
    get_iteration_limits "$WORKFLOW_TYPE" "$PHASE"
    ;;

  resolve-commands)
    # Returns JSON command map for the detected project stack
    # Usage: workflow.sh resolve-commands [project_root]
    PROJECT_ROOT="${1:-.}"
    resolve_commands "$PROJECT_ROOT"
    ;;

  check-deep-analysis)
    # Check CWD (target project) and plugin root (when running as plugin)
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ -f ".paperclip/scripts/deep-analyze.sh" ] || [ -f "$SCRIPT_DIR/deep-analyze.sh" ]; then
      echo "true"
    else
      echo "false"
    fi
    ;;

  help|*)
    cat <<EOF
Usage: workflow.sh <command> [options]

Commands:
  check-deep-analysis                  Check if deep analysis script is available
  detect <task>                    Detect workflow type from task description
  load <workflow>                  Load workflow configuration
  get-phases <workflow>            Get phases for workflow
  validate-transition <wf> <from> <to>  Check if phase transition is valid
  get-agent <workflow> <phase>     Get agent for phase
  should-communicate <wf> <phase> <from> [to]  Check communication requirements
  record-communication <from> <to> <msg> [phase]  Record agent communication
  get-checkpoints <workflow> <phase>  Get checkpoint requirements for phase
  get-rollback-triggers <workflow>    Get rollback triggers for workflow
  recommendations <workflow> <phase>  Get phase-specific recommendations
  supports-parallel <workflow> <phase>    Check if phase supports parallel execution
  get-parallel-config <workflow> <phase>  Get parallel config (min_tasks, max_agents)
  get-steps <workflow> <phase>         Get sub-steps for a phase (deterministic + agentic)
  get-feedback-gates <workflow> <phase>  Get feedback gate definitions for a phase
  get-iteration-limits <workflow> <phase>  Get iteration limits (max retries, CI rounds)
  resolve-commands [project_root]      Resolve abstract commands for detected stack (nodejs/python/rust/java/go)
  get-plugin-skills <plugin> <phase> <hook>  Get plugin skill name (pre/post/on-fail/wrap)
  get-default-plugins              List default plugins from .paperclip.json

Workflow Types:
  feature       Full feature development
  bugfix        Bug fixing workflow
  hotfix        Emergency fixes
  refactor      Code refactoring
  migration     Database/API migrations
  optimization  Performance improvements
  security-fix  Security vulnerability fixes
EOF
    ;;
esac