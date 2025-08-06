# GitHub Secrets Configuration

This document lists all the GitHub secrets that need to be configured for the CI/CD pipeline to work properly.

## Required Secrets

### 1. Container Registry
- **GITHUB_TOKEN**: Automatically provided by GitHub Actions (no configuration needed)

### 2. Tailscale VPN Access
- **TS_OAUTH_CLIENT_ID**: Tailscale OAuth client ID for GitHub Actions
- **TS_OAUTH_SECRET**: Tailscale OAuth secret for GitHub Actions
  
  To create these:
  1. Go to https://login.tailscale.com/admin/settings/oauth
  2. Create a new OAuth client
  3. Add tag:ci to the OAuth client
  4. Copy the client ID and secret

### 3. Portainer API Access
- **PORTAINER_API_KEY**: API key for Portainer deployments
- **PORTAINER_HOST**: Portainer host URL (e.g., `https://portainer.example.com`)

  To create the API key:
  1. Log into Portainer
  2. Go to User settings → Access tokens
  3. Create a new access token
  4. Copy the token value

### 4. Database Access
- **PREVIEW_DATABASE_URL**: PostgreSQL connection string for preview environment
  Format: `postgresql://username:password@host:port/database`
  Example: `postgresql://postgres:mypassword@172.20.0.22:5435/soccer`

- **PROD_DATABASE_URL**: PostgreSQL connection string for production environment
  Format: `postgresql://username:password@host:port/database`
  Example: `postgresql://postgres:mypassword@172.20.0.22:5434/soccer`

### 5. Application Secrets
- **NEXTAUTH_SECRET**: Secret key for NextAuth.js session encryption
  Generate with: `openssl rand -base64 32`

## Setting Secrets in GitHub

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with the name and value specified above

## Verifying Secrets

After setting up all secrets, you can verify they're working by:
1. Creating a test PR
2. Checking the Actions tab for successful workflow runs
3. Verifying the preview deployment and test results

## Security Notes

- Never commit secrets to the repository
- Rotate secrets regularly
- Use different secrets for preview and production environments
- Limit access to secrets using GitHub's environment protection rules