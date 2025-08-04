# GitHub Container Registry Setup Guide

## Prerequisites
- GitHub account with repository admin access
- Docker installed locally
- Personal Access Token (PAT) with appropriate scopes

## Step 1: Enable GitHub Packages

1. Go to your repository: https://github.com/joshshaloo/soccer/project-unify
2. Click on **Settings** (repository settings, not profile settings)
3. Scroll down to the **Danger Zone** section
4. Ensure **Packages** is visible in the features list (it should be enabled by default)

## Step 2: Configure Repository Permissions

1. In repository **Settings** → **Actions** → **General**
2. Scroll to **Workflow permissions**
3. Select **"Read and write permissions"**
4. Check **"Allow GitHub Actions to create and approve pull requests"**
5. Click **Save**

![Workflow Permissions](workflow-permissions.png)

## Step 3: Create a Personal Access Token (for local testing)

1. Go to your GitHub profile → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a descriptive name: `ghcr-docker-push`
4. Set expiration (recommend 90 days for security)
5. Select these scopes:
   - `write:packages` - Upload packages to GitHub Package Registry
   - `read:packages` - Download packages from GitHub Package Registry
   - `delete:packages` - Delete packages from GitHub Package Registry (optional)
   - `repo` - Full control of private repositories (if your repo is private)
6. Click **"Generate token"**
7. **COPY THE TOKEN NOW** - you won't see it again!

## Step 4: Test Docker Login Locally

```bash
# Using the Makefile command (interactive)
make docker-login

# OR manually with your token
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

Expected output:
```
Login Succeeded
```

## Step 5: Test Build and Push

```bash
# Build the image
make build

# Push to registry
make push
```

## Step 6: Verify Package Visibility

1. Go to your repository main page
2. Look for **"Packages"** in the right sidebar
3. You should see your Docker image listed
4. Click on it to see all tags

## Step 7: Configure Package Settings

1. Click on your package in the sidebar
2. Click **"Package settings"** (gear icon)
3. In **"Manage Actions access"**:
   - Ensure your repository is listed
   - This allows GitHub Actions to push to this package
4. In **"Danger Zone"**:
   - Change visibility if needed (public/private)
   - Link to repository if not already linked

## Step 8: Configure Repository Secrets

Go to repository **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

### GitHub Actions Secrets (Minimal)

Only these secrets are needed in GitHub:

1. **PORTAINER_API_KEY**
   - Get from Portainer: User menu → My account → Access tokens
   - Create new token with no expiration

2. **TS_OAUTH_CLIENT_ID** and **TS_OAUTH_SECRET**
   - Get from Tailscale Admin Console
   - Settings → OAuth clients → Create new client
   - Scopes needed: `devices:write`

### Portainer Environment Variables

All application secrets should be configured in Portainer stack environment variables:

1. In Portainer, go to your stack (e.g., `soccer-preview`)
2. Click **"Edit stack"**
3. Add these environment variables:

```yaml
# Database
POSTGRES_USER: postgres
POSTGRES_PASSWORD: your-secure-password
POSTGRES_DB: soccer

# Application
NEXTAUTH_SECRET: generate-random-secret
OPENAI_API_KEY: sk-your-openai-key
N8N_USER: admin
N8N_PASSWORD: secure-n8n-password
N8N_DB_NAME: n8n

# GitHub info (for image pulling)
GITHUB_REPOSITORY: joshshaloo/soccer/project-unify
GITHUB_SHA: develop  # or specific commit
```

This approach:
- Keeps secrets out of CI/CD pipeline
- Allows easy rotation without code changes
- Follows security best practices
- Centralizes secret management in Portainer

## Troubleshooting

### "Permission denied" when pushing
- Ensure your PAT has `write:packages` scope
- Check that GitHub Actions has write permissions
- Verify package is linked to your repository

### "Package already exists"
- You might be trying to push to a package owned by another repo
- Check package settings and ensure it's linked to your repo

### GitHub Actions can't push
- Check workflow permissions are set to read/write
- Ensure `GITHUB_TOKEN` is being used (automatic in workflows)
- Verify the package exists and is linked to the repo

### Rate limiting
- GitHub has rate limits for package uploads
- If hit, wait a few minutes and retry
- Consider using `cache-from` and `cache-to` in builds

## Package URL Format

Your images will be available at:
```
ghcr.io/joshshaloo/soccer/project-unify:TAG
```

Tags created:
- `latest` - from main branch
- `develop` - from develop branch  
- `pr-123` - from pull requests
- `feature-name-sha` - from feature branches
- `sha` - commit SHA (always created)

## Cleanup Policy

To set up automatic cleanup of old images:

1. Go to your package settings
2. Under **"Manage versions"**
3. You can:
   - Delete specific versions
   - Set up retention policies (Enterprise feature)

For manual cleanup:
```bash
# List all tags
docker images ghcr.io/joshshaloo/soccer/project-unify

# Remove local images
docker rmi ghcr.io/joshshaloo/soccer/project-unify:TAG
```

## Security Best Practices

1. **Rotate PATs regularly** - Set expiration dates
2. **Use least privilege** - Only grant necessary scopes
3. **Use GITHUB_TOKEN in workflows** - It's automatic and secure
4. **Never commit tokens** - Use secrets for sensitive data
5. **Enable 2FA** - On your GitHub account
6. **Audit package access** - Regularly review who can access

## Next Steps

After setup:
1. Push your branch to test the workflow
2. Create a PR to test PR preview deployments
3. Monitor the Actions tab for any issues
4. Check Packages sidebar for published images