#!/usr/bin/env bash
# Idempotent. Sets the canonical branch protection on develop + main.
# Re-running PUTs the same shape (overwriting any out-of-band drift).
#
# Operator tool only — NOT executed in CI. Run once per repo as someone
# with admin on stevedores-org/aivcs-human-in-the-loop:
#
#   ./scripts/bootstrap-branch-protection.sh
#
# Required checks pinned here are the job names that appear on a PR:
#   - local-ci (from .github/workflows/ci.yml job `local-ci`)
#   - pr-title (from .github/workflows/pr-title.yml job `pr-title`)
#
# Policy (per AGENTS.md):
# - develop: PR-only, 1 approval, dismiss stale reviews, conversation
#   resolution, linear history, no force-push, no deletion.
# - main:    same as develop + code-owner review required.
set -euo pipefail

REPO="${REPO:-stevedores-org/aivcs-human-in-the-loop}"

protect() {
  local branch="$1" body="$2"
  echo "applying protection: $branch"
  printf '%s' "$body" \
    | gh api -X PUT "repos/$REPO/branches/$branch/protection" \
        -H 'Accept: application/vnd.github+json' --input - >/dev/null
  echo "  done"
}

# Required check contexts — these are the job names from
# .github/workflows/{ci,pr-title}.yml. The labeler workflow is
# intentionally NOT required: it is informational. Dependabot PRs go
# through the same gate because both workflows trigger on pull_request /
# pull_request_target.
DEVELOP_BODY=$(cat <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "local-ci",
      "pr-title"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": true,
  "required_conversation_resolution": true
}
JSON
)

MAIN_BODY=$(cat <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "local-ci",
      "pr-title"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": true,
  "required_conversation_resolution": true
}
JSON
)

protect develop "$DEVELOP_BODY"
protect main    "$MAIN_BODY"

echo
echo "Branch protection bootstrapped for $REPO."
echo "Required checks: local-ci, pr-title."
