#!/bin/bash

# GENRAGE Content Engine - Setup Script
# This script helps with initial setup and testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Main Menu
main_menu() {
    print_header "GENRAGE Content Engine Setup"

    echo "Choose an option:"
    echo "1. Check prerequisites"
    echo "2. Generate CRON_SECRET"
    echo "3. Minify service account JSON"
    echo "4. Setup local environment"
    echo "5. Test database connection"
    echo "6. Test API endpoints"
    echo "7. Create git repository"
    echo "8. View deployment guide"
    echo "0. Exit"
    echo ""
    read -p "Enter choice (0-8): " choice

    case $choice in
        1) check_prerequisites ;;
        2) generate_cron_secret ;;
        3) minify_json ;;
        4) setup_local_env ;;
        5) test_db_connection ;;
        6) test_api_endpoints ;;
        7) setup_git ;;
        8) view_deployment ;;
        0) exit 0 ;;
        *) print_error "Invalid choice. Try again." && main_menu ;;
    esac
}

# Check Prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    local missing=0

    # Node.js
    if command -v node &> /dev/null; then
        print_success "Node.js installed: $(node -v)"
    else
        print_error "Node.js not installed"
        missing=$((missing+1))
    fi

    # npm
    if command -v npm &> /dev/null; then
        print_success "npm installed: $(npm -v)"
    else
        print_error "npm not installed"
        missing=$((missing+1))
    fi

    # Git
    if command -v git &> /dev/null; then
        print_success "Git installed: $(git -v | head -1)"
    else
        print_error "Git not installed"
        missing=$((missing+1))
    fi

    # Vercel CLI
    if command -v vercel &> /dev/null; then
        print_success "Vercel CLI installed"
    else
        print_warning "Vercel CLI not installed. Install with: npm i -g vercel"
    fi

    # Check Node version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ $NODE_VERSION -ge 18 ]; then
        print_success "Node.js version >= 18"
    else
        print_error "Node.js must be version 18 or higher"
        missing=$((missing+1))
    fi

    if [ $missing -eq 0 ]; then
        print_success "All prerequisites met!"
    else
        print_error "$missing prerequisite(s) missing"
    fi

    read -p "Press enter to continue..."
    main_menu
}

# Generate CRON_SECRET
generate_cron_secret() {
    print_header "Generating CRON_SECRET"

    if command -v openssl &> /dev/null; then
        SECRET=$(openssl rand -hex 32)
    else
        SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    fi

    print_success "Generated CRON_SECRET:"
    echo ""
    echo -e "${YELLOW}${SECRET}${NC}"
    echo ""
    echo "Add this to Vercel environment variables:"
    echo "CRON_SECRET=${SECRET}"
    echo ""

    # Copy to clipboard if possible
    if command -v pbcopy &> /dev/null; then
        echo "$SECRET" | pbcopy
        print_success "Copied to clipboard!"
    elif command -v xclip &> /dev/null; then
        echo "$SECRET" | xclip -selection clipboard
        print_success "Copied to clipboard!"
    fi

    read -p "Press enter to continue..."
    main_menu
}

# Minify JSON
minify_json() {
    print_header "Minify Service Account JSON"

    read -p "Enter path to service account JSON file: " json_file

    if [ ! -f "$json_file" ]; then
        print_error "File not found: $json_file"
        read -p "Press enter to continue..."
        main_menu
        return
    fi

    # Minify JSON
    MINIFIED=$(cat "$json_file" | tr -d '\n' | tr -d ' ')

    print_success "Minified JSON:"
    echo ""
    echo -e "${YELLOW}${MINIFIED:0:100}...${NC}"
    echo ""

    # Save to file
    OUTPUT_FILE="${json_file%.json}_minified.txt"
    echo "$MINIFIED" > "$OUTPUT_FILE"
    print_success "Saved to: $OUTPUT_FILE"

    # Copy to clipboard
    if command -v pbcopy &> /dev/null; then
        echo "$MINIFIED" | pbcopy
        print_success "Copied to clipboard!"
    fi

    echo ""
    echo "Add to Vercel as:"
    echo "GSC_SERVICE_ACCOUNT_JSON=$MINIFIED"

    read -p "Press enter to continue..."
    main_menu
}

# Setup Local Environment
setup_local_env() {
    print_header "Setup Local Environment"

    if [ -f .env.local ]; then
        print_warning ".env.local already exists"
        read -p "Overwrite? (y/n): " overwrite
        if [ "$overwrite" != "y" ]; then
            main_menu
            return
        fi
    fi

    cp .env.local.example .env.local
    print_success "Created .env.local from template"

    print_info "Edit .env.local with your values:"
    print_info "- DATABASE_URL"
    print_info "- GSC_SERVICE_ACCOUNT_JSON"
    print_info "- GA4_SERVICE_ACCOUNT_JSON"
    print_info "- SHOPIFY_ACCESS_TOKEN"
    print_info "- ANTHROPIC_API_KEY"
    print_info "- CRON_SECRET"

    read -p "Would you like to edit it now? (y/n): " edit_now
    if [ "$edit_now" = "y" ]; then
        ${EDITOR:-nano} .env.local
    fi

    read -p "Press enter to continue..."
    main_menu
}

# Test Database Connection
test_db_connection() {
    print_header "Test Database Connection"

    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL not set. Load from .env.local:"
        source .env.local 2>/dev/null || true
    fi

    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL still not set"
        read -p "Press enter to continue..."
        main_menu
        return
    fi

    print_info "Testing connection to: ${DATABASE_URL:0:50}..."

    if command -v psql &> /dev/null; then
        if psql "$DATABASE_URL" -c "SELECT NOW()" &> /dev/null; then
            print_success "Database connection successful!"
        else
            print_error "Database connection failed"
        fi
    else
        print_warning "psql not installed. Cannot test connection."
        print_info "Install with: brew install libpq"
    fi

    read -p "Press enter to continue..."
    main_menu
}

# Test API Endpoints
test_api_endpoints() {
    print_header "Test API Endpoints"

    read -p "Enter your Vercel domain (e.g., genrage-content-engine.vercel.app): " domain

    if [ -z "$domain" ]; then
        domain="http://localhost:3000"
    fi

    if [[ ! "$domain" =~ ^https?:// ]]; then
        domain="https://$domain"
    fi

    print_info "Testing endpoints at: $domain"
    echo ""

    # Health check
    print_info "Testing /api/health..."
    HEALTH=$(curl -s "$domain/api/health")
    if echo "$HEALTH" | grep -q "healthy"; then
        print_success "Health check passed"
    else
        print_error "Health check failed"
        echo "$HEALTH"
    fi

    echo ""

    # Keywords
    print_info "Testing /api/keywords..."
    KEYWORDS=$(curl -s "$domain/api/keywords?limit=1")
    if echo "$KEYWORDS" | grep -q "success"; then
        print_success "Keywords endpoint working"
    else
        print_error "Keywords endpoint failed"
    fi

    echo ""

    # Content
    print_info "Testing /api/content..."
    CONTENT=$(curl -s "$domain/api/content?limit=1")
    if echo "$CONTENT" | grep -q "success"; then
        print_success "Content endpoint working"
    else
        print_error "Content endpoint failed"
    fi

    echo ""

    # Dashboard
    print_info "Testing /api/dashboard..."
    DASHBOARD=$(curl -s "$domain/api/dashboard")
    if echo "$DASHBOARD" | grep -q "success"; then
        print_success "Dashboard endpoint working"
    else
        print_error "Dashboard endpoint failed"
    fi

    read -p "Press enter to continue..."
    main_menu
}

# Setup Git
setup_git() {
    print_header "Setup Git Repository"

    if [ -d .git ]; then
        print_warning "Git repository already exists"
        read -p "Reinitialize? (y/n): " reinit
        if [ "$reinit" != "y" ]; then
            main_menu
            return
        fi
        rm -rf .git
    fi

    git init
    print_success "Git repository initialized"

    git add .
    print_success "Files staged"

    git commit -m "initial: genrage content engine"
    print_success "Initial commit created"

    echo ""
    print_info "Next steps:"
    print_info "1. Create repository on GitHub"
    print_info "2. Add remote: git remote add origin https://github.com/username/repo.git"
    print_info "3. Push: git push -u origin main"

    read -p "Press enter to continue..."
    main_menu
}

# View Deployment Guide
view_deployment() {
    print_header "Deployment Guide"

    if [ -f DEPLOYMENT.md ]; then
        less DEPLOYMENT.md
    else
        print_error "DEPLOYMENT.md not found"
    fi

    main_menu
}

# Run main menu
main_menu
