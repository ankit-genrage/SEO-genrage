#!/bin/bash

# GENRAGE Content Engine - Quick Deployment Script
# Use this to push to GitHub and deploy to Vercel

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  GENRAGE Content Engine - Production Deployment            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Check prerequisites
echo -e "\n${YELLOW}[1/4] Checking prerequisites...${NC}"

if ! command -v git &> /dev/null; then
    echo -e "${RED}✗ Git not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Git installed${NC}"

if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}✗ Not a git repository${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Git repository initialized${NC}"

# Step 2: GitHub info
echo -e "\n${YELLOW}[2/4] GitHub repository setup${NC}"

read -p "Enter GitHub username: " GITHUB_USER
read -p "Enter repository name (default: genrage-content-engine): " REPO_NAME
REPO_NAME=${REPO_NAME:-genrage-content-engine}

GITHUB_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

echo -e "${BLUE}Repository URL: ${GITHUB_URL}${NC}"

read -p "Verify this is correct? (y/n): " VERIFY
if [ "$VERIFY" != "y" ]; then
    echo "Cancelled."
    exit 1
fi

# Step 3: Push to GitHub
echo -e "\n${YELLOW}[3/4] Pushing code to GitHub...${NC}"

# Check if remote exists
if git remote get-url origin &> /dev/null; then
    echo -e "${BLUE}Updating remote origin...${NC}"
    git remote remove origin || true
fi

git remote add origin "$GITHUB_URL"
git branch -M main

echo -e "${BLUE}Pushing to GitHub...${NC}"
git push -u origin main

echo -e "${GREEN}✓ Code pushed to GitHub${NC}"

# Step 4: Instructions for Vercel deployment
echo -e "\n${YELLOW}[4/4] Next steps for Vercel deployment${NC}"

echo -e "${BLUE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PRODUCTION DEPLOYMENT READY!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"

echo -e "${GREEN}✓${NC} Code pushed to GitHub"
echo -e "${BLUE}→${NC} Follow these steps to deploy to Vercel:"
echo ""

echo "1. Go to: https://vercel.com/"
echo "2. Click 'Add New' → 'Project'"
echo "3. Select GitHub and find your repository: ${REPO_NAME}"
echo "4. Click 'Deploy'"
echo "5. Wait 2-5 minutes for deployment to complete"
echo ""

echo -e "${YELLOW}AFTER Vercel Deployment:${NC}"
echo ""

echo "6. Get your Vercel domain (something like: genrage-content-engine.vercel.app)"
echo "7. Add environment variables in Vercel Settings:"
echo ""

echo -e "${BLUE}Required Environment Variables (13 total):${NC}"
echo "   • DATABASE_URL (Neon connection string)"
echo "   • GSC_SERVICE_ACCOUNT_JSON (minified)"
echo "   • GSC_SITE_URL"
echo "   • GA4_PROPERTY_ID"
echo "   • GA4_SERVICE_ACCOUNT_JSON (minified)"
echo "   • SHOPIFY_STORE"
echo "   • SHOPIFY_ACCESS_TOKEN"
echo "   • SHOPIFY_API_VERSION"
echo "   • ANTHROPIC_API_KEY"
echo "   • CRON_SECRET"
echo "   • PERPLEXITY_API_KEY (optional)"
echo ""

echo "8. Once env vars are set, test with:"
echo "   curl https://your-domain.vercel.app/api/health"
echo ""

echo "9. Run database migration:"
echo "   curl -X POST https://your-domain.vercel.app/api/db/migrate"
echo ""

echo "10. Seed initial keywords:"
echo "    curl -X GET https://your-domain.vercel.app/api/cron/discover-keywords \\"
echo "      -H \"Authorization: Bearer YOUR_CRON_SECRET\""
echo ""

echo "11. Visit dashboard:"
echo "    https://your-domain.vercel.app/"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}For detailed instructions:${NC}"
echo "  • Read: PRODUCTION_DEPLOYMENT.md"
echo "  • Read: QUICKSTART.md"
echo "  • Read: START_HERE.md"
echo ""

echo -e "${GREEN}✓ Ready to deploy!${NC}"
echo ""

read -p "Open Vercel now? (y/n): " OPEN_VERCEL
if [ "$OPEN_VERCEL" = "y" ]; then
    if command -v open &> /dev/null; then
        open https://vercel.com/
    elif command -v xdg-open &> /dev/null; then
        xdg-open https://vercel.com/
    else
        echo "Please visit: https://vercel.com/"
    fi
fi
