#!/usr/bin/env bash
# Build vercel-blob-server Docker image for local E2E tests.
# See https://github.com/634750802/vercel-blob-server

set -e
REPO="https://github.com/634750802/vercel-blob-server.git"
BUILD_DIR="${1:-$(mktemp -d)}"

echo "Cloning vercel-blob-server to $BUILD_DIR"
git clone --depth 1 "$REPO" "$BUILD_DIR"
cd "$BUILD_DIR"

echo "Installing and building..."
bun install
bun run build

echo "Building Docker image..."
docker build . --tag vercel-blob-server

echo "Done. Run: docker compose up -d"
if [[ "$BUILD_DIR" == /tmp/* ]]; then
  rm -rf "$BUILD_DIR"
fi
