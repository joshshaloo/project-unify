#!/bin/bash
# Bootstrap script for initial deployment setup

set -e

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${BOLD}${CYAN}⚽ Soccer Project Unify - Bootstrap${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check for required environment variables
if [ -z "$PORTAINER_API_KEY" ] || [ -z "$PORTAINER_HOST" ]; then
    echo -e "${RED}❌ Missing required environment variables!${NC}"
    echo ""
    echo "Please set the following in your .env file:"
    echo "  PORTAINER_API_KEY=\"your-api-key\""
    echo "  PORTAINER_HOST=\"https://your-portainer-url:9443\""
    echo ""
    echo "Then run:"
    echo "  source .env"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Environment variables configured${NC}"
echo ""

# Menu
echo "What would you like to bootstrap?"
echo ""
echo "1) Preview environment (recommended first)"
echo "2) Production environment"
echo "3) Both environments"
echo "4) Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo -e "${CYAN}🚀 Bootstrapping preview environment...${NC}"
        make bootstrap-preview
        ;;
    2)
        echo -e "${YELLOW}⚠️  WARNING: This will create the production stack!${NC}"
        read -p "Are you sure? Type 'yes' to continue: " confirm
        if [ "$confirm" = "yes" ]; then
            make bootstrap-prod
        else
            echo -e "${RED}Cancelled${NC}"
        fi
        ;;
    3)
        echo -e "${CYAN}🚀 Bootstrapping both environments...${NC}"
        make bootstrap-preview
        echo ""
        echo -e "${YELLOW}⚠️  WARNING: About to create production stack!${NC}"
        read -p "Continue with production? Type 'yes': " confirm
        if [ "$confirm" = "yes" ]; then
            make bootstrap-prod
        else
            echo -e "${YELLOW}Skipped production bootstrap${NC}"
        fi
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}${BOLD}✅ Bootstrap complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Log into Portainer at $PORTAINER_HOST"
echo "2. Navigate to the stack(s) you created"
echo "3. Update all environment variables with real values"
echo "4. Remove any CHANGE-ME placeholders"
echo ""
echo "After configuring secrets, you can deploy with:"
echo "  make deploy-preview TAG=develop-abc123"
echo "  make deploy-prod TAG=v1.0.0"