#!/usr/bin/env bash
#
# worktree-new.sh — create a sibling git worktree for parallel development.
#
# Usage:
#   ./scripts/worktree-new.sh <branch-name> [base-branch]
#
# Creates a worktree as a sibling of the main repo (e.g.
# ../runebot-inc-<slug>), installs npm dependencies, and prints a summary
# with a suggested `npm run dev` port.
#
# See the "Git Worktrees" section in CLAUDE.md for the full workflow.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <branch-name> [base-branch]" >&2
  exit 1
fi

BRANCH="$1"
BASE="${2:-main}"

# Slugify: lowercase, replace anything non-alphanumeric with '-', collapse, trim.
SLUG=$(echo "$BRANCH" \
  | tr '[:upper:]' '[:lower:]' \
  | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')

if [[ -z "$SLUG" ]]; then
  echo "Error: branch name '$BRANCH' produced an empty slug." >&2
  exit 1
fi

REPO_ROOT=$(git rev-parse --show-toplevel)
PARENT_DIR=$(dirname "$REPO_ROOT")
WORKTREE_PATH="$PARENT_DIR/runebot-inc-$SLUG"

if [[ -e "$WORKTREE_PATH" ]]; then
  echo "Error: $WORKTREE_PATH already exists." >&2
  exit 1
fi

# If the branch already exists (locally or on origin), check it out.
# Otherwise create it from BASE.
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "Branch '$BRANCH' exists locally — adding worktree at $WORKTREE_PATH"
  git worktree add "$WORKTREE_PATH" "$BRANCH"
elif git show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
  echo "Branch '$BRANCH' exists on origin — adding worktree at $WORKTREE_PATH"
  git worktree add -b "$BRANCH" "$WORKTREE_PATH" "origin/$BRANCH"
else
  echo "Creating new branch '$BRANCH' from '$BASE' at $WORKTREE_PATH"
  git worktree add -b "$BRANCH" "$WORKTREE_PATH" "$BASE"
fi

# Figure out a suggested Vite port: main uses 5173, so start at 5174 and
# increment for each additional worktree.
EXISTING_WORKTREES=$(git worktree list --porcelain | grep -c '^worktree ' || true)
# EXISTING_WORKTREES includes the new one + main. Port = 5172 + count.
SUGGESTED_PORT=$((5172 + EXISTING_WORKTREES))

echo ""
echo "Installing npm dependencies in the new worktree..."
(cd "$WORKTREE_PATH" && npm install)

cat <<EOF

✓ Worktree ready.

  path:   $WORKTREE_PATH
  branch: $BRANCH

  cd "$WORKTREE_PATH"
  npm run dev -- --port $SUGGESTED_PORT

To remove later:
  git worktree remove "$WORKTREE_PATH"
EOF
