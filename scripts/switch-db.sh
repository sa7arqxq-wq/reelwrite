#!/usr/bin/env bash
# ReelWrite — Database migration helper
# Switches Prisma between SQLite (dev) and PostgreSQL (production)
#
# Usage:
#   ./scripts/switch-db.sh sqlite      # Switch to SQLite (local dev)
#   ./scripts/switch-db.sh postgres    # Switch to PostgreSQL (production)
#   ./scripts/switch-db.sh status      # Check current provider

set -euo pipefail

SCHEMA_FILE="prisma/schema.prisma"

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "Error: $SCHEMA_FILE not found. Run this from the project root."
  exit 1
fi

CURRENT=$(grep -A2 'datasource db' "$SCHEMA_FILE" | grep 'provider' | sed 's/.*provider = "\(.*\)".*/\1/')

case "${1:-status}" in
  status)
    echo "Current database provider: $CURRENT"
    if [ "$CURRENT" = "sqlite" ]; then
      echo "  → Local dev mode (SQLite)"
      echo "  → To deploy: ./scripts/switch-db.sh postgres"
    else
      echo "  → Production mode (PostgreSQL)"
      echo "  → For local dev: ./scripts/switch-db.sh sqlite"
    fi
    ;;
  sqlite)
    sed -i.bak 's/provider = "postgresql"/provider = "sqlite"/' "$SCHEMA_FILE"
    rm -f "$SCHEMA_FILE.bak"
    echo "✅ Switched to SQLite (local dev mode)"
    echo "   Run: bun run db:push"
    ;;
  postgres|postgresqL|prod)
    sed -i.bak 's/provider = "sqlite"/provider = "postgresql"/' "$SCHEMA_FILE"
    rm -f "$SCHEMA_FILE.bak"
    echo "✅ Switched to PostgreSQL (production mode)"
    echo ""
    echo "Next steps:"
    echo "  1. Set DATABASE_URL in .env to your Postgres connection string"
    echo "     (e.g. postgresql://user:pass@host/db?sslmode=require)"
    echo "  2. Run: bun run db:push"
    echo "  3. Run: bun run scripts/seed.ts"
    ;;
  *)
    echo "Usage: ./scripts/switch-db.sh [sqlite|postgres|status]"
    exit 1
    ;;
esac
