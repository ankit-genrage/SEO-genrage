# Setup Checklist - GENRAGE Content Engine

Complete this checklist to get your system running.

## Pre-Deployment (Before Pushing to Vercel)

### Local Verification
- [ ] Node.js 18+ installed: `node -v`
- [ ] Dependencies installed: `npm install`
- [ ] TypeScript compiles: `npm run build` (or `next build`)
- [ ] All files created (check: `ls app/api/cron/`)

### Environment File
- [ ] `.env.local.example` reviewed
- [ ] `.env.local` created (for local testing, not committed)

---

## Phase 1: Neon Database (10 min)

### Neon Account
- [ ] Account created at https://console.neon.tech/
- [ ] New project created: `genrage-content-engine`
- [ ] Region: Singapore selected
- [ ] Connection string copied and saved

**Save this connection string:**
```
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]/genrage_content_engine?sslmode=require
```

### Optional: Test Connection
- [ ] psql installed: `brew install libpq`
- [ ] Connection tested: `psql "postgresql://..."`

---

## Phase 2: Google Cloud Setup (15 min)

### Create Service Account
- [ ] Google Cloud project created or selected
- [ ] Search Console API enabled
- [ ] Google Analytics Data API enabled
- [ ] Service account created: `genrage-content-engine`
- [ ] JSON key downloaded
- [ ] JSON minified to single line

**Service Account JSON ready:**
```
GSC_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
GA4_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### Connect to GSC
- [ ] Service account email added to GSC property
- [ ] User/permission level: Owner
- [ ] Verified in Search Console

### GA4 Property ID
- [ ] GA4 property ID found: `401864026` (or your property)
```
GA4_PROPERTY_ID=401864026
```

---

## Phase 3: Shopify Setup (10 min)

### Create App
- [ ] Logged into Shopify admin
- [ ] New app created: `GENRAGE Content Engine`
- [ ] Admin API scopes granted: `write_content`
- [ ] App installed

### Generate Access Token
- [ ] API credentials accessed
- [ ] Access token revealed and copied

**Shopify variables ready:**
```
SHOPIFY_STORE=gen-rage-clothing.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_[your-token]
SHOPIFY_API_VERSION=2024-10
```

---

## Phase 4: API Keys (5 min)

### Anthropic Claude
- [ ] Account at https://console.anthropic.com/
- [ ] API key generated
- [ ] Credits available

```
ANTHROPIC_API_KEY=sk-ant-[your-key]
```

### Perplexity (Optional)
- [ ] Account at https://www.perplexity.ai/ (if using)
- [ ] API key generated (optional for AEO checks)

```
PERPLEXITY_API_KEY=pplx_[your-key]  # Optional
```

### Cron Secret
- [ ] Random secret generated (32 hex chars)
```bash
openssl rand -hex 32
# Copy output:
CRON_SECRET=[your-random-secret]
```

---

## Phase 5: GitHub & Vercel (10 min)

### Git Setup
- [ ] Git initialized: `git init`
- [ ] Files added: `git add .`
- [ ] Initial commit: `git commit -m "initial: genrage content engine"`
- [ ] GitHub repo created
- [ ] Remote added: `git remote add origin https://github.com/...`
- [ ] Code pushed: `git push -u origin main`

### Vercel Setup
- [ ] Vercel account at https://vercel.com/
- [ ] GitHub connected
- [ ] New project created from GitHub repo
- [ ] Framework: Next.js selected
- [ ] Ready to deploy

---

## Phase 6: Environment Variables in Vercel (10 min)

### Add to Vercel Dashboard
Settings → Environment Variables → Add for Production:

#### Database
- [ ] `DATABASE_URL` = `postgresql://...`

#### Google
- [ ] `GSC_SERVICE_ACCOUNT_JSON` = `{"type":"service_account",...}`
- [ ] `GSC_SITE_URL` = `https://genrage.com`
- [ ] `GA4_PROPERTY_ID` = `401864026`
- [ ] `GA4_SERVICE_ACCOUNT_JSON` = `{"type":"service_account",...}`

#### Shopify
- [ ] `SHOPIFY_STORE` = `gen-rage-clothing.myshopify.com`
- [ ] `SHOPIFY_ACCESS_TOKEN` = `shpat_...`
- [ ] `SHOPIFY_API_VERSION` = `2024-10`

#### API Keys
- [ ] `ANTHROPIC_API_KEY` = `sk-ant-...`
- [ ] `CRON_SECRET` = `[random-secret]`
- [ ] `PERPLEXITY_API_KEY` = `pplx_...` (Optional)

### Deploy
- [ ] "Deploy" button clicked in Vercel
- [ ] Build completes successfully
- [ ] Production URL created (e.g., `genrage-content-engine.vercel.app`)

---

## Phase 7: Database Migration (5 min)

### Run Migration
```bash
# Replace with your Vercel URL
curl -X POST https://genrage-content-engine.vercel.app/api/db/migrate
```

- [ ] Migration response: `{"success":true,...}`
- [ ] All tables created
- [ ] Indexes created

### Health Check
```bash
curl https://genrage-content-engine.vercel.app/api/health
```

- [ ] Status: `healthy`
- [ ] Database: `ok`
- [ ] All environment checks: `true`

---

## Phase 8: Initial Data Seeding (10 min)

### Discover Keywords
```bash
curl -X GET https://your-domain.vercel.app/api/cron/discover-keywords \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

- [ ] Response: `{"success":true,"message":"Discovered X new keywords"...}`
- [ ] Keywords synced from GSC
- [ ] New keywords inserted

### Check Dashboard
```
https://genrage-content-engine.vercel.app/
```

- [ ] Dashboard loads
- [ ] Keywords count > 0
- [ ] No errors in console

### Check Database
```bash
curl https://genrage-content-engine.vercel.app/api/keywords?limit=10
```

- [ ] Keywords returned
- [ ] Opportunity scores calculated
- [ ] Intents classified

---

## Phase 9: First Content Generation (Optional)

### Generate Content
```bash
curl -X GET https://your-domain.vercel.app/api/cron/generate-content \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

- [ ] Response: `{"success":true,"message":"Generated X content pieces"...}`
- [ ] Content created with status "review"

### Approve Content
```bash
curl -X POST https://your-domain.vercel.app/api/content/approve \
  -H "Content-Type: application/json" \
  -d '{"content_id": 1}'
```

- [ ] Status changed to "approved"
- [ ] Content ready for publishing

### Publish to Shopify
```bash
curl -X GET https://your-domain.vercel.app/api/cron/publish \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

- [ ] Content published to Shopify blog
- [ ] Article created successfully
- [ ] Shopify ID stored in database

---

## Phase 10: Verify Automation

### Dashboard Check
- [ ] Visit dashboard: https://genrage-content-engine.vercel.app/
- [ ] Overview tab shows content pipeline
- [ ] Keywords tab shows top opportunities
- [ ] Content tab shows published pieces
- [ ] AEO tab shows citation tracking

### Scheduled Jobs
- [ ] Check Vercel dashboard → Crons tab
- [ ] 6 cron jobs visible
- [ ] Jobs scheduled for correct times

### Monitor Logs
- [ ] Vercel dashboard → Logs
- [ ] No error logs
- [ ] Cron executions visible

---

## Post-Deployment Maintenance

### Daily
- [ ] Check dashboard for new content
- [ ] Review content in "review" status
- [ ] Approve/reject content as needed

### Weekly
- [ ] Check AEO scorecard for citations
- [ ] Review top performing content
- [ ] Check engine logs for errors

### Monthly
- [ ] Review cost (Claude API usage)
- [ ] Adjust scoring weights if needed
- [ ] Update content templates if required
- [ ] Check GSC for new keyword opportunities

---

## Troubleshooting Checklist

If something fails:

### Dashboard Won't Load
- [ ] Check Vercel deployment status
- [ ] Check browser console for errors
- [ ] Verify DATABASE_URL is set
- [ ] Run `/api/health` to check system

### Database Errors
- [ ] Verify Neon connection string
- [ ] Check Neon dashboard for project
- [ ] Run migration again: `POST /api/db/migrate`
- [ ] Check Vercel logs for SQL errors

### GSC/GA4 Not Working
- [ ] Verify service account has access
- [ ] Check APIs are enabled in Google Cloud
- [ ] Verify property IDs are correct
- [ ] Run `/api/health` to check env vars

### Shopify Publishing Fails
- [ ] Verify token has `write_content` scope
- [ ] Check store name format
- [ ] Verify Shopify account is active
- [ ] Check Vercel logs for API errors

### Claude API Errors
- [ ] Verify API key is correct
- [ ] Check account has credits
- [ ] Check API rate limits
- [ ] Run small test via `/api/content/generate`

### Crons Not Running
- [ ] Check Vercel Crons tab
- [ ] Verify CRON_SECRET is set
- [ ] Check if jobs are scheduled
- [ ] Wait for scheduled time (they run on cron schedule)

---

## Success Indicators

You're ready when:

✅ All env vars added to Vercel
✅ Database migration successful
✅ Health check returns `healthy`
✅ Keywords discovered from GSC
✅ Dashboard loads and shows data
✅ First content generated
✅ Content published to Shopify
✅ Cron jobs scheduled in Vercel

**You're now live!** 🚀

---

## Quick Command Reference

```bash
# Test health
curl https://genrage-content-engine.vercel.app/api/health

# Discover keywords
curl -X GET https://genrage-content-engine.vercel.app/api/cron/discover-keywords \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Generate content
curl -X GET https://genrage-content-engine.vercel.app/api/cron/generate-content \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Publish content
curl -X GET https://genrage-content-engine.vercel.app/api/cron/publish \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Approve content
curl -X POST https://genrage-content-engine.vercel.app/api/content/approve \
  -H "Content-Type: application/json" \
  -d '{"content_id": 1}'

# List keywords
curl "https://genrage-content-engine.vercel.app/api/keywords?limit=10"

# List content
curl "https://genrage-content-engine.vercel.app/api/content?status=review"

# Get dashboard
curl https://genrage-content-engine.vercel.app/api/dashboard
```

---

**Last Updated**: 2024-03-26
**Version**: 1.0
**Status**: Ready for Deployment
