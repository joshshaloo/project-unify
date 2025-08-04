# GitHub Container Registry - Quick Setup Checklist

## 1. Repository Settings
- [ ] Go to: Settings → Actions → General
- [ ] Set Workflow permissions to "Read and write permissions"
- [ ] Save changes

## 2. Create Personal Access Token (for local testing)
- [ ] Profile → Settings → Developer settings → Personal access tokens
- [ ] Generate new token (classic)
- [ ] Name: `ghcr-docker-push`
- [ ] Scopes: `write:packages`, `read:packages`, `repo` (if private)
- [ ] Copy token immediately!

## 3. Test Locally
```bash
# Login
echo YOUR_TOKEN | docker login ghcr.io -u joshshaloo --password-stdin

# Build
make build

# Push
make push
```

## 4. Add GitHub Secrets
Go to: Settings → Secrets and variables → Actions

Required secrets (only these 3):
- [ ] `PORTAINER_API_KEY`
- [ ] `TS_OAUTH_CLIENT_ID`
- [ ] `TS_OAUTH_SECRET`

All other secrets (database, API keys, etc.) are managed in Portainer!

## 5. Test the Pipeline
```bash
# Push your branch
git push origin feature/TECH-003-cicd-pipeline

# Check Actions tab in GitHub
# Check Packages in right sidebar
```

## Image URLs
- Production: `ghcr.io/joshshaloo/soccer/project-unify:latest`
- Develop: `ghcr.io/joshshaloo/soccer/project-unify:develop`
- PR: `ghcr.io/joshshaloo/soccer/project-unify:pr-123`