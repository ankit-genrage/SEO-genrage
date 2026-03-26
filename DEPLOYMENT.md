# Deployment Guide - GENRAGE Content Engine

Complete step-by-step setup for Neon + Vercel.

## Phase 1: Neon Database Setup (10 minutes)

### Step 1: Create Neon Project

1. Go to https://console.neon.tech/
2. Create new project:
   - **Name**: `genrage-content-engine`
   - **Region**: Singapore
   - **Database**: `genrage_content_engine`
   - **Branch**: `main`

3. Copy your connection string (you'll see it after creation):
   ```
   postgresql://[username]:[password]@[host]/genrage_content_engine?sslmode=require
   ```

**Save this — you'll need it for Vercel env vars.**

### Step 2: (Optional) Test Connection Locally

If you want to test locally before deploying:

```bash
# Install psql (macOS)
brew install libpq

# Test connection
psql "postgresql://[username]:[password]@[host]/genrage_content_engine?sslmode=require"

# Should connect successfully
genrage_content_engine=#
```

---

## Phase 2: Vercel Deployment (15 minutes)

### Step 1: Push Project to GitHub

```bash
cd /Users/ankit_genrage/SEO_genrage

# Initialize git if not already done
git init
git add .
git commit -m "initial: genrage content engine"

# Push to your GitHub repo
git remote add origin https://github.com/YOUR_USERNAME/genrage-content-engine.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

**Option A: Via Vercel Dashboard**

1. Go to https://vercel.com/
2. Click "New Project"
3. Select your GitHub repo (`genrage-content-engine`)
4. Configure project:
   - Framework: Next.js
   - Root Directory: `./`
5. Click "Deploy"

**Option B: Via Vercel CLI**

```bash
npm i -g vercel
cd /Users/ankit_genrage/SEO_genrage
vercel link  # Follow prompts
vercel deploy --prod
```

### Step 3: Add Environment Variables

Go to **Vercel Dashboard → Settings → Environment Variables** and add:

```
DATABASE_URL=postgresql://[your-neon-connection-string]
```

#### Google Service Account Setup

1. Go to https://console.cloud.google.com/
2. Create or select project
3. Enable APIs:
   - Google Search Console API
   - Google Analytics Data API

4. Create Service Account:
   - IAM & Admin → Service Accounts → Create Service Account
   - Name: `genrage-content-engine`
   - Grant roles:
     - Editor (temporary, for setup)

5. Create JSON key:
   - Service Account → Keys → Add Key → Create New → JSON
   - Download JSON file

6. **Add to GSC property**:
   - Go to https://search.google.com/search-console/
   - Settings → Users and permissions
   - Add service account email as owner

7. **Minify JSON** (make single line):
   ```bash
   # macOS/Linux
   cat /path/to/service-account.json | tr -d '\n' > minified.json
   ```

8. Copy entire minified JSON and add to Vercel:
   ```
   GSC_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   ```

#### More Environment Variables

Add these to Vercel:

```
GSC_SITE_URL=https://genrage.com
GA4_PROPERTY_ID=401864026
GA4_SERVICE_ACCOUNT_JSON={"type":"service_account",...}  # Same or different account
SHOPIFY_STORE=gen-rage-clothing.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_[your-token]
SHOPIFY_API_VERSION=2024-10
ANTHROPIC_API_KEY=sk-ant-[your-api-key]
CRON_SECRET=[generate-random-secret]
PERPLEXITY_API_KEY=pplx_[your-key]  # Optional
```

### Get CRON_SECRET

Generate a random secret:

```bash
# macOS/Linux
openssl rand -hex 32
# Copy the output

# Or use Node
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Get Shopify Access Token

1. Go to https://admin.shopify.com/
2. Apps → App and sales channel settings
3. Develop apps → Create an app
4. Name: `GENRAGE Content Engine`
5. Admin API scopes → Enable: `write_content` (for blog publishing)
6. Install app
7. API credentials → Show access token → Copy

---

## Phase 3: Database Migration (5 minutes)

### Trigger Migration

After all env vars are set in Vercel, run the migration:

```bash
# Replace with your Vercel domain
curl -X POST https://genrage-content-engine.vercel.app/api/db/migrate

# Should see: {"success":true,"message":"Successfully executed X migration statements"}
```

### Verify Health

```bash
curl https://genrage-content-engine.vercel.app/api/health

# Should see:
# {
#   "status": "healthy",
#   "checks": {
#     "database": "ok",
#     "timestamp": "2024-...",
#     "environment": {
#       "hasGSCServiceAccount": true,
#       "hasGA4ServiceAccount": true,
#       "hasShopifyToken": true,
#       "hasAnthropicKey": true,
#       "hasCronSecret": true,
#       ...
#     }
#   }
# }
```

---

## Phase 4: Initial Data Seeding (10 minutes)

### Discover Keywords from GSC

```bash
curl -X GET https://genrage-content-engine.vercel.app/api/cron/discover-keywords \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Should see:
# {
#   "success": true,
#   "message": "Discovered X new keywords, queued X for content",
#   "stats": { "totalQueriesProcessed": ..., "newKeywords": ..., ... }
# }
```

This will:
- Pull top queries from GSC
- Classify intent for each
- Suggest related keywords
- Calculate opportunity scores
- Queue top keywords for content generation

### Check Dashboard

Visit: `https://genrage-content-engine.vercel.app/`

You should see:
- Keywords count
- Empty content pipeline (nothing published yet)
- Recent engine logs

---

## Phase 5: First Content Generation (Optional - manual test)

### Generate First Batch

```bash
curl -X GET https://genrage-content-engine.vercel.app/api/cron/generate-content \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Should see: {"success":true,"message":"Generated X content pieces"...}
```

### Review Generated Content

```bash
curl https://genrage-content-engine.vercel.app/api/content?status=review

# See all content in "review" status
```

### Approve Content

```bash
curl -X POST https://genrage-content-engine.vercel.app/api/content/approve \
  -H "Content-Type: application/json" \
  -d '{"content_id": 1}'

# Changes status to "approved"
```

### Publish to Shopify

```bash
curl -X GET https://genrage-content-engine.vercel.app/api/cron/publish \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Pushes approved content to Shopify blog
```

---

## Automated Schedule (After Deployment)

Once deployed, these run automatically:

| Job | When | What |
|-----|------|------|
| Discover Keywords | Weekly (Sun 12 AM IST) | Pull GSC data, find opportunities |
| Generate Content | Daily (6:30 AM IST) | Create 2-3 content pieces |
| Publish | Daily (7:30 AM IST) | Push approved content to Shopify |
| Sync Performance | Daily (8:30 AM IST) | Update metrics from GSC + GA4 |
| AEO Check | Weekly (Wed 9:30 AM IST) | Monitor AI platform citations |
| Refresh Content | Weekly (Mon 10:30 AM IST) | Flag underperforming content |

You can manually trigger anytime with curl commands (see examples above).

---

## Troubleshooting

### Database Connection Failed

```bash
# Test connection string
psql "postgresql://[connection-string]"

# Check Vercel logs
vercel logs --prod

# Verify DATABASE_URL is set
vercel env list
```

### Health Check Shows Errors

```bash
# Check all env vars are set
vercel env list

# Environment variables required:
# - DATABASE_URL ✓
# - GSC_SERVICE_ACCOUNT_JSON ✓
# - GA4_PROPERTY_ID ✓
# - GA4_SERVICE_ACCOUNT_JSON ✓
# - SHOPIFY_STORE ✓
# - SHOPIFY_ACCESS_TOKEN ✓
# - SHOPIFY_API_VERSION ✓
# - ANTHROPIC_API_KEY ✓
# - CRON_SECRET ✓
```

### GSC/GA4 Not Working

- Verify service account email has access to GSC property
- Check GA4 property ID (find in GA4 admin)
- Ensure APIs are enabled in Cloud Console

### Shopify Errors

- Check token has `write_content` scope
- Verify store name: `store-name.myshopify.com` format
- Make sure store is not on trial or paused

### Claude API Errors

- Check ANTHROPIC_API_KEY is valid
- Verify account has available credits
- Check API rate limits

---

## Testing Locally (Optional)

```bash
# Copy env to local
cp .env.local.example .env.local
# Fill in all values

# Install dependencies
npm install

# Run dev server
npm run dev

# Visit http://localhost:3000

# Test API endpoints
curl http://localhost:3000/api/health
```

---

## Next Steps

1. ✅ Neon database created
2. ✅ Vercel deployment linked
3. ✅ Environment variables set
4. ✅ Database migrated
5. ✅ Initial keywords discovered
6. 📊 Monitor dashboard daily
7. 🎯 Adjust scoring weights based on performance
8. 🚀 Scale: add more content types, expand to other sections

---

## Support Resources

- Neon Docs: https://neon.tech/docs/
- Vercel Docs: https://vercel.com/docs
- Claude API: https://docs.anthropic.com/
- Next.js: https://nextjs.org/docs
- Google APIs: https://developers.google.com/

**You're ready to launch!** 🚀
