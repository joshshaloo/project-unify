# Git Branch Strategy

## Branch Structure

### Protected Branches
- `main` - Production-ready code (protected)
- `develop` - Integration branch (optional, protected)

### Feature Branches
- `feature/*` - New features
- `fix/*` - Bug fixes
- `chore/*` - Maintenance tasks
- `docs/*` - Documentation updates

## Workflow

### 1. Start New Work
```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### 2. Make Changes
```bash
# Make your changes
git add .
git commit -m "feat: add new feature"
```

### 3. Push and Create PR
```bash
git push origin feature/your-feature-name
# Create PR via GitHub UI
```

### 4. PR Process
1. CI checks run automatically
2. Vercel creates preview deployment
3. Request review (if team project)
4. Address feedback
5. Merge when approved

### 5. Clean Up
```bash
git checkout main
git pull origin main
git branch -d feature/your-feature-name
```

## Commit Message Convention

Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code restructuring
- `test:` - Tests
- `chore:` - Maintenance

## Emergency Hotfix Process

For critical production fixes:
```bash
git checkout main
git checkout -b hotfix/critical-fix
# Make minimal fix
git push origin hotfix/critical-fix
# Create PR with "HOTFIX" label
# Get expedited review
```