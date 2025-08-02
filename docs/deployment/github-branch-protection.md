# GitHub Branch Protection Setup

## Navigate to Branch Protection Settings

1. Go to your repository: https://github.com/joshshaloo/project-unify
2. Click **Settings** tab
3. In the left sidebar, click **Branches**
4. Click **Add rule** button

## Configure Protection Rules for `main` Branch

### Branch name pattern
- Enter: `main`

### Protection Settings

#### ✅ Require pull request reviews before merging
- [x] Required approving reviews: **1**
- [x] Dismiss stale pull request approvals when new commits are pushed
- [ ] Require review from CODEOWNERS (skip for now)
- [x] Restrict who can dismiss pull request reviews (optional)

#### ✅ Require status checks to pass before merging
- [x] Require branches to be up to date before merging
- Search and select these status checks:
  - `Validate` (from our GitHub Actions workflow)
  - Any Vercel checks that appear

#### ✅ Require conversation resolution before merging
- [x] All conversations must be resolved

#### ✅ Additional Settings
- [x] Include administrators (recommended for team projects)
- [x] Restrict who can push to matching branches
  - Add yourself and any team members
- [ ] Allow force pushes (keep unchecked)
- [ ] Allow deletions (keep unchecked)

### Click "Create" to save

## Set Up Additional Branch Protection (Optional)

### For `develop` branch (if using git-flow):
1. Click **Add rule**
2. Branch name pattern: `develop`
3. Use similar settings but maybe less restrictive:
   - No required reviews (or just 1)
   - Required status checks
   - No admin restrictions

## Best Practices

### Protected Branch Workflow
1. Never commit directly to `main`
2. Create feature branches: `feature/your-feature-name`
3. Open PR when ready
4. Wait for CI checks to pass
5. Get review (if working with team)
6. Merge via GitHub UI

### Emergency Procedures
If you need to bypass (not recommended):
1. Go to Settings → Branches
2. Edit the rule
3. Temporarily uncheck "Include administrators"
4. Make your change
5. Re-enable protection immediately

## Verify Protection is Working

### Test the Protection:
```bash
# Try to push directly to main (should fail)
git checkout main
echo "test" >> README.md
git add . && git commit -m "test"
git push origin main
# Should see: "error: failed to push some refs"
```

### Correct Workflow:
```bash
# Create feature branch
git checkout -b feature/test-protection
echo "test" >> README.md
git add . && git commit -m "test: verify branch protection"
git push origin feature/test-protection
# Then create PR via GitHub UI
```