# GENRAGE Content Engine - Command Reference

Quick copy-paste commands for deployment and testing.

## Pre-Deployment

### Generate Credentials

```bash
# Generate CRON_SECRET (copy output)
openssl rand -hex 32

# Or with Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Minify Service Account JSON

```bash
# macOS/Linux
cat /path/to/service-account.json | tr -d '\n' | tr -d ' ' > minified.json
cat minified.json

# Windows (PowerShell)
(Get-Content C:\path\to\service-account.json | ConvertFrom-Json | ConvertTo-Json -Compress)
```

## GitHub Setup

```bash
cd /Users/ankit_genrage/SEO_genrage

# Initialize repository
git init
git add .
git commit -m "initial: genrage content engine"

# Add remote (replace with your GitHub repo)
git remote add origin https://github.com/YOUR_USERNAME/genrage-content-engine.git
git branch -M main
git push -u origin main

# View status
git log --oneline -5
git remote -v
```

## After Vercel Deployment

### Database Migration

```bash
# Replace with your Vercel domain
DOMAIN=genrage-content-engine.vercel.app

# Run migration
curl -X POST https://${DOMAIN}/api/db/migrate

# Expected: {"success":true,"message":"Successfully executed..."}
```

### Health Check

```bash
# Quick health check
curl https://${DOMAIN}/api/health | jq .

# Pretty print
curl -s https://${DOMAIN}/api/health | jq '.'
```

## Cron Jobs (Manual Trigger)

Replace `YOUR_CRON_SECRET` and `YOUR_DOMAIN` with actual values.

```bash
DOMAIN=genrage-content-engine.vercel.app
SECRET=your-32-char-secret

# Discover Keywords
curl -X GET https://${DOMAIN}/api/cron/discover-keywords \
  -H "Authorization: Bearer ${SECRET}" | jq '.'

# Generate Content
curl -X GET https://${DOMAIN}/api/cron/generate-content \
  -H "Authorization: Bearer ${SECRET}" | jq '.'

# Publish Content
curl -X GET https://${DOMAIN}/api/cron/publish \
  -H "Authorization: Bearer ${SECRET}" | jq '.'

# Sync Performance
curl -X GET https://${DOMAIN}/api/cron/sync-performance \
  -H "Authorization: Bearer ${SECRET}" | jq '.'

# AEO Check
curl -X GET https://${DOMAIN}/api/cron/aeo-check \
  -H "Authorization: Bearer ${SECRET}" | jq '.'

# Refresh Content
curl -X GET https://${DOMAIN}/api/cron/refresh-content \
  -H "Authorization: Bearer ${SECRET}" | jq '.'
```

## API Endpoints

### List Keywords

```bash
DOMAIN=genrage-content-engine.vercel.app

# All keywords (default 50)
curl "https://${DOMAIN}/api/keywords" | jq '.keywords[] | {keyword, opportunity_score, current_position}'

# Filter by status
curl "https://${DOMAIN}/api/keywords?status=discovered" | jq '.'

# With pagination
curl "https://${DOMAIN}/api/keywords?limit=100&offset=0" | jq '.keywords | length'
```

### List Content

```bash
# All content (default 50)
curl "https://${DOMAIN}/api/content" | jq '.content[] | {title, status}'

# Filter by status
curl "https://${DOMAIN}/api/content?status=review" | jq '.content[] | {id, title}'

# Get specific piece
curl "https://${DOMAIN}/api/content?status=draft" | jq '.content[0]'
```

### Approve Content

```bash
# Get ID from list first
CONTENT_ID=1

curl -X POST "https://${DOMAIN}/api/content/approve" \
  -H "Content-Type: application/json" \
  -d "{\"content_id\": ${CONTENT_ID}}" | jq '.'
```

### Update Content

```bash
# Update status
curl -X PATCH "https://${DOMAIN}/api/content/1" \
  -H "Content-Type: application/json" \
  -d '{"status": "review"}' | jq '.content | {id, title, status}'

# Update title
curl -X PATCH "https://${DOMAIN}/api/content/1" \
  -H "Content-Type: application/json" \
  -d '{"title": "New Title"}' | jq '.content.title'
```

### Dashboard Data

```bash
# Get all dashboard stats
curl "https://${DOMAIN}/api/dashboard" | jq '.'

# Pretty print with formatting
curl -s "https://${DOMAIN}/api/dashboard" | jq '.stats'

# Get just keyword stats
curl -s "https://${DOMAIN}/api/dashboard" | jq '.stats.keywords'

# Get content stats
curl -s "https://${DOMAIN}/api/dashboard" | jq '.stats.content'

# Get AEO scorecard
curl -s "https://${DOMAIN}/api/dashboard" | jq '.stats.aeoScorecard'
```

## Local Testing

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production build
npm start

# Lint check
npm run lint
```

### Test Local Endpoints

```bash
# Health check (dev)
curl http://localhost:3000/api/health | jq '.'

# Keywords (dev)
curl "http://localhost:3000/api/keywords?limit=5" | jq '.keywords | length'

# Dashboard (dev)
curl "http://localhost:3000/api/dashboard" | jq '.stats.keywords.total'
```

## Environment Variable Management

### Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Link to project
vercel link

# List env vars
vercel env list

# Add env var
vercel env add DATABASE_URL

# Remove env var
vercel env rm DATABASE_URL

# View logs
vercel logs --prod

# Deploy
vercel deploy --prod
```

### Check What's Set

```bash
# On your machine (if .env.local exists)
cat .env.local | grep -v '^#' | grep '='

# In Vercel (requires Vercel CLI)
vercel env list --production
```

## Testing Common Issues

### Database Connection

```bash
# Test with psql (macOS)
brew install libpq
psql "postgresql://[user]:[password]@[host]/genrage_content_engine?sslmode=require"

# If successful, you'll see:
# genrage_content_engine=#
```

### Google Service Account

```bash
# Check if service account email has GSC access
# 1. Go to Search Console
# 2. Settings → Users and permissions
# 3. Look for service account email (should say "Owner")

# View service account email from JSON
cat /path/to/service-account.json | jq '.client_email'
```

### Shopify Connection

```bash
# Test Shopify token
STORE=gen-rage-clothing.myshopify.com
TOKEN=shpat_...

curl -X GET "https://${STORE}/admin/api/2024-10/shop.json" \
  -H "X-Shopify-Access-Token: ${TOKEN}" | jq '.shop.name'

# Should return your shop name
```

### Claude API

```bash
# Check API key works (use Node.js)
node -e "
const Anthropic = require('@anthropic-ai/sdk').default;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
client.messages.create({
  model: 'claude-opus-4-20250514',
  max_tokens: 100,
  messages: [{role: 'user', content: 'Say hello'}]
}).then(r => console.log(r.content[0].text));
"
```

## Monitoring

### View Vercel Logs

```bash
DOMAIN=genrage-content-engine

# Recent logs
vercel logs ${DOMAIN}

# With filtering
vercel logs ${DOMAIN} --follow

# Errors only
vercel logs ${DOMAIN} | grep -i error
```

### Database Monitoring

```bash
# Login to Neon console at https://console.neon.tech/

# Or run query directly
psql "postgresql://..." -c "SELECT COUNT(*) FROM keywords;"

# Check table sizes
psql "postgresql://..." -c "
  SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
  FROM pg_tables
  WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

## Quick Troubleshooting

### "Failed to connect to database"

```bash
# Check connection string
echo $DATABASE_URL

# Test connection
psql "$DATABASE_URL" -c "SELECT NOW();"

# Verify in Vercel
vercel env list | grep DATABASE_URL
```

### "Service account not authorized"

```bash
# Get service account email
cat /path/to/service-account.json | jq '.client_email'

# Add to GSC:
# 1. Search Console → Settings
# 2. Users and permissions → Add user
# 3. Paste email, set to "Owner"
```

### "Shopify authentication failed"

```bash
# Check token exists
echo $SHOPIFY_ACCESS_TOKEN

# Verify token works
curl -s "https://gen-rage-clothing.myshopify.com/admin/api/2024-10/shop.json" \
  -H "X-Shopify-Access-Token: shpat_..." | jq '.shop'

# If error, token might be expired or lack scopes
```

### "Claude API rate limited"

```bash
# Check API usage at https://console.anthropic.com/

# Reduce daily generation:
# Edit app/api/cron/generate-content/route.ts
# Change: const queuedItems = await getQueuedContent(3);
# To smaller number or add delays between calls
```

## Batch Operations

### Generate Content for Multiple Keywords

```bash
# Get all pending keywords
PENDING=$(curl -s "https://${DOMAIN}/api/keywords?status=discovered&limit=20" | jq '.keywords[].id')

# Queue each one (requires database access, typically done by cron)
# Or use the cron job:
curl -X GET "https://${DOMAIN}/api/cron/discover-keywords" \
  -H "Authorization: Bearer ${SECRET}"
```

### Approve All Review Content

```bash
# Get all in review
CONTENT=$(curl -s "https://${DOMAIN}/api/content?status=review" | jq '.content[].id')

# Approve each
for id in $CONTENT; do
  curl -X POST "https://${DOMAIN}/api/content/approve" \
    -H "Content-Type: application/json" \
    -d "{\"content_id\": $id}"
done
```

## Performance Testing

### Measure Response Times

```bash
# Single endpoint
time curl "https://${DOMAIN}/api/health"

# Multiple requests
for i in {1..10}; do curl -s "https://${DOMAIN}/api/health" | jq '.checks.database'; done

# With ab (Apache Bench)
ab -n 100 -c 10 "https://${DOMAIN}/api/health"
```

## One-Liners for Common Tasks

```bash
# Show keyword count
curl -s "https://${DOMAIN}/api/dashboard" | jq '.stats.keywords.total'

# Show content in review
curl -s "https://${DOMAIN}/api/content?status=review" | jq '.content | length'

# Show top opportunity keyword
curl -s "https://${DOMAIN}/api/keywords" | jq '.keywords | sort_by(.opportunity_score) | reverse[0]'

# Check last engine job
curl -s "https://${DOMAIN}/api/dashboard" | jq '.stats.engineStatus[0]'

# Export all keywords to CSV
curl -s "https://${DOMAIN}/api/keywords?limit=1000" | jq -r '.keywords[] | [.keyword, .opportunity_score, .current_position] | @csv' > keywords.csv

# Quick health summary
curl -s "https://${DOMAIN}/api/health" && echo "✓ System healthy"
```

---

**Tip**: Save your DOMAIN and SECRET as variables:
```bash
export GENRAGE_DOMAIN="genrage-content-engine.vercel.app"
export GENRAGE_SECRET="your-32-char-secret"

# Then use in commands
curl -X GET "https://${GENRAGE_DOMAIN}/api/cron/discover-keywords" \
  -H "Authorization: Bearer ${GENRAGE_SECRET}"
```

---

Last Updated: March 26, 2024
