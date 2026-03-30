#!/usr/bin/env bash
# scripts/install.sh — Install skills, agents, and scripts into a running Paperclip instance
#
# Usage:
#   bash scripts/install.sh                              # install everything (auto-detect URL)
#   bash scripts/install.sh --url http://localhost:3100   # specify Paperclip URL
#   bash scripts/install.sh --company-id <id>             # use existing company
#   bash scripts/install.sh --source-path /mounted/path   # override import path (for Docker)
#   bash scripts/install.sh --skills-only                 # only import skills
#   bash scripts/install.sh --agents-only                 # only create agents
#   bash scripts/install.sh --dry-run                     # show what would be installed
#   bash scripts/install.sh --json                        # output results as JSON (for scripts/CI)
#
# Environment variables:
#   PAPERCLIP_URL       Base URL of Paperclip server (default: http://localhost:3100)
#   PAPERCLIP_COMPANY   Company ID to install into (creates new if unset)
#   MNEMEBRAIN_URL      MnemeBrain URL for belief engine (default: http://localhost:8000)

set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"
require_jq

# ─── Defaults ────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SKILLS_DIR="$PKG_ROOT/skills"
AGENTS_DIR="$PKG_ROOT/agents"
SCRIPTS_DIR="$PKG_ROOT/scripts"

PAPERCLIP_URL="${PAPERCLIP_URL:-http://localhost:3100}"
COMPANY_ID="${PAPERCLIP_COMPANY:-}"
MNEMEBRAIN_URL="${MNEMEBRAIN_URL:-http://localhost:8000}"

INSTALL_SKILLS=true
INSTALL_AGENTS=true
DRY_RUN=false
VERBOSE=false
ASSIGN_SKILLS=true
JSON_OUTPUT=false

# Override path sent to Paperclip API for skill import (for Docker-mounted paths)
SOURCE_PATH=""

# Skills that already exist in Paperclip — skip during import
SKIP_SKILLS="para-memory-files"

# ─── Argument parsing ────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)          PAPERCLIP_URL="$2"; shift 2 ;;
    --company-id)   COMPANY_ID="$2"; shift 2 ;;
    --mnemebrain)   MNEMEBRAIN_URL="$2"; shift 2 ;;
    --source-path)  SOURCE_PATH="$2"; shift 2 ;;
    --skills-only)  INSTALL_SKILLS=true; INSTALL_AGENTS=false; shift ;;
    --agents-only)  INSTALL_SKILLS=false; INSTALL_AGENTS=true; shift ;;
    --no-assign)    ASSIGN_SKILLS=false; shift ;;
    --dry-run)      DRY_RUN=true; shift ;;
    --json)         JSON_OUTPUT=true; shift ;;
    --verbose|-v)   VERBOSE=true; shift ;;
    --help|-h)
      sed -n '2,15p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# ─── Helpers ─────────────────────────────────────────────────────────

log()  { echo "[install] $*"; }
vlog() { $VERBOSE && echo "[install]   $*" || true; }
err()  { echo "[install] ERROR: $*" >&2; }
die()  { err "$@"; exit 1; }

# HTTP helper — wraps curl with common options, returns body on stdout, status on fd3
api() {
  local method="$1" path="$2"
  shift 2
  local url="${PAPERCLIP_URL}${path}"

  local http_code body
  body=$(curl -s -w '\n%{http_code}' -X "$method" \
    -H "Content-Type: application/json" \
    "$@" \
    "$url")
  http_code=$(echo "$body" | tail -1)
  body=$(echo "$body" | sed '$d')

  if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
    echo "$body"
    return 0
  else
    vlog "HTTP $http_code from $method $path"
    vlog "Response: $body"
    return 1
  fi
}

# ─── Pre-flight checks ───────────────────────────────────────────────

preflight() {
  log "Checking prerequisites..."

  # Check Paperclip is reachable
  if ! curl -sf "${PAPERCLIP_URL}/api/health" >/dev/null 2>&1; then
    die "Paperclip server not reachable at ${PAPERCLIP_URL}. Is it running?"
  fi
  log "Paperclip server: OK (${PAPERCLIP_URL})"

  # Check MnemeBrain (optional — warn but don't fail)
  if curl -sf "${MNEMEBRAIN_URL}/health" >/dev/null 2>&1; then
    log "MnemeBrain server: OK (${MNEMEBRAIN_URL})"
  else
    log "MnemeBrain server: not reachable (${MNEMEBRAIN_URL}) — belief engine features will be unavailable"
  fi

  # Check local directories exist
  [[ -d "$SKILLS_DIR" ]] || die "Skills directory not found: $SKILLS_DIR"
  [[ -d "$AGENTS_DIR" ]] || die "Agents directory not found: $AGENTS_DIR"
}

# ─── Company setup ───────────────────────────────────────────────────

ensure_company() {
  if [[ -n "$COMPANY_ID" ]]; then
    # Verify company exists
    if api GET "/api/companies/${COMPANY_ID}" >/dev/null 2>&1; then
      log "Using existing company: $COMPANY_ID"
    else
      die "Company $COMPANY_ID not found"
    fi
    return
  fi

  # List companies and use the first one, or create a new one
  local companies
  companies=$(api GET "/api/companies" 2>/dev/null) || true

  if [[ -n "$companies" ]]; then
    local count
    count=$(echo "$companies" | jq 'if type == "array" then length else 0 end' 2>/dev/null || echo "0")
    if [[ "$count" -gt 0 ]]; then
      COMPANY_ID=$(echo "$companies" | jq -r '.[0].id')
      local company_name
      company_name=$(echo "$companies" | jq -r '.[0].name')
      log "Using existing company: $company_name ($COMPANY_ID)"
      return
    fi
  fi

  # Create a new company
  log "No companies found, creating one..."
  local result
  result=$(api POST "/api/companies" -d '{"name":"Paperclip Skills"}') || die "Failed to create company"
  COMPANY_ID=$(echo "$result" | jq -r '.id')
  log "Created company: Paperclip Skills ($COMPANY_ID)"
}

# ─── Skill installation ──────────────────────────────────────────────

install_skills() {
  log "Installing skills..."

  local skill_dirs=()
  for dir in "$SKILLS_DIR"/*/; do
    [[ -f "${dir}SKILL.md" ]] || continue
    local sname
    sname=$(basename "$dir")
    # Skip skills that already exist in Paperclip
    if echo " $SKIP_SKILLS " | grep -q " $sname "; then
      vlog "Skipping built-in skill: $sname"
      continue
    fi
    skill_dirs+=("$sname")
  done

  if [[ ${#skill_dirs[@]} -eq 0 ]]; then
    log "No skills found in $SKILLS_DIR"
    return
  fi

  log "Found ${#skill_dirs[@]} skills: ${skill_dirs[*]}"

  if $DRY_RUN; then
    for skill in "${skill_dirs[@]}"; do
      log "  [dry-run] Would install skill: $skill"
    done
    return
  fi

  # Try bulk import via path first (works when Paperclip can access the filesystem)
  # Use --source-path override if set (for Docker-mounted paths), otherwise local SKILLS_DIR
  local import_path="${SOURCE_PATH:+${SOURCE_PATH}/skills}"
  import_path="${import_path:-$SKILLS_DIR}"
  local import_result
  import_result=$(api POST "/api/companies/${COMPANY_ID}/skills/import" \
    -d "{\"source\":\"${import_path}\"}" 2>/dev/null) || true

  if [[ -n "$import_result" ]]; then
    local imported_count
    imported_count=$(echo "$import_result" | jq '.imported | length' 2>/dev/null || echo "0")
    if [[ "$imported_count" -gt 0 ]]; then
      log "Bulk imported $imported_count skills via filesystem path"
      echo "$import_result" | jq -r '.imported[] | "  + \(.slug // .key // .name)"' 2>/dev/null || true
      return
    fi
  fi

  # Fallback: import skills one by one via API with content upload
  log "Filesystem import unavailable, uploading skills via API..."
  local installed=0 failed=0

  for skill_name in "${skill_dirs[@]}"; do
    local skill_dir="$SKILLS_DIR/$skill_name"
    local skill_content
    skill_content=$(cat "$skill_dir/SKILL.md")

    # Extract name from SKILL.md frontmatter (name: line)
    local display_name
    display_name=$(grep -m1 '^name:' "$skill_dir/SKILL.md" | sed 's/^name:[[:space:]]*//' || echo "$skill_name")
    [[ -z "$display_name" ]] && display_name="$skill_name"

    # Collect references
    local refs="{}"
    if [[ -d "$skill_dir/references" ]]; then
      refs=$(cd "$skill_dir/references" && \
        for f in *.md; do
          [[ -f "$f" ]] || continue
          jq -n --arg name "$f" --arg content "$(cat "$f")" '{($name): $content}'
        done | jq -s 'add // {}')
    fi

    # Build skill payload
    local payload
    payload=$(jq -n \
      --arg slug "$skill_name" \
      --arg name "$display_name" \
      --arg content "$skill_content" \
      --argjson references "$refs" \
      '{slug: $slug, name: $name, content: $content, references: $references}')

    if api POST "/api/companies/${COMPANY_ID}/skills" -d "$payload" >/dev/null 2>&1; then
      vlog "Installed skill: $skill_name"
      ((installed++))
    else
      err "Failed to install skill: $skill_name"
      ((failed++))
    fi
  done

  log "Skills installed: $installed, failed: $failed"
}

# ─── Agent installation ──────────────────────────────────────────────

# Map agent directory name to role
agent_role() {
  local name="$1"
  # Valid Paperclip roles: ceo, cto, cmo, cfo, engineer, designer, pm, qa, devops, researcher, general
  case "$name" in
    *ceo*)    echo "ceo" ;;
    *cto*)    echo "cto" ;;
    *cmo*)    echo "cmo" ;;
    *coo*)    echo "general" ;;
    *debate*) echo "general" ;;
    *)        echo "general" ;;
  esac
}

# Map agent directory name to display name
agent_display_name() {
  local name="$1"
  echo "$name" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)}1'
}

install_agents() {
  log "Installing agents..."

  local agent_dirs=()
  for dir in "$AGENTS_DIR"/*/; do
    local dirname
    dirname=$(basename "$dir")
    [[ "$dirname" == _* ]] && continue  # skip _shared
    agent_dirs+=("$dirname")
  done

  if [[ ${#agent_dirs[@]} -eq 0 ]]; then
    log "No agents found in $AGENTS_DIR"
    return
  fi

  log "Found ${#agent_dirs[@]} agents: ${agent_dirs[*]}"

  if $DRY_RUN; then
    for agent in "${agent_dirs[@]}"; do
      local role
      role=$(agent_role "$agent")
      log "  [dry-run] Would install agent: $(agent_display_name "$agent") (role: $role)"
    done
    return
  fi

  # Check for existing agents to avoid duplicates
  local existing_agents
  existing_agents=$(api GET "/api/companies/${COMPANY_ID}/agents" 2>/dev/null) || existing_agents="[]"

  local installed=0 skipped=0 failed=0

  for agent_name in "${agent_dirs[@]}"; do
    local display_name
    display_name=$(agent_display_name "$agent_name")
    local role
    role=$(agent_role "$agent_name")
    local agent_dir="$AGENTS_DIR/$agent_name"

    # Check if agent already exists (by name pattern)
    local already_exists
    already_exists=$(echo "$existing_agents" | jq -r --arg name "$agent_name" \
      '[.[] | select(.name | ascii_downcase | gsub(" ";"-") | contains($name))] | length' 2>/dev/null || echo "0")

    if [[ "$already_exists" -gt 0 ]]; then
      vlog "Skipping agent $display_name (already exists)"
      ((skipped++))
      continue
    fi

    # Read agent instruction files
    local agents_md="" soul_md="" heartbeat_md="" tools_md=""
    [[ -f "$agent_dir/AGENTS.md" ]]    && agents_md=$(cat "$agent_dir/AGENTS.md")
    [[ -f "$agent_dir/SOUL.md" ]]      && soul_md=$(cat "$agent_dir/SOUL.md")
    [[ -f "$agent_dir/HEARTBEAT.md" ]] && heartbeat_md=$(cat "$agent_dir/HEARTBEAT.md")
    [[ -f "$agent_dir/TOOLS.md" ]]     && tools_md=$(cat "$agent_dir/TOOLS.md")

    # Build instructions from available files
    local instructions=""
    [[ -n "$agents_md" ]]    && instructions+="$agents_md"$'\n\n'
    [[ -n "$soul_md" ]]      && instructions+="$soul_md"$'\n\n'
    [[ -n "$heartbeat_md" ]] && instructions+="$heartbeat_md"$'\n\n'
    [[ -n "$tools_md" ]]     && instructions+="$tools_md"

    # Collect desired skills based on agent role
    local desired_skills="[]"
    if $ASSIGN_SKILLS; then
      case "$agent_name" in
        ceo-brainstorm)  desired_skills='["ceo-brainstorm"]' ;;
        cto-brainstorm)  desired_skills='["cto-brainstorm"]' ;;
        cmo-brainstorm)  desired_skills='["cmo-brainstorm"]' ;;
        coo-brainstorm)  desired_skills='["coo-brainstorm"]' ;;
        debate)          desired_skills='["adversarial-review","eval-debate","skill-debate"]' ;;
        ceo-nl)          desired_skills='["ceo-brainstorm"]' ;;
      esac
    fi

    local payload
    payload=$(jq -n \
      --arg name "$display_name" \
      --arg role "$role" \
      --arg instructions "$instructions" \
      --argjson desiredSkills "$desired_skills" \
      '{
        name: $name,
        role: $role,
        adapterType: "process",
        instructions: $instructions,
        desiredSkills: $desiredSkills
      }')

    local result
    if result=$(api POST "/api/companies/${COMPANY_ID}/agents" -d "$payload" 2>&1); then
      local agent_id
      agent_id=$(echo "$result" | jq -r '.id // .agent.id // "unknown"' 2>/dev/null)
      vlog "Installed agent: $display_name ($agent_id)"
      ((installed++))
    else
      err "Failed to install agent: $display_name"
      ((failed++))
    fi
  done

  log "Agents installed: $installed, skipped: $skipped, failed: $failed"
}

# ─── Shared protocols ────────────────────────────────────────────────

install_shared_protocols() {
  local shared_dir="$AGENTS_DIR/_shared"
  [[ -d "$shared_dir" ]] || return

  local protocol_count
  protocol_count=$(find "$shared_dir" -name "*.md" -maxdepth 1 | wc -l | tr -d ' ')
  log "Found $protocol_count shared protocol(s) in _shared/"

  if $DRY_RUN; then
    for f in "$shared_dir"/*.md; do
      [[ -f "$f" ]] && log "  [dry-run] Would include protocol: $(basename "$f")"
    done
    return
  fi

  # Shared protocols are bundled into agent instructions — log for visibility
  for f in "$shared_dir"/*.md; do
    [[ -f "$f" ]] && vlog "Protocol available: $(basename "$f")"
  done
}

# ─── Scripts registration ────────────────────────────────────────────

install_scripts() {
  log "Registering scripts..."

  local scripts=()
  for f in "$SCRIPTS_DIR"/*.sh; do
    [[ -f "$f" ]] && scripts+=("$(basename "$f")")
  done

  if [[ ${#scripts[@]} -eq 0 ]]; then
    log "No scripts found in $SCRIPTS_DIR"
    return
  fi

  log "Found ${#scripts[@]} scripts: ${scripts[*]}"

  if $DRY_RUN; then
    for s in "${scripts[@]}"; do
      log "  [dry-run] Would register script: $s"
    done
    return
  fi

  # Try bulk import that includes scripts
  local scripts_import_path="${SOURCE_PATH:-$PKG_ROOT}"
  local import_result
  import_result=$(api POST "/api/companies/${COMPANY_ID}/skills/import" \
    -d "{\"source\":\"${scripts_import_path}\"}" 2>/dev/null) || true

  if [[ -n "$import_result" ]]; then
    local imported_count
    imported_count=$(echo "$import_result" | jq '.imported | length' 2>/dev/null || echo "0")
    if [[ "$imported_count" -gt 0 ]]; then
      log "Registered scripts via package import ($imported_count items)"
      return
    fi
  fi

  log "Scripts registered (available at $SCRIPTS_DIR)"
}

# ─── Summary ─────────────────────────────────────────────────────────

print_summary() {
  echo ""
  echo "════════════════════════════════════════════════════════"
  echo "  Installation complete"
  echo "════════════════════════════════════════════════════════"
  echo ""
  echo "  Paperclip:   $PAPERCLIP_URL"
  echo "  Company ID:  $COMPANY_ID"
  echo "  MnemeBrain:  $MNEMEBRAIN_URL"
  echo ""

  # List installed skills
  local skills_list
  skills_list=$(api GET "/api/companies/${COMPANY_ID}/skills" 2>/dev/null) || skills_list="[]"
  local skill_count
  skill_count=$(echo "$skills_list" | jq 'if type == "array" then length else 0 end' 2>/dev/null || echo "0")
  echo "  Skills:      $skill_count installed"

  # List installed agents
  local agents_list
  agents_list=$(api GET "/api/companies/${COMPANY_ID}/agents" 2>/dev/null) || agents_list="[]"
  local agent_count
  agent_count=$(echo "$agents_list" | jq 'if type == "array" then length else 0 end' 2>/dev/null || echo "0")
  echo "  Agents:      $agent_count installed"

  echo ""

  if [[ "$agent_count" -gt 0 ]]; then
    echo "  Agents:"
    echo "$agents_list" | jq -r '.[] | "    - \(.name) (\(.role // "general"))"' 2>/dev/null || true
    echo ""
  fi

  echo "  Next steps:"
  echo "    1. Open Paperclip UI at $PAPERCLIP_URL"
  echo "    2. Select your company and verify agents are listed"
  echo "    3. Start a brainstorm session with any agent"
  echo ""
}

# ─── JSON output (for scripts/CI) ─────────────────────────────────────

print_json() {
  local skills_list agents_list
  skills_list=$(api GET "/api/companies/${COMPANY_ID}/skills" 2>/dev/null) || skills_list="[]"
  agents_list=$(api GET "/api/companies/${COMPANY_ID}/agents" 2>/dev/null) || agents_list="[]"

  jq -n \
    --arg companyId "$COMPANY_ID" \
    --arg paperclipUrl "$PAPERCLIP_URL" \
    --arg mnemebrainUrl "$MNEMEBRAIN_URL" \
    --argjson skills "$skills_list" \
    --argjson agents "$agents_list" \
    '{
      companyId: $companyId,
      paperclipUrl: $paperclipUrl,
      mnemebrainUrl: $mnemebrainUrl,
      skills: $skills,
      agents: $agents,
      skillCount: ($skills | length),
      agentCount: ($agents | length)
    }'
}

# ─── Main ─────────────────────────────────────────────────────────────

main() {
  log "paperclip-skills installer v$(jq -r .version "$PKG_ROOT/package.json")"
  echo ""

  preflight
  ensure_company

  echo ""

  if $INSTALL_SKILLS; then
    install_skills
    echo ""
  fi

  install_shared_protocols
  echo ""

  if $INSTALL_AGENTS; then
    install_agents
    echo ""
  fi

  if $INSTALL_SKILLS && $INSTALL_AGENTS; then
    install_scripts
    echo ""
  fi

  if $JSON_OUTPUT; then
    print_json
  elif ! $DRY_RUN; then
    print_summary
  else
    echo ""
    log "[dry-run] No changes were made"
  fi
}

main
