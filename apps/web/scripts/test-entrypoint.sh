#!/bin/sh

# Test with printf instead of echo
printf "[TEST] Script started\n"
printf "[TEST] User: %s\n" "$(whoami)"
printf "[TEST] Dir: %s\n" "$(pwd)"

# Test if we can read secrets
if [ -f /run/secrets/postgres_password ]; then
    printf "[TEST] Found postgres secret\n"
fi

# Try to start node directly
printf "[TEST] Starting node...\n"
node -e "console.log('[NODE] Hello from Node.js')"

printf "[TEST] Script completed\n"