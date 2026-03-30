#!/usr/bin/env bash
# scripts/state-tracker.sh — State management for Paperclip agent pipeline
# Usage:
#   bash scripts/state-tracker.sh init <taskId> <type> <slug> <mode>
#   bash scripts/state-tracker.sh update <phase> <status>
#   bash scripts/state-tracker.sh get
#   bash scripts/state-tracker.sh resume
#   bash scripts/state-tracker.sh tokens <model> <count>
#   bash scripts/state-tracker.sh set-validation <key> [value] [agent]
#   bash scripts/state-tracker.sh validate-checkpoints <phase>
#   bash scripts/state-tracker.sh save-checkpoint
#   bash scripts/state-tracker.sh restore-checkpoint [reason]
#   bash scripts/state-tracker.sh check-rollback <trigger>
#   bash scripts/state-tracker.sh cost-report
#   bash scripts/state-tracker.sh check-budget
#   bash scripts/state-tracker.sh increment-iteration <phase> [gate-name]
#   bash scripts/state-tracker.sh get-iteration-count <phase> [gate-name]
#   bash scripts/state-tracker.sh check-circuit-breaker <phase>
#   bash scripts/state-tracker.sh estimate-cost <task> [--workflow=X]
#   bash scripts/state-tracker.sh qa-round <phase> <sprint> <round> <verdict> <scores-json>
#   bash scripts/state-tracker.sh get-qa-rounds <phase> [sprint-number]
#   bash scripts/state-tracker.sh check-qa-budget <phase> [sprint-number]
#   bash scripts/state-tracker.sh check-qa-regression <phase> <sprint-number> <scores-json>
#   bash scripts/state-tracker.sh quality-report
#   bash scripts/state-tracker.sh adversarial-report <found> <killed> <survived> <disputed> <real>
#   bash scripts/state-tracker.sh set-lean-mode
#
# Environment:
#   PAPERCLIP_HOME — Override the state directory (default: .paperclip)

set -uo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

# require_jq is provided by _lib.sh
require_jq

# resolve_state_home is provided by _lib.sh
STATE_DIR=$(resolve_state_home)
STATE_FILE="$STATE_DIR/state.json"
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
CONFIG_FILE="$PROJECT_ROOT/.paperclip.json"

mkdir -p "$STATE_DIR"

cmd="${1:-get}"

case "$cmd" in
  init)
    TASK_ID="${2:-unnamed}"
    TYPE="${3:-unknown}"
    SLUG="${4:-unknown}"
    MODE="${5:-interactive}"

    # Detect workflow type if not specified
    if [ "$TYPE" = "unknown" ] || [ -z "$TYPE" ]; then
      WORKFLOW_TYPE=$(bash scripts/workflow.sh detect "$TASK_ID" 2>/dev/null || echo "feature")
    else
      # Map legacy types to workflow types
      case "$TYPE" in
        new-feature) WORKFLOW_TYPE="feature" ;;
        bug-fix) WORKFLOW_TYPE="bugfix" ;;
        hotfix) WORKFLOW_TYPE="hotfix" ;;
        refactor) WORKFLOW_TYPE="refactor" ;;
        *) WORKFLOW_TYPE="$TYPE" ;;
      esac
    fi

    # Load phases from workflow configuration
    WORKFLOW_PHASES=$(bash scripts/workflow.sh get-phases "$WORKFLOW_TYPE" 2>/dev/null)
    if [ -n "$WORKFLOW_PHASES" ]; then
      # Build phases JSON from workflow
      PHASES="{"
      FIRST=true
      while IFS= read -r phase; do
        [ "$FIRST" = true ] && FIRST=false || PHASES="${PHASES},"
        PHASES="${PHASES}\"${phase}\":{\"status\":\"pending\"}"
      done <<< "$WORKFLOW_PHASES"
      PHASES="${PHASES}}"
    else
      # Fallback to default phases — MUST stay in sync with workflow.sh defaults
      case "$TYPE" in
        new-feature|feature)
          PHASES='{"analyse":{"status":"pending"},"design":{"status":"pending"},"plan":{"status":"pending"},"migrate":{"status":"pending"},"implement":{"status":"pending"},"test":{"status":"pending"},"validate":{"status":"pending"},"update":{"status":"pending"},"ship":{"status":"pending"}}'
          ;;
        bug-fix|bugfix)
          PHASES='{"analyse":{"status":"pending"},"plan":{"status":"pending"},"implement":{"status":"pending"},"test":{"status":"pending"},"validate":{"status":"pending"},"update":{"status":"pending"},"ship":{"status":"pending"}}'
          ;;
        hotfix)
          PHASES='{"analyse":{"status":"pending"},"implement":{"status":"pending"},"test":{"status":"pending"},"ship":{"status":"pending"}}'
          ;;
        refactor)
          PHASES='{"analyse":{"status":"pending"},"design":{"status":"pending"},"plan":{"status":"pending"},"implement":{"status":"pending"},"test":{"status":"pending"},"validate":{"status":"pending"},"update":{"status":"pending"},"ship":{"status":"pending"}}'
          ;;
        security-fix)
          PHASES='{"analyse":{"status":"pending"},"plan":{"status":"pending"},"implement":{"status":"pending"},"test":{"status":"pending"},"validate":{"status":"pending"},"update":{"status":"pending"},"ship":{"status":"pending"}}'
          ;;
        optimization)
          PHASES='{"analyse":{"status":"pending"},"plan":{"status":"pending"},"implement":{"status":"pending"},"test":{"status":"pending"},"validate":{"status":"pending"},"update":{"status":"pending"},"ship":{"status":"pending"}}'
          ;;
        migration)
          PHASES='{"analyse":{"status":"pending"},"plan":{"status":"pending"},"implement":{"status":"pending"},"test":{"status":"pending"},"validate":{"status":"pending"},"update":{"status":"pending"},"ship":{"status":"pending"}}'
          ;;
        *)
          PHASES='{"analyse":{"status":"pending"},"implement":{"status":"pending"},"test":{"status":"pending"},"validate":{"status":"pending"},"ship":{"status":"pending"}}'
          ;;
      esac
    fi

    BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")

    jq -n \
      --arg taskId "$TASK_ID" \
      --arg type "$TYPE" \
      --arg workflow "$WORKFLOW_TYPE" \
      --arg slug "$SLUG" \
      --arg branch "$BRANCH" \
      --arg mode "$MODE" \
      --arg started "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
      --argjson phases "$PHASES" \
      '{
        taskId: $taskId,
        type: $type,
        workflowType: $workflow,
        slug: $slug,
        branch: $branch,
        mode: $mode,
        startedAt: $started,
        phases: $phases,
        currentPhase: null,
        tokensUsed: {opus: 0, sonnet: 0, haiku: 0},
        iterations: {},
        errors: [],
        communications: [],
        validations: {},
        decisions: []
      }' > "$STATE_FILE"
    echo "✅ State initialized: $TASK_ID ($TYPE)"
    ;;

  update)
    PHASE="${2:-unknown}"
    STATUS="${3:-done}"

    if [ ! -f "$STATE_FILE" ]; then
      echo "⚠️ No state file. Run 'init' first."
      exit 1
    fi

    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Update current phase when starting
    if [ "$STATUS" = "in-progress" ] || [ "$STATUS" = "active" ]; then
      _result=$(jq --arg phase "$PHASE" '.currentPhase = $phase' "$STATE_FILE")
      safe_write_json "$STATE_FILE" "$_result"
    fi

    # Update phase status — only set completedAt on terminal states
    if [ "$STATUS" = "done" ] || [ "$STATUS" = "failed" ]; then
      _result=$(jq --arg phase "$PHASE" --arg status "$STATUS" --arg ts "$TIMESTAMP" \
        '.phases[$phase].status = $status | .phases[$phase].completedAt = $ts | .currentPhase = null' \
        "$STATE_FILE")
      safe_write_json "$STATE_FILE" "$_result"

      # Get agent recommendations for next phase if workflow configured
      WORKFLOW_TYPE=$(jq -r '.workflowType // .type' "$STATE_FILE")
      if [ -n "$WORKFLOW_TYPE" ]; then
        NEXT_PHASE=$(jq -r '.phases | to_entries[] | select(.value.status != "done") | .key' "$STATE_FILE" | head -1)
        if [ -n "$NEXT_PHASE" ]; then
          NEXT_AGENT=$(bash scripts/workflow.sh get-agent "$WORKFLOW_TYPE" "$NEXT_PHASE" 2>/dev/null)
          echo "   Next: $NEXT_PHASE (agent: $NEXT_AGENT)"
        fi
      fi
    else
      _result=$(jq --arg phase "$PHASE" --arg status "$STATUS" \
        '.phases[$phase].status = $status' "$STATE_FILE")
      safe_write_json "$STATE_FILE" "$_result"
    fi

    echo "✅ Phase '$PHASE' → $STATUS"
    ;;

  get)
    if [ ! -f "$STATE_FILE" ]; then
      echo "No active pipeline."
      exit 0
    fi
    jq . "$STATE_FILE"
    ;;

  resume)
    if [ ! -f "$STATE_FILE" ]; then
      echo "No state to resume."
      exit 1
    fi

    # Find first non-done phase
    NEXT=$(jq -r '.phases | to_entries[] | select(.value.status != "done") | .key' "$STATE_FILE" | head -1)
    if [ -z "$NEXT" ]; then
      echo "✅ All phases complete."
    else
      TASK=$(jq -r '.taskId' "$STATE_FILE")
      echo "🔄 Resume: $TASK → continue from phase: $NEXT"
      echo "   Run: resume from phase: $NEXT"
    fi
    ;;

  tokens)
    MODEL="${2:-sonnet}"
    COUNT="${3:-0}"
    if ! [[ "$COUNT" =~ ^[0-9]+$ ]]; then
      echo "Error: token count must be a positive integer, got: $COUNT" >&2
      exit 1
    fi
    if [ -f "$STATE_FILE" ]; then
      _result=$(jq --arg model "$MODEL" --argjson count "$COUNT" \
        '.tokensUsed[$model] += $count' "$STATE_FILE")
      safe_write_json "$STATE_FILE" "$_result"
    fi
    ;;

  error)
    MSG="${2:-unknown error}"
    PHASE="${3:-unknown}"
    if [ -f "$STATE_FILE" ]; then
      _result=$(jq --arg msg "$MSG" --arg phase "$PHASE" --arg ts "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        '.errors += [{"phase": $phase, "message": $msg, "at": $ts}]' "$STATE_FILE")
      safe_write_json "$STATE_FILE" "$_result"
    fi
    ;;

  set-validation)
    KEY="${2:-}"
    VALUE="${3:-true}"
    AGENT="${4:-self}"
    if [ -z "$KEY" ]; then
      echo "Error: Validation key required" >&2
      exit 1
    fi
    if [ ! -f "$STATE_FILE" ]; then
      echo "⚠️ No state file. Run 'init' first." >&2
      exit 1
    fi
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    _result=$(jq --arg key "$KEY" --argjson met_value "$VALUE" --arg agent "$AGENT" --arg ts "$TIMESTAMP" \
      '.validations[$key] = {"met": $met_value, "agent": $agent, "timestamp": $ts}' \
      "$STATE_FILE")
    safe_write_json "$STATE_FILE" "$_result"
    echo "✅ Validation '$KEY' set by $AGENT"
    ;;

  validate-checkpoints)
    PHASE="${2:-}"
    if [ -z "$PHASE" ]; then
      echo "Error: Phase required" >&2
      exit 1
    fi
    if [ ! -f "$STATE_FILE" ]; then
      echo "⚠️ No state file. Run 'init' first." >&2
      exit 1
    fi
    WORKFLOW_TYPE=$(jq -r '.workflowType // .type' "$STATE_FILE")
    REQUIREMENTS=$(bash scripts/workflow.sh get-checkpoints "$WORKFLOW_TYPE" "$PHASE" 2>/dev/null)
    if [ -z "$REQUIREMENTS" ]; then
      echo "PASS: No checkpoints defined for phase '$PHASE'"
      exit 0
    fi
    MISSING=""
    ALL_MET=true
    while IFS= read -r req; do
      [ -z "$req" ] && continue
      MET=$(jq -r --arg key "$req" '.validations[$key].met // false' "$STATE_FILE")
      if [ "$MET" != "true" ]; then
        ALL_MET=false
        MISSING="${MISSING}  - ${req}\n"
      fi
    done <<< "$REQUIREMENTS"
    if [ "$ALL_MET" = "true" ]; then
      echo "PASS: All checkpoints met for phase '$PHASE'"
      exit 0
    else
      echo "FAIL: Missing checkpoints for phase '$PHASE':"
      printf '%b' "$MISSING"
      exit 1
    fi
    ;;

  save-checkpoint)
    if [ ! -f "$STATE_FILE" ]; then
      echo "⚠️ No state file. Run 'init' first." >&2
      exit 1
    fi
    cp "$STATE_FILE" "$STATE_DIR/checkpoint.json"
    echo "✅ Checkpoint saved"
    ;;

  restore-checkpoint)
    REASON="${2:-manual restore}"
    if [ ! -f "$STATE_DIR/checkpoint.json" ]; then
      echo "⚠️ No checkpoint to restore." >&2
      exit 1
    fi
    cp "$STATE_DIR/checkpoint.json" "$STATE_FILE"
    # Log the rollback event
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    _result=$(jq --arg reason "$REASON" --arg ts "$TIMESTAMP" \
      '.errors += [{"phase": "rollback", "message": ("Rolled back: " + $reason), "at": $ts}]' \
      "$STATE_FILE")
    safe_write_json "$STATE_FILE" "$_result"
    echo "🔄 Checkpoint restored (reason: $REASON)"
    ;;

  check-rollback)
    TRIGGER="${2:-}"
    if [ -z "$TRIGGER" ]; then
      echo "Error: Trigger name required" >&2
      exit 1
    fi
    if [ ! -f "$STATE_FILE" ]; then
      echo "⚠️ No state file. Run 'init' first." >&2
      exit 1
    fi
    WORKFLOW_TYPE=$(jq -r '.workflowType // .type' "$STATE_FILE")
    TRIGGERS=$(bash scripts/workflow.sh get-rollback-triggers "$WORKFLOW_TYPE" 2>/dev/null)
    if [ -z "$TRIGGERS" ]; then
      echo "OK: No rollback triggers defined"
      exit 0
    fi
    if echo "$TRIGGERS" | grep -qx "$TRIGGER"; then
      echo "ROLLBACK: Trigger '$TRIGGER' matched in workflow '$WORKFLOW_TYPE'"
      exit 1
    else
      echo "OK: Trigger '$TRIGGER' not in rollback list"
      exit 0
    fi
    ;;

  cost-report)
    if [ ! -f "$STATE_FILE" ]; then
      echo "⚠️ No state file. Run 'init' first." >&2
      exit 1
    fi
    OPUS=$(jq -r '.tokensUsed.opus // 0' "$STATE_FILE")
    SONNET=$(jq -r '.tokensUsed.sonnet // 0' "$STATE_FILE")
    HAIKU=$(jq -r '.tokensUsed.haiku // 0' "$STATE_FILE")
    TOTAL_TOKENS=$((OPUS + SONNET + HAIKU))

    # Blended rates per 1M tokens (input+output average)
    # opus ~$40/1M, sonnet ~$8/1M, haiku ~$2/1M
    OPUS_COST=$(awk -v t="$OPUS" 'BEGIN { printf "%.4f", t * 40 / 1000000 }')
    SONNET_COST=$(awk -v t="$SONNET" 'BEGIN { printf "%.4f", t * 8 / 1000000 }')
    HAIKU_COST=$(awk -v t="$HAIKU" 'BEGIN { printf "%.4f", t * 2 / 1000000 }')
    TOTAL_COST=$(awk -v a="$OPUS_COST" -v b="$SONNET_COST" -v c="$HAIKU_COST" 'BEGIN { printf "%.4f", a + b + c }')

    echo "┌─────────────────────────────────────────┐"
    echo "│          💰 Cost Report                  │"
    echo "├──────────┬────────────┬─────────────────┤"
    echo "│ Model    │ Tokens     │ Est. Cost       │"
    echo "├──────────┼────────────┼─────────────────┤"
    printf "│ opus     │ %10s │ \$%14s │\n" "$OPUS" "$OPUS_COST"
    printf "│ sonnet   │ %10s │ \$%14s │\n" "$SONNET" "$SONNET_COST"
    printf "│ haiku    │ %10s │ \$%14s │\n" "$HAIKU" "$HAIKU_COST"
    echo "├──────────┼────────────┼─────────────────┤"
    printf "│ TOTAL    │ %10s │ \$%14s │\n" "$TOTAL_TOKENS" "$TOTAL_COST"
    echo "└──────────┴────────────┴─────────────────┘"
    ;;

  check-budget)
    if [ ! -f "$STATE_FILE" ]; then
      echo "⚠️ No state file. Run 'init' first." >&2
      exit 1
    fi

    # Read budget from .paperclip.json or state
    BUDGET_LEVEL="medium"
    if [ -f "$CONFIG_FILE" ]; then
      CUSTOM_BUDGET=$(jq -r '.defaultBudget // empty' "$CONFIG_FILE" 2>/dev/null)
      [ -n "$CUSTOM_BUDGET" ] && BUDGET_LEVEL="$CUSTOM_BUDGET"
    fi

    # Token limits per budget level (defaults)
    case "$BUDGET_LEVEL" in
      low)    TOKEN_LIMIT=200000 ;;
      medium) TOKEN_LIMIT=500000 ;;
      high)   TOKEN_LIMIT=1000000 ;;
      *)      TOKEN_LIMIT=500000 ;;
    esac

    # Override with custom limits from .paperclip.json
    if [ -f "$CONFIG_FILE" ]; then
      CUSTOM_LIMIT=$(jq -r --arg level "$BUDGET_LEVEL" '.budget.tokenLimits[$level] // empty' "$CONFIG_FILE" 2>/dev/null)
      [ -n "$CUSTOM_LIMIT" ] && TOKEN_LIMIT="$CUSTOM_LIMIT"
    fi

    OPUS=$(jq -r '.tokensUsed.opus // 0' "$STATE_FILE")
    SONNET=$(jq -r '.tokensUsed.sonnet // 0' "$STATE_FILE")
    HAIKU=$(jq -r '.tokensUsed.haiku // 0' "$STATE_FILE")
    TOTAL_TOKENS=$((OPUS + SONNET + HAIKU))

    if ! [[ "$TOKEN_LIMIT" =~ ^[0-9]+$ ]] || [ "$TOKEN_LIMIT" -le 0 ] 2>/dev/null; then
      echo "WARN: TOKEN_LIMIT is zero or invalid — skipping budget check"
      exit 0
    fi

    USAGE_PCT=$((TOTAL_TOKENS * 100 / TOKEN_LIMIT))

    if [ "$TOTAL_TOKENS" -ge "$TOKEN_LIMIT" ]; then
      echo "OVER_BUDGET: ${TOTAL_TOKENS}/${TOKEN_LIMIT} tokens (${USAGE_PCT}%) — budget: $BUDGET_LEVEL"
      exit 1
    elif [ "$USAGE_PCT" -ge 80 ]; then
      echo "WARNING: ${TOTAL_TOKENS}/${TOKEN_LIMIT} tokens (${USAGE_PCT}%) — budget: $BUDGET_LEVEL"
      exit 0
    else
      echo "OK: ${TOTAL_TOKENS}/${TOKEN_LIMIT} tokens (${USAGE_PCT}%) — budget: $BUDGET_LEVEL"
      exit 0
    fi
    ;;

  set-team-status)
    PHASE="${2:-}"
    AGENT_ID="${3:-}"
    STATUS="${4:-}"
    if [ -z "$PHASE" ] || [ -z "$AGENT_ID" ] || [ -z "$STATUS" ]; then
      echo "Error: set-team-status requires <phase> <agent-id> <status>" >&2
      exit 1
    fi
    if [ ! -f "$STATE_FILE" ]; then
      echo "⚠️ No state file. Run 'init' first." >&2
      exit 1
    fi
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    _result=$(jq --arg phase "$PHASE" --arg agent "$AGENT_ID" --arg status "$STATUS" --arg ts "$TIMESTAMP" \
      '.phases[$phase].team[$agent] = {"status": $status, "updatedAt": $ts}' "$STATE_FILE")
    safe_write_json "$STATE_FILE" "$_result"
    echo "✅ Team status: phase '$PHASE', agent '$AGENT_ID' → $STATUS"
    ;;

  get-team-status)
    PHASE="${2:-}"
    if [ -z "$PHASE" ]; then
      echo "Error: get-team-status requires <phase>" >&2
      exit 1
    fi
    if [ ! -f "$STATE_FILE" ]; then
      echo "⚠️ No state file. Run 'init' first." >&2
      exit 1
    fi
    jq -r --arg phase "$PHASE" '.phases[$phase].team // {}' "$STATE_FILE"
    ;;

  is-team-complete)
    PHASE="${2:-}"
    if [ -z "$PHASE" ]; then
      echo "Error: is-team-complete requires <phase>" >&2
      exit 1
    fi
    if [ ! -f "$STATE_FILE" ]; then
      echo "⚠️ No state file. Run 'init' first." >&2
      exit 1
    fi
    TEAM=$(jq -r --arg phase "$PHASE" '.phases[$phase].team // {}' "$STATE_FILE")
    AGENT_COUNT=$(echo "$TEAM" | jq 'length')
    if [ "$AGENT_COUNT" -eq 0 ]; then
      echo "INCOMPLETE"
      exit 1
    fi
    NOT_MERGED=$(echo "$TEAM" | jq '[to_entries[] | select(.value.status != "merged")] | length')
    if [ "$NOT_MERGED" -eq 0 ]; then
      echo "COMPLETE"
      exit 0
    else
      echo "INCOMPLETE"
      exit 1
    fi
    ;;

  increment-iteration)
    PHASE="${2:-}"
    GATE="${3:-_phase}"
    if [ -z "$PHASE" ]; then
      echo "Error: Phase required" >&2
      exit 1
    fi
    if [ ! -f "$STATE_FILE" ]; then
      echo "⚠️ No state file. Run 'init' first." >&2
      exit 1
    fi
    ITER_KEY="${PHASE}:${GATE}"
    _result=$(jq --arg key "$ITER_KEY" \
      '.iterations[$key] = ((.iterations[$key] // 0) + 1)' "$STATE_FILE")
    safe_write_json "$STATE_FILE" "$_result"
    NEW_COUNT=$(echo "$_result" | jq -r --arg key "$ITER_KEY" '.iterations[$key]')
    echo "$NEW_COUNT"
    ;;

  get-iteration-count)
    PHASE="${2:-}"
    GATE="${3:-_phase}"
    if [ -z "$PHASE" ]; then
      echo "Error: Phase required" >&2
      exit 1
    fi
    if [ ! -f "$STATE_FILE" ]; then
      echo "0"
      exit 0
    fi
    ITER_KEY="${PHASE}:${GATE}"
    jq -r --arg key "$ITER_KEY" '.iterations[$key] // 0' "$STATE_FILE"
    ;;

  check-circuit-breaker)
    PHASE="${2:-}"
    if [ -z "$PHASE" ]; then
      echo "Error: Phase required" >&2
      exit 1
    fi
    if [ ! -f "$STATE_FILE" ]; then
      echo "OK"
      exit 0
    fi

    # Load limits from .paperclip.json
    MAX_RETRIES=3
    MAX_CI_ROUNDS=2
    MAX_GATE_ITERS=3
    if [ -f "$CONFIG_FILE" ]; then
      CUSTOM_RETRIES=$(jq -r '.limits.maxPhaseRetries // empty' "$CONFIG_FILE" 2>/dev/null)
      [ -n "$CUSTOM_RETRIES" ] && MAX_RETRIES="$CUSTOM_RETRIES"
      CUSTOM_CI=$(jq -r '.limits.maxCIRounds // empty' "$CONFIG_FILE" 2>/dev/null)
      [ -n "$CUSTOM_CI" ] && MAX_CI_ROUNDS="$CUSTOM_CI"
      CUSTOM_GATE=$(jq -r '.limits.maxIterationsPerFeedbackGate // empty' "$CONFIG_FILE" 2>/dev/null)
      [ -n "$CUSTOM_GATE" ] && MAX_GATE_ITERS="$CUSTOM_GATE"
    fi

    # Check phase retry count
    PHASE_KEY="${PHASE}:_phase"
    PHASE_ITERS=$(jq -r --arg key "$PHASE_KEY" '.iterations[$key] // 0' "$STATE_FILE")
    if [ "$PHASE_ITERS" -ge "$MAX_RETRIES" ]; then
      echo "TRIPPED: Phase '$PHASE' exceeded max retries ($PHASE_ITERS/$MAX_RETRIES)"
      exit 1
    fi

    # Check CI round count
    CI_KEY="${PHASE}:ci"
    CI_ITERS=$(jq -r --arg key "$CI_KEY" '.iterations[$key] // 0' "$STATE_FILE")
    if [ "$CI_ITERS" -ge "$MAX_CI_ROUNDS" ]; then
      echo "TRIPPED: Phase '$PHASE' exceeded max CI rounds ($CI_ITERS/$MAX_CI_ROUNDS)"
      exit 1
    fi

    # Check individual feedback gate counts
    ALL_GATE_KEYS=$(jq -r --arg prefix "${PHASE}:" \
      '[.iterations | to_entries[] | select(.key | startswith($prefix)) | select(.key | endswith(":_phase") | not) | select(.key | endswith(":ci") | not)] | .[]? | .key + "=" + (.value | tostring)' \
      "$STATE_FILE" 2>/dev/null)

    if [ -n "$ALL_GATE_KEYS" ]; then
      while IFS= read -r entry; do
        GATE_KEY=$(echo "$entry" | cut -d= -f1)
        GATE_COUNT=$(echo "$entry" | cut -d= -f2)
        if [ "$GATE_COUNT" -ge "$MAX_GATE_ITERS" ]; then
          echo "TRIPPED: Feedback gate '$GATE_KEY' exceeded max iterations ($GATE_COUNT/$MAX_GATE_ITERS)"
          exit 1
        fi
      done <<< "$ALL_GATE_KEYS"
    fi

    # Check token budget for this phase
    if [ -f "$CONFIG_FILE" ]; then
      PHASE_TOKEN_LIMIT=$(jq -r --arg phase "$PHASE" '.limits.maxTokensPerPhase[$phase] // empty' "$CONFIG_FILE" 2>/dev/null)
      if [ -n "$PHASE_TOKEN_LIMIT" ]; then
        OPUS=$(jq -r '.tokensUsed.opus // 0' "$STATE_FILE")
        SONNET=$(jq -r '.tokensUsed.sonnet // 0' "$STATE_FILE")
        HAIKU=$(jq -r '.tokensUsed.haiku // 0' "$STATE_FILE")
        TOTAL=$((OPUS + SONNET + HAIKU))
        if [ "$TOTAL" -ge "$PHASE_TOKEN_LIMIT" ]; then
          echo "TRIPPED: Phase '$PHASE' exceeded token limit ($TOTAL/$PHASE_TOKEN_LIMIT)"
          exit 1
        fi
      fi
    fi

    echo "OK"
    ;;

  estimate-cost)
    TASK="${2:-unknown task}"
    WORKFLOW_TYPE="feature"
    # Parse --workflow=X from remaining args
    for arg in "${@:3}"; do
      case "$arg" in
        --workflow=*) WORKFLOW_TYPE="${arg#--workflow=}" ;;
      esac
    done

    # Get phase count for workflow
    PHASES=$(bash scripts/workflow.sh get-phases "$WORKFLOW_TYPE" 2>/dev/null)
    PHASE_COUNT=$(echo "$PHASES" | wc -l | tr -d ' ')

    # Load budget level
    BUDGET_LEVEL="medium"
    if [ -f "$CONFIG_FILE" ]; then
      CUSTOM_BUDGET=$(jq -r '.defaultBudget // empty' "$CONFIG_FILE" 2>/dev/null)
      [ -n "$CUSTOM_BUDGET" ] && BUDGET_LEVEL="$CUSTOM_BUDGET"
    fi

    # Estimate tokens per phase by model (rough averages)
    # Low budget: mostly haiku/sonnet, medium: mixed, high: opus-heavy
    case "$BUDGET_LEVEL" in
      low)
        EST_OPUS=$((PHASE_COUNT * 5000))
        EST_SONNET=$((PHASE_COUNT * 15000))
        EST_HAIKU=$((PHASE_COUNT * 10000))
        ;;
      medium)
        EST_OPUS=$((PHASE_COUNT * 15000))
        EST_SONNET=$((PHASE_COUNT * 25000))
        EST_HAIKU=$((PHASE_COUNT * 5000))
        ;;
      high)
        EST_OPUS=$((PHASE_COUNT * 30000))
        EST_SONNET=$((PHASE_COUNT * 15000))
        EST_HAIKU=$((PHASE_COUNT * 3000))
        ;;
      *)
        EST_OPUS=$((PHASE_COUNT * 15000))
        EST_SONNET=$((PHASE_COUNT * 25000))
        EST_HAIKU=$((PHASE_COUNT * 5000))
        ;;
    esac

    EST_TOTAL=$((EST_OPUS + EST_SONNET + EST_HAIKU))

    # Cost calculation (same rates as cost-report)
    EST_COST=$(awk "BEGIN { printf \"%.2f\", ($EST_OPUS * 40 + $EST_SONNET * 8 + $EST_HAIKU * 2) / 1000000 }")

    # Budget limits
    case "$BUDGET_LEVEL" in
      low)    BUDGET_LIMIT="\$3" ;;
      medium) BUDGET_LIMIT="\$10" ;;
      high)   BUDGET_LIMIT="\$25" ;;
      *)      BUDGET_LIMIT="\$10" ;;
    esac

    echo "┌─────────────────────────────────────────┐"
    echo "│       Cost Estimate (Pre-Execution)      │"
    echo "├─────────────────────────────────────────┤"
    printf "│ Task:     %-29s │\n" "${TASK:0:29}"
    printf "│ Workflow: %-29s │\n" "$WORKFLOW_TYPE ($PHASE_COUNT phases)"
    printf "│ Budget:   %-29s │\n" "$BUDGET_LEVEL (limit: $BUDGET_LIMIT)"
    echo "├──────────┬────────────┬────────────────┤"
    echo "│ Model    │ Tokens     │ Est. Cost      │"
    echo "├──────────┼────────────┼────────────────┤"
    printf "│ opus     │ %10s │ \$%13s │\n" "~$EST_OPUS" "$(awk "BEGIN { printf \"%.2f\", $EST_OPUS * 40 / 1000000 }")"
    printf "│ sonnet   │ %10s │ \$%13s │\n" "~$EST_SONNET" "$(awk "BEGIN { printf \"%.2f\", $EST_SONNET * 8 / 1000000 }")"
    printf "│ haiku    │ %10s │ \$%13s │\n" "~$EST_HAIKU" "$(awk "BEGIN { printf \"%.2f\", $EST_HAIKU * 2 / 1000000 }")"
    echo "├──────────┼────────────┼────────────────┤"
    printf "│ TOTAL    │ ~%9s │ ~\$%12s │\n" "$EST_TOTAL" "$EST_COST"
    echo "└──────────┴────────────┴────────────────┘"
    ;;

  qa-round)
    # Record a QA evaluation round with scores and verdict, scoped per sprint
    # Usage: qa-round <phase> <sprint> <round> <verdict> <scores-json>
    # Example: qa-round implement 1 1 NEEDS_CHANGES '{"functionality":6,"correctness":7,"design_fidelity":8,"code_quality":7}'
    PHASE="${2:?Missing phase}"
    SPRINT_NUM="${3:?Missing sprint number}"
    ROUND="${4:?Missing round number}"
    VERDICT="${5:?Missing verdict (PASS|NEEDS_CHANGES|REGRESSION_DETECTED)}"
    SCORES="${6:?Missing scores JSON}"

    if [ ! -f "$STATE_FILE" ]; then
      echo "⚠️ No state file. Run 'init' first."
      exit 1
    fi

    SPRINT_KEY="${PHASE}:sprint-${SPRINT_NUM}"
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Calculate weighted average from scores and config weights
    WEIGHTS=$(jq -r '.harness.criteria // {} | {
      f: (.functionality.weight // 3),
      c: (.correctness.weight // 3),
      d: (.design_fidelity.weight // 2),
      q: (.code_quality.weight // 1)
    }' "$CONFIG_FILE" 2>/dev/null || echo '{"f":3,"c":3,"d":2,"q":1}')
    if ! jq -e . >/dev/null 2>&1 <<<"$SCORES"; then
      echo "Error: invalid JSON in scores argument" >&2
      exit 1
    fi
    WEIGHTED=$(jq -n --argjson scores "$SCORES" --argjson w "$WEIGHTS" '
      ($scores.functionality * $w.f + $scores.correctness * $w.c + $scores.design_fidelity * $w.d + $scores.code_quality * $w.q) / ($w.f + $w.c + $w.d + $w.q)
      | . * 10 | floor / 10
    ')

    # Build the round entry
    ROUND_ENTRY=$(jq -n \
      --argjson round "$ROUND" \
      --argjson sprint "$SPRINT_NUM" \
      --arg verdict "$VERDICT" \
      --argjson scores "$SCORES" \
      --argjson weighted "$WEIGHTED" \
      --arg at "$TIMESTAMP" \
      '{round: $round, sprint: $sprint, verdict: $verdict, scores: $scores, weightedAverage: $weighted, at: $at}')

    # Initialize quality object if missing, scope rounds per sprint key
    _result=$(jq --arg key "$SPRINT_KEY" --argjson entry "$ROUND_ENTRY" '
      .quality //= {rounds: {}, reviewerVerdict: null, finalScore: null}
      | .quality.rounds[$key] //= []
      | .quality.rounds[$key] += [$entry]
      | if $entry.verdict == "PASS" then .quality.finalScore = $entry.weightedAverage else . end
    ' "$STATE_FILE")
    safe_write_json "$STATE_FILE" "$_result"

    echo "✅ QA round $ROUND (sprint $SPRINT_NUM) recorded: $VERDICT (weighted: $WEIGHTED)"
    ;;

  get-qa-rounds)
    # Get count of QA rounds for a specific sprint
    # Usage: get-qa-rounds <phase> [sprint-number]
    PHASE="${2:?Missing phase}"
    SPRINT_NUM="${3:-1}"
    SPRINT_KEY="${PHASE}:sprint-${SPRINT_NUM}"

    if [ ! -f "$STATE_FILE" ]; then
      echo "0"
      exit 0
    fi

    jq --arg key "$SPRINT_KEY" '.quality.rounds[$key] // [] | length' "$STATE_FILE"
    ;;

  check-qa-budget)
    # Check if more QA rounds are allowed for a specific sprint
    # Usage: check-qa-budget <phase> [sprint-number]
    PHASE="${2:?Missing phase}"
    SPRINT_NUM="${3:-1}"
    SPRINT_KEY="${PHASE}:sprint-${SPRINT_NUM}"

    if [ ! -f "$STATE_FILE" ]; then
      echo "OK"
      exit 0
    fi

    CURRENT_ROUNDS=$(jq --arg key "$SPRINT_KEY" '.quality.rounds[$key] // [] | length' "$STATE_FILE")
    MAX_ROUNDS=$(jq -r '.harness.maxQARounds // 2' "$CONFIG_FILE" 2>/dev/null || echo 2)

    if [ "$CURRENT_ROUNDS" -ge "$MAX_ROUNDS" ]; then
      echo "QA_BUDGET_EXCEEDED: sprint $SPRINT_NUM used $CURRENT_ROUNDS/$MAX_ROUNDS rounds"
      exit 1
    fi

    echo "OK (sprint $SPRINT_NUM: $CURRENT_ROUNDS/$MAX_ROUNDS rounds used)"
    ;;

  check-qa-regression)
    # Compare current scores against previous round for the same sprint
    # Usage: check-qa-regression <phase> <sprint-number> <current-scores-json>
    # Exits 0 if OK, exits 1 if regression detected
    PHASE="${2:?Missing phase}"
    SPRINT_NUM="${3:?Missing sprint number}"
    CURRENT_SCORES="${4:?Missing current scores JSON}"
    SPRINT_KEY="${PHASE}:sprint-${SPRINT_NUM}"

    if [ ! -f "$STATE_FILE" ]; then
      echo "OK"
      exit 0
    fi

    ROUNDS=$(jq --arg key "$SPRINT_KEY" '.quality.rounds[$key] // [] | length' "$STATE_FILE")
    if [ "$ROUNDS" -lt 1 ]; then
      echo "OK (first round for sprint $SPRINT_NUM, no comparison)"
      exit 0
    fi

    # Get previous round's weighted average for THIS sprint
    PREV_WEIGHTED=$(jq --arg key "$SPRINT_KEY" '.quality.rounds[$key][-1].weightedAverage' "$STATE_FILE")

    # Guard against null/missing values
    if [ "$PREV_WEIGHTED" = "null" ] || [ -z "$PREV_WEIGHTED" ]; then
      echo "OK (no previous weighted average for sprint $SPRINT_NUM)"
      exit 0
    fi

    # Calculate current weighted average using config weights
    WEIGHTS=$(jq -r '.harness.criteria // {} | {
      f: (.functionality.weight // 3),
      c: (.correctness.weight // 3),
      d: (.design_fidelity.weight // 2),
      q: (.code_quality.weight // 1)
    }' "$CONFIG_FILE" 2>/dev/null || echo '{"f":3,"c":3,"d":2,"q":1}')
    CURR_WEIGHTED=$(jq -n --argjson scores "$CURRENT_SCORES" --argjson w "$WEIGHTS" '
      ($scores.functionality * $w.f + $scores.correctness * $w.c + $scores.design_fidelity * $w.d + $scores.code_quality * $w.q) / ($w.f + $w.c + $w.d + $w.q)
      | . * 10 | floor / 10
    ')

    # Guard against null/empty CURR_WEIGHTED
    if [ -z "$CURR_WEIGHTED" ] || [ "$CURR_WEIGHTED" = "null" ]; then
      echo "Error: could not compute weighted average from current scores" >&2
      exit 1
    fi

    # Compare
    REGRESSED=$(awk "BEGIN { print ($CURR_WEIGHTED < $PREV_WEIGHTED) ? \"true\" : \"false\" }")

    if [ "$REGRESSED" = "true" ]; then
      echo "REGRESSION_DETECTED: sprint $SPRINT_NUM score dropped from $PREV_WEIGHTED to $CURR_WEIGHTED"
      exit 1
    fi

    echo "OK (sprint $SPRINT_NUM: previous $PREV_WEIGHTED, current $CURR_WEIGHTED)"
    ;;

  quality-report)
    # Show quality scores and cost together
    if [ ! -f "$STATE_FILE" ]; then
      echo "⚠️ No state file."
      exit 1
    fi

    TASK=$(jq -r '.taskId // "unknown"' "$STATE_FILE")
    WORKFLOW=$(jq -r '.workflowType // "unknown"' "$STATE_FILE")
    FINAL_SCORE=$(jq -r '.quality.finalScore // "N/A"' "$STATE_FILE")
    REVIEWER_VERDICT=$(jq -r '.quality.reviewerVerdict // "N/A"' "$STATE_FILE")
    # Count total QA rounds across all sprints
    QA_ROUNDS=$(jq '[.quality.rounds // {} | to_entries[] | .value | length] | add // 0' "$STATE_FILE")
    LEAN_MODE=$(jq -r '.quality.leanMode // false' "$STATE_FILE")

    # Token costs
    OPUS=$(jq '.tokensUsed.opus // 0' "$STATE_FILE")
    SONNET=$(jq '.tokensUsed.sonnet // 0' "$STATE_FILE")
    HAIKU=$(jq '.tokensUsed.haiku // 0' "$STATE_FILE")
    COST=$(awk "BEGIN { printf \"%.2f\", ($OPUS * 40 + $SONNET * 8 + $HAIKU * 2) / 1000000 }")

    echo "┌─────────────────────────────────────────────┐"
    echo "│ 🎼 Quality Report                  │"
    echo "├─────────────────────────────────────────────┤"
    printf "│ Task:       %-31s │\n" "$TASK"
    printf "│ Workflow:   %-31s │\n" "$WORKFLOW"
    printf "│ Quality:    %-31s │\n" "${FINAL_SCORE}/10"
    printf "│ QA Rounds:  %-31s │\n" "$QA_ROUNDS"
    printf "│ Reviewer:   %-31s │\n" "$REVIEWER_VERDICT"
    printf "│ Lean mode:  %-31s │\n" "$LEAN_MODE"
    printf "│ Cost:       ~\$%-29s │\n" "$COST"
    echo "├─────────────────────────────────────────────┤"

    # Show per-sprint round history
    SPRINT_KEYS=$(jq -r '.quality.rounds // {} | keys[]' "$STATE_FILE" 2>/dev/null)
    if [ -n "$SPRINT_KEYS" ]; then
      echo "│ QA Round History:                           │"
      for KEY in $SPRINT_KEYS; do
        jq -r --arg key "$KEY" '.quality.rounds[$key][] | "│   \($key) R\(.round): \(.verdict) (\(.weightedAverage))    │"' "$STATE_FILE" 2>/dev/null || true
      done
    fi

    # Show adversarial review results if present
    ADV_FOUND=$(jq -r '.quality.adversarialReview.found // empty' "$STATE_FILE" 2>/dev/null)
    if [ -n "$ADV_FOUND" ]; then
      echo "├─────────────────────────────────────────────┤"
      echo "│ Adversarial Review:                         │"
      ADV_KILLED=$(jq -r '.quality.adversarialReview.killed' "$STATE_FILE")
      ADV_REAL=$(jq -r '.quality.adversarialReview.realIssues' "$STATE_FILE")
      ADV_FA=$(jq -r '.quality.adversarialReview.finderAccuracy' "$STATE_FILE")
      ADV_FP=$(jq -r '.quality.adversarialReview.falsePositiveRate' "$STATE_FILE")
      printf "│   Found: %-4s Killed: %-4s Real: %-4s      │\n" "$ADV_FOUND" "$ADV_KILLED" "$ADV_REAL"
      printf "│   Finder accuracy: %s%% FP rate: %s%%        │\n" "$ADV_FA" "$ADV_FP"
    fi

    echo "└─────────────────────────────────────────────┘"
    ;;

  adversarial-report)
    # Record adversarial review results
    # Usage: adversarial-report <found> <killed> <survived> <disputed> <real>
    FOUND="${2:?Missing found count}"
    KILLED="${3:?Missing killed count}"
    SURVIVED="${4:?Missing survived count}"
    DISPUTED="${5:?Missing disputed count}"
    REAL="${6:?Missing real count}"

    if [ ! -f "$STATE_FILE" ]; then
      echo "⚠️ No state file."
      exit 1
    fi

    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    FINDER_ACCURACY=$(awk "BEGIN { if ($FOUND > 0) printf \"%.0f\", ($REAL / $FOUND) * 100; else print 0 }")
    FALSE_POSITIVE_RATE=$(awk "BEGIN { if ($FOUND > 0) printf \"%.0f\", ($KILLED / $FOUND) * 100; else print 0 }")

    _result=$(jq \
      --argjson found "$FOUND" \
      --argjson killed "$KILLED" \
      --argjson survived "$SURVIVED" \
      --argjson disputed "$DISPUTED" \
      --argjson real "$REAL" \
      --argjson finderAccuracy "$FINDER_ACCURACY" \
      --argjson falsePositiveRate "$FALSE_POSITIVE_RATE" \
      --arg ts "$TIMESTAMP" \
      '.quality //= {}
       | .quality.adversarialReview = {
           found: $found,
           killed: $killed,
           survived: $survived,
           disputed: $disputed,
           realIssues: $real,
           finderAccuracy: $finderAccuracy,
           falsePositiveRate: $falsePositiveRate,
           timestamp: $ts
         }' "$STATE_FILE")
    safe_write_json "$STATE_FILE" "$_result"
    echo "✅ Adversarial review: $FOUND found → $KILLED killed → $REAL real issues (finder accuracy: ${FINDER_ACCURACY}%, false positive rate: ${FALSE_POSITIVE_RATE}%)"
    ;;

  set-lean-mode)
    # Record that --lean was used (for quality report comparison)
    if [ ! -f "$STATE_FILE" ]; then
      echo "⚠️ No state file."
      exit 1
    fi
    _result=$(jq '.quality //= {} | .quality.leanMode = true' "$STATE_FILE")
    safe_write_json "$STATE_FILE" "$_result"
    echo "✅ Lean mode recorded"
    ;;

  clean)
    rm -rf "$STATE_DIR/state.json" "$STATE_DIR/changes.log" "$STATE_DIR/checkpoint.json"
    echo "🧹 State cleaned"
    ;;

  *)
    cat <<EOF
Usage: state-tracker.sh <command> [options]

Commands:
  init <taskId> <type> <slug> <mode>         Initialize pipeline state
  update <phase> <status>                    Update phase status
  get                                        Show current state
  resume                                     Find next phase to resume
  tokens <model> <count>                     Record token usage
  error <message> [phase]                    Record an error
  set-validation <key> [value] [agent]       Set a validation checkpoint
  validate-checkpoints <phase>               Check all checkpoints for phase
  save-checkpoint                            Save state checkpoint for rollback
  restore-checkpoint [reason]                Restore state from checkpoint
  check-rollback <trigger>                   Check if trigger requires rollback
  cost-report                                Show token usage and estimated costs
  check-budget                               Check if within budget limits
  set-team-status <phase> <agent-id> <status>  Update team agent status for a phase
  get-team-status <phase>                    Return team object for a phase
  is-team-complete <phase>                   Check if all team agents have merged: true
  increment-iteration <phase> [gate]         Increment iteration counter (returns new count)
  get-iteration-count <phase> [gate]         Get current iteration count
  check-circuit-breaker <phase>              Check if any limits exceeded (exits 1 if tripped)
  estimate-cost <task> [--workflow=X]         Pre-execution cost estimate
  qa-round <phase> <sprint> <round> <verdict> <scores> Record QA evaluation round
  get-qa-rounds <phase> [sprint]             Get count of QA rounds
  check-qa-budget <phase> [sprint]           Check if more QA rounds allowed
  check-qa-regression <phase> <sprint> <scores> Detect score regression (exits 1 if regressed)
  quality-report                             Show quality scores + cost summary
  adversarial-report <f> <k> <s> <d> <r>    Record adversarial review results
  set-lean-mode                              Record --lean flag for comparison
  clean                                      Remove ephemeral state files
EOF
    exit 1
    ;;
esac
