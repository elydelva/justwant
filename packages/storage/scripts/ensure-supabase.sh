#!/usr/bin/env bash
# Ensure Supabase is running and output env vars for E2E tests.
# Run from packages/storage. Uses npx supabase.

set -e
cd "$(dirname "$0")/.."

SUPABASE_READY_URL="${SUPABASE_READY_URL:-http://127.0.0.1:54321/rest/v1/}"
MAX_WAIT="${SUPABASE_START_TIMEOUT:-180}"

is_supabase_ready() {
  curl -sSf -o /dev/null -w "%{http_code}" "$SUPABASE_READY_URL" 2>/dev/null | grep -qE '^(200|401|404)$'
}

ensure_supabase_running() {
  if is_supabase_ready; then
    return 0
  fi
  echo "Starting Supabase (may take 1-2 min on first run)..."
  npx supabase start --workdir . 2>&1 || true
  local waited=0
  while [[ "$waited" -lt "$MAX_WAIT" ]]; do
    if is_supabase_ready; then
      return 0
    fi
    sleep 5
    waited=$((waited + 5))
  done
  echo "Supabase failed to become ready within ${MAX_WAIT}s" >&2
  return 1
}

get_supabase_env() {
  npx supabase status -o env --workdir . 2>/dev/null | grep -E '^(API_URL|SERVICE_ROLE_KEY)=' || true
}

main() {
  if [[ -n "$SUPABASE_SERVICE_KEY" ]] && [[ -n "$SUPABASE_URL" ]]; then
    echo "export SUPABASE_URL=\"$SUPABASE_URL\""
    echo "export SUPABASE_SERVICE_KEY=\"$SUPABASE_SERVICE_KEY\""
    return 0
  fi
  if ! ensure_supabase_running; then
    return 1
  fi
  local env_output
  env_output=$(get_supabase_env)
  if [[ -z "$env_output" ]]; then
    echo "Could not get Supabase credentials" >&2
    return 1
  fi
  echo "$env_output" | sed -n 's/^API_URL="\(.*\)"$/export SUPABASE_URL="\1"/p; s/^SERVICE_ROLE_KEY="\(.*\)"$/export SUPABASE_SERVICE_KEY="\1"/p'
}

main
