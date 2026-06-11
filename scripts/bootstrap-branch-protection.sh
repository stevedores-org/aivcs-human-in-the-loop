#!/usr/bin/env bash
# bootstrap-branch-protection.sh
# Bootstraps branch protection for main and develop branches using gh CLI.

set -euo pipefail

if ! command -v gh &> /dev/null; then
  echo "Error: gh CLI is not installed."
  exit 1
fi

# Get current repo
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
if [ -z "$REPO" ]; then
  echo "Error: Not inside a git repository or not a GitHub repository."
  exit 1
fi

echo "Bootstrapping branch protection for $REPO..."

PROTECTION_PAYLOAD='{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "PR Title Check",
      "Local CI Runner"
    ]
  },
  "enforce_admins": null,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}'

for branch in main develop; do
  echo "Applying branch protection to '$branch'..."
  if ! gh api -X PUT "/repos/$REPO/branches/$branch/protection" \
    --input - <<< "$PROTECTION_PAYLOAD" &>/dev/null; then
    echo "Warning: Could not set branch protection for '$branch'. (You may lack admin rights or the branch does not exist yet on origin)."
  else
    echo "Successfully set branch protection for '$branch'."
  fi
done
