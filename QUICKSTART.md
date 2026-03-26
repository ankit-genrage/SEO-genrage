# Quick Start - GENRAGE Content Engine

Get from zero to running in 60 minutes.

## 5 Minute Setup

### Step 1: Prepare Your Credentials (5 min)

Gather these 6 things before deploying:

1. **Neon Connection String**
   - Go to https://console.neon.tech/
   - Create project: `genrage-content-engine` in Singapore
   - Copy connection string (starts with `postgresql://`)

2. **Google Service Account JSON**
   - Go to https://console.cloud.google.com/
   - Create service account
   - Download JSON key
   - **Minify it** (remove newlines): `cat file.json | tr -d '\n'`

3. **Shopify Access Token**
   - Go to Shopify admin
   - Create app: "GENRAGE Content Engine"
   - Enable scope: `write_content`
   - Copy token (starts with `shpat_`)

4. **Claude API Key**
   - Go to https://console.anthropic.com/
   - Generate API key
   - Copy (starts with `sk-ant-`)

5. **Cron Secret** (random string)
   - Run: `openssl rand -hex 32`
   - Copy output

6. **Your Values**
   - GA4 Property ID: `401864026` (or yours)
   - Shopify store: `gen-rage-clothing.myshopify.com`
   - GSC site: `https://genrage.com`

### Step 2: Deploy to Vercel (5 min)

```bash
# 1. Push to GitHub
cd /Users/ankit_genrage/SEO_genrage
git init
git add .
git commit -m "initial: genrage content engine"
# Then push to GitHub

# 2. Deploy
# Go to https://vercel.com/
# Click "New Project"
# Select GitHub repo
# Click "Deploy"
```

### Step 3: Add Environment Variables (5 min)

In **Vercel Dashboard → Settings → Environment Variables**, add:

```
DATABASE_URL=postgresql://...
GSC_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
GSC_SITE_URL=https://genrage.com
GA4_PROPERTY_ID=401864026
GA4_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
SHOPIFY_STORE=gen-rage-clothing.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_...
SHOPIFY_API_VERSION=2024-10
ANTHROPIC_API_KEY=sk-ant-...
CRON_SECRET=[your-random-secret]
PERPLEXITY_API_KEY=pplx_... (optional)
```

---

## 10 Minute Setup (After Env Vars Set)

### Step 4: Initialize Database (1 min)

```bash
# Replace with your Vercel domain
curl -X POST https://genrage-content-engine.vercel.app/api/db/migrate
```

**Expected response:**
```json
{
  "success": true,
  "message": "Successfully executed X migration statements"
}
```

### Step 5: Check System Health (1 min)

```bash
curl https://genrage-content-engine.vercel.app/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "checks": {
    "database": "ok",
    "environment": {
      "hasGSCServiceAccount": true,
      "hasShopifyToken": true,
      ...
    }
  }
}
```

### Step 6: Discover Keywords (1 min)

```bash
curl -X GET https://genrage-content-engine.vercel.app/api/cron/discover-keywords \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected response:**
```json
{
  "success": true,
  "message": "Discovered X new keywords, queued X for content",
  "stats": {
    "totalQueriesProcessed": 500,
    "newKeywords": 42,
    "queued": 10
  }
}
```

### Step 7: View Dashboard (1 min)

Open: `https://genrage-content-engine.vercel.app/`

You should see:
- Keywords count
- Content pipeline (draft/review/published)
- Engine status

---

## Full 60 Minute Setup

If you want to test end-to-end before going live:

### 1. Neon Setup (10 min)

```bash
# Create project at https://console.neon.tech/
# Name: genrage-content-engine
# Region: Singapore
# Copy connection string
```

### 2. Google Cloud Setup (15 min)

```bash
# 1. Go to https://console.cloud.google.com/
# 2. Create project
# 3. Enable APIs:
#    - Search Console API
#    - Google Analytics Data API
# 4. Create service account
# 5. Create JSON key
# 6. Download and minify JSON

cat /path/to/service-account.json | tr -d '\n' > minified.json
```

### 3. Shopify Setup (10 min)

```bash
# 1. Go to Shopify admin
# 2. Apps → App and sales channel settings
# 3. Develop apps → Create an app
# 4. Name: GENRAGE Content Engine
# 5. Enable scopes: write_content
# 6. Install app
# 7. Copy access token
```

### 4. GitHub & Vercel (15 min)

```bash
# Create GitHub repo
git init
git add .
git commit -m "initial: genrage content engine"
git remote add origin https://github.com/YOUR_USERNAME/genrage-content-engine.git
git push -u origin main

# Deploy to Vercel
# Go to https://vercel.com/
# Connect GitHub account
# Select repo
# Add env vars
# Deploy
```

### 5. Test Everything (10 min)

```bash
# Health check
curl https://your-domain.vercel.app/api/health

# Discover keywords
curl -X GET https://your-domain.vercel.app/api/cron/discover-keywords \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Generate content
curl -X GET https://your-domain.vercel.app/api/cron/generate-content \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Check dashboard
# https://your-domain.vercel.app/
```

---

## Next Steps (After Launch)

### Daily
- Check dashboard
- Review content in "review" status
- Approve/reject as needed

### Weekly
- Monitor keywords
- Check AEO scorecard
- Review performance

### Monthly
- Adjust scoring weights
- Update content templates
- Plan new content types

---

## Troubleshooting

### "Database connection failed"
→ Check DATABASE_URL in Vercel env vars

### "Health check shows errors"
→ Verify all env vars are set: `vercel env list`

### "GSC data not syncing"
→ Add service account email to GSC property (as Owner)

### "Shopify publishing fails"
→ Check token has `write_content` scope

### "Claude API errors"
→ Verify ANTHROPIC_API_KEY is valid

---

## Commands Quick Reference

```bash
# Setup script (interactive)
./scripts/setup.sh

# Test health
curl https://your-domain.vercel.app/api/health

# Manual keyword discovery
curl -X GET https://your-domain.vercel.app/api/cron/discover-keywords \
  -H "Authorization: Bearer CRON_SECRET"

# Manual content generation
curl -X GET https://your-domain.vercel.app/api/cron/generate-content \
  -H "Authorization: Bearer CRON_SECRET"

# Manual publish
curl -X GET https://your-domain.vercel.app/api/cron/publish \
  -H "Authorization: Bearer CRON_SECRET"

# Approve content
curl -X POST https://your-domain.vercel.app/api/content/approve \
  -H "Content-Type: application/json" \
  -d '{"content_id": 1}'

# List keywords
curl https://your-domain.vercel.app/api/keywords

# List content
curl https://your-domain.vercel.app/api/content

# View dashboard
# https://your-domain.vercel.app/
```

---

## Cost Estimate

- Neon: $15-50/month
- Vercel: Free
- Claude API: $180-270/month (3 pieces/day)
- Google APIs: Free
- **Total: ~$200-320/month**

(Scales with content volume)

---

## Need Help?

- Check `DEPLOYMENT.md` for detailed setup
- Check `SETUP_CHECKLIST.md` for full checklist
- Run `./scripts/setup.sh` for interactive help
- Review README.md for architecture details

---

**You're ready to launch!** 🚀

Once deployed, the system runs automatically:
- Keywords synced weekly
- Content generated daily
- Metrics tracked continuously
- Underperforming content auto-refreshed

Monitor from the dashboard, approve content as it comes in, and watch your SEO+AEO performance improve.
