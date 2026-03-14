#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────
# webmcp-anything release script
#
# Usage:
#   pnpm release              # Release current version
#   pnpm release patch        # Bump patch, build, publish
#   pnpm release minor        # Bump minor, build, publish
#   pnpm release major        # Bump major, build, publish
# ──────────────────────────────────────────────────────────

BUMP="${1:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[release]${NC} $1"; }
warn() { echo -e "${YELLOW}[release]${NC} $1"; }
fail() { echo -e "${RED}[release]${NC} $1"; exit 1; }

# ── Pre-flight checks ──
info "Running pre-flight checks..."

# Check npm login
npm whoami > /dev/null 2>&1 || fail "Not logged into npm. Run 'npm login' first."
info "npm user: $(npm whoami)"

# Check clean working tree
if [[ -n "$(git status --porcelain)" ]]; then
  warn "Working tree is not clean. Committing changes first is recommended."
  echo ""
  git status --short
  echo ""
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  [[ $REPLY =~ ^[Yy]$ ]] || exit 1
fi

# ── Version bump (optional) ──
if [[ -n "$BUMP" ]]; then
  info "Bumping version: $BUMP"
  case "$BUMP" in
    patch) pnpm version:patch ;;
    minor) pnpm version:minor ;;
    major) pnpm version:major ;;
    *) fail "Unknown bump type: $BUMP (use patch, minor, or major)" ;;
  esac

  VERSION=$(node -p "require('./package.json').version")
  info "New version: $VERSION"
else
  VERSION=$(node -p "require('./package.json').version")
  info "Publishing current version: $VERSION"
fi

# ── Clean & Build ──
info "Cleaning dist..."
pnpm clean

info "Building all packages..."
pnpm build

# ── Dry run ──
info "Dry run..."
pnpm publish:dry 2>&1 | head -30
echo ""
read -p "Publish v$VERSION to npm? (y/N) " -n 1 -r
echo
[[ $REPLY =~ ^[Yy]$ ]] || { warn "Aborted."; exit 0; }

# ── Publish ──
info "Publishing to npm..."
pnpm -r publish --no-git-checks

# ── Git tag ──
if [[ -n "$BUMP" ]]; then
  info "Committing version bump..."
  git add -A
  git commit -m "chore: release v$VERSION"
  git tag "v$VERSION"
  info "Tagged v$VERSION"

  read -p "Push to remote? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push && git push --tags
    info "Pushed to remote with tag v$VERSION"
  fi
fi

echo ""
info "Published successfully!"
info "  @webmcp-anything/sdk@$VERSION"
info "  @webmcp-anything/bridge@$VERSION"
info "  webmcp-anything@$VERSION"
echo ""
info "npm: https://www.npmjs.com/package/webmcp-anything"
