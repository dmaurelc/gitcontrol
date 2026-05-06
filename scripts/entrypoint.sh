#!/bin/sh
set -e

echo "[entrypoint] running migrations..."
# Run migrate from /app/migrator so Node's ESM resolver finds drizzle-orm
# and pg in the sibling node_modules. Migrations themselves still live at
# /app/drizzle.
(cd /app/migrator && MIGRATIONS_FOLDER=/app/drizzle node migrate.mjs)

echo "[entrypoint] starting server..."
exec node server.js
