#!/bin/sh

echo "[MINIMAL] Starting minimal entrypoint..."
echo "[MINIMAL] User: $(whoami)"
echo "[MINIMAL] PWD: $(pwd)"

# Just try to start the server without migrations
echo "[MINIMAL] Starting Next.js directly..."
exec node apps/web/server.js