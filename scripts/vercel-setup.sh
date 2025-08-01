#!/bin/bash

echo "🚀 Vercel Setup Helper Script"
echo "============================"
echo ""
echo "This script will help you set up Vercel for Project Unify"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm i -g vercel
else
    echo "✅ Vercel CLI is already installed"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Run 'vercel login' to authenticate"
echo "2. Run 'vercel' in the project root to start deployment"
echo "3. Follow the prompts:"
echo "   - Set up and deploy: Yes"
echo "   - Scope: Select your team/personal account"
echo "   - Link to existing project: No (first time)"
echo "   - Project name: project-unify"
echo "   - Directory: ./"
echo "   - Build Command: pnpm turbo run build --filter=@soccer/web"
echo "   - Output Directory: apps/web/.next"
echo "   - Development Command: pnpm dev"
echo ""
echo "4. After deployment, run 'vercel env pull' to sync environment variables"
echo ""
echo "📝 Don't forget to:"
echo "- Add environment variables in Vercel dashboard"
echo "- Set up GitHub integration for auto-deployments"
echo "- Configure custom domain when ready"