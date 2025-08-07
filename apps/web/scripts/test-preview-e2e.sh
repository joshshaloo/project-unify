#!/bin/bash
set -e

echo "Running E2E tests against preview environment..."
echo "Target: https://preview.clubomatic.ai"
echo "MailHog: https://soccer-preview-ts.rockhopper-crested.ts.net/mailhog/"

# Set environment variables for preview testing
export TEST_ENV=preview
export MAILHOG_URL=https://soccer-preview-ts.rockhopper-crested.ts.net/mailhog
export NODE_TLS_REJECT_UNAUTHORIZED=0  # Allow self-signed certificates

# Run tests with preview config
pnpm playwright test --config=playwright.config.preview.ts "$@"