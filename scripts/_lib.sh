#!/usr/bin/env bash
# Shared library for Paperclip scripts
# Source this file: source "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

# Resolve PAPERCLIP_HOME state directory
resolve_state_home() {
  if [[ -n "${PAPERCLIP_HOME:-}" ]]; then
    echo "$PAPERCLIP_HOME"
    return
  fi
  local git_root
  git_root=$(git rev-parse --show-toplevel 2>/dev/null)
  if [[ -n "$git_root" ]]; then
    echo "$git_root/.paperclip"
  else
    echo "$(pwd)/.paperclip"
  fi
}

# Require jq or exit with message
require_jq() {
  if ! command -v jq &>/dev/null; then
    echo "Error: jq is required but not installed. Install with: brew install jq (macOS) or sudo apt install jq (Linux)" >&2
    exit 1
  fi
}

# Detect package manager from lockfile/config
detect_package_manager() {
  local project_root="${1:-.}"
  if [[ -f "$project_root/bun.lockb" ]] || [[ -f "$project_root/bun.lock" ]]; then
    echo "bun"
  elif [[ -f "$project_root/pnpm-lock.yaml" ]]; then
    echo "pnpm"
  elif [[ -f "$project_root/yarn.lock" ]]; then
    echo "yarn"
  elif [[ -f "$project_root/package-lock.json" ]]; then
    echo "npm"
  else
    echo "npm"  # default fallback
  fi
}

# Detect primary project stack/language from project files
# Returns: nodejs, python, java-maven, java-gradle, rust, go, dotnet, elixir, ruby, unknown
detect_stack() {
  local project_root="${1:-.}"

  # Check for language-specific markers (order: most specific first)
  if [[ -f "$project_root/Cargo.toml" ]]; then
    echo "rust"
  elif [[ -f "$project_root/go.mod" ]]; then
    echo "go"
  elif [[ -f "$project_root/pom.xml" ]]; then
    echo "java-maven"
  elif [[ -f "$project_root/build.gradle" ]] || [[ -f "$project_root/build.gradle.kts" ]]; then
    echo "java-gradle"
  elif [[ -f "$project_root/mix.exs" ]]; then
    echo "elixir"
  elif [[ -f "$project_root/Gemfile" ]]; then
    echo "ruby"
  elif [[ -f "$project_root/pyproject.toml" ]] || [[ -f "$project_root/setup.py" ]] || [[ -f "$project_root/requirements.txt" ]]; then
    echo "python"
  elif find "$project_root" -maxdepth 1 \( -name "*.csproj" -o -name "*.sln" \) -print -quit 2>/dev/null | grep -q .; then
    echo "dotnet"
  elif [[ -f "$project_root/package.json" ]]; then
    echo "nodejs"
  else
    echo "unknown"
  fi
}

# Resolve abstract commands for the detected stack
# Returns JSON object with command mappings
# Usage: resolve_commands [project_root]
resolve_commands() {
  local project_root="${1:-.}"
  local stack
  stack=$(detect_stack "$project_root")
  local pm
  pm=$(detect_package_manager "$project_root")

  case "$stack" in
    nodejs)
      cat <<EOF
{"stack":"nodejs","pm":"$pm","typecheck":"$pm run typecheck","lint":"$pm run lint","lint_fix":"$pm run lint -- --fix","format":"$pm exec prettier --write .","test":"$pm test","test_changed":"$pm exec vitest --changed","test_related":"$pm exec vitest --related","build":"$pm run build","coverage":"$pm run test:coverage"}
EOF
      ;;
    python)
      local test_cmd="pytest"
      local lint_cmd="ruff check ."
      local lint_fix="ruff check --fix ."
      local format_cmd="ruff format ."
      local typecheck="mypy ."
      # Check for specific tools
      if [[ -f "$project_root/pyproject.toml" ]]; then
        grep -q "flake8" "$project_root/pyproject.toml" 2>/dev/null && lint_cmd="flake8 ." && lint_fix="autopep8 --in-place -r ."
        grep -q "black" "$project_root/pyproject.toml" 2>/dev/null && format_cmd="black ."
        grep -q "pyright" "$project_root/pyproject.toml" 2>/dev/null && typecheck="pyright"
      fi
      if [[ -f "$project_root/.flake8" ]]; then
        lint_cmd="flake8 ." && lint_fix="autopep8 --in-place -r ."
      fi
      cat <<EOF
{"stack":"python","pm":"pip","typecheck":"$typecheck","lint":"$lint_cmd","lint_fix":"$lint_fix","format":"$format_cmd","test":"$test_cmd","test_changed":"$test_cmd --lf","test_related":"$test_cmd --lf","build":"python -m build","coverage":"$test_cmd --cov"}
EOF
      ;;
    java-maven)
      cat <<EOF
{"stack":"java-maven","pm":"mvn","typecheck":"mvn compile -q","lint":"mvn checkstyle:check -q","lint_fix":"mvn spotless:apply","format":"mvn spotless:apply","test":"mvn test -q","test_changed":"mvn test -q","test_related":"mvn test -q","build":"mvn package -q -DskipTests","coverage":"mvn verify -q jacoco:report"}
EOF
      ;;
    java-gradle)
      cat <<EOF
{"stack":"java-gradle","pm":"gradle","typecheck":"./gradlew compileJava -q","lint":"./gradlew checkstyleMain -q","lint_fix":"./gradlew spotlessApply","format":"./gradlew spotlessApply","test":"./gradlew test -q","test_changed":"./gradlew test -q","test_related":"./gradlew test -q","build":"./gradlew build -x test -q","coverage":"./gradlew jacocoTestReport -q"}
EOF
      ;;
    rust)
      cat <<EOF
{"stack":"rust","pm":"cargo","typecheck":"cargo check","lint":"cargo clippy -- -D warnings","lint_fix":"cargo clippy --fix --allow-dirty","format":"cargo fmt","test":"cargo test","test_changed":"cargo test","test_related":"cargo test","build":"cargo build --release","coverage":"cargo tarpaulin"}
EOF
      ;;
    go)
      cat <<EOF
{"stack":"go","pm":"go","typecheck":"go vet ./...","lint":"golangci-lint run","lint_fix":"golangci-lint run --fix","format":"gofmt -w .","test":"go test ./...","test_changed":"go test ./...","test_related":"go test ./...","build":"go build ./...","coverage":"go test -cover ./..."}
EOF
      ;;
    dotnet)
      cat <<EOF
{"stack":"dotnet","pm":"dotnet","typecheck":"dotnet build --no-restore","lint":"dotnet format --verify-no-changes","lint_fix":"dotnet format","format":"dotnet format","test":"dotnet test --no-build","test_changed":"dotnet test --no-build","test_related":"dotnet test --no-build","build":"dotnet build","coverage":"dotnet test --collect:\"XPlat Code Coverage\""}
EOF
      ;;
    elixir)
      cat <<EOF
{"stack":"elixir","pm":"mix","typecheck":"mix dialyzer","lint":"mix credo","lint_fix":"mix credo","format":"mix format","test":"mix test","test_changed":"mix test --stale","test_related":"mix test --stale","build":"mix compile","coverage":"mix test --cover"}
EOF
      ;;
    ruby)
      cat <<EOF
{"stack":"ruby","pm":"bundle","typecheck":"bundle exec srb tc","lint":"bundle exec rubocop","lint_fix":"bundle exec rubocop -A","format":"bundle exec rubocop -A","test":"bundle exec rspec","test_changed":"bundle exec rspec --only-failures","test_related":"bundle exec rspec --only-failures","build":"bundle exec rake build","coverage":"bundle exec rspec"}
EOF
      ;;
    *)
      # Unknown stack — return placeholders that will fail clearly
      cat <<EOF
{"stack":"unknown","pm":"echo","typecheck":"echo 'No typecheck configured'","lint":"echo 'No lint configured'","lint_fix":"echo 'No lint-fix configured'","format":"echo 'No formatter configured'","test":"echo 'No test command configured'","test_changed":"echo 'No test command configured'","test_related":"echo 'No test command configured'","build":"echo 'No build command configured'","coverage":"echo 'No coverage configured'"}
EOF
      ;;
  esac
}

# Safe atomic write with advisory file lock (write to temp file, then atomic mv)
# Uses flock to prevent concurrent read-modify-write races when parallel agents update state.
# Usage: safe_write_json "$STATE_FILE" "$new_json_content"
safe_write_json() {
  local target="$1"
  local content="$2"
  local tmpfile="${target}.tmp.$$"
  local lockfile="${target}.lock"

  if command -v flock >/dev/null 2>&1; then
    (
      flock -w 5 200 || { echo "Warning: could not acquire lock on $target" >&2; }
      printf '%s\n' "$content" > "$tmpfile"
      mv "$tmpfile" "$target"
    ) 200>"$lockfile"
  else
    printf '%s\n' "$content" > "$tmpfile"
    mv "$tmpfile" "$target"
  fi
}
