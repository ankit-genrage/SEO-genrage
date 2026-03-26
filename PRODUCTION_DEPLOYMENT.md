# Production Deployment - GENRAGE Content Engine

**Status**: ✅ Code ready for production
**Git Status**: ✅ Repository initialized with initial commit
**Next**: Push to GitHub → Deploy to Vercel → Add credentials

---

## Pre-Deployment Checklist

Before you start, have these credentials ready:

- [ ] **Neon Connection String** - `postgresql://user:pass@host/db`
- [ ] **GSC Service Account JSON** (minified to single line)
- [ ] **GA4 Service Account JSON** (minified to single line)
- [ ] **Shopify Store Name** - `yourstore.myshopify.com`
- [ ] **Shopify Access Token** - `shpat_xxxxx`
- [ ] **Claude API Key** - `sk-ant-xxxxx`
- [ ] **Cron Secret** - Generate: `openssl rand -hex 32`
- [ ] **Optional: Perplexity API Key** - `pplx_xxxxx`

---

## Step 1: Create GitHub Repository

```bash
# Go to https://github.com/new
# Create repository: "genrage-content-engine"
# DON'T initialize with README (we have one)
# Click "Create repository"
```

## Step 2: Push Code to GitHub

```bash
cd /Users/ankit_genrage/SEO_genrage

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/genrage-content-engine.git
git branch -M main

# Push to GitHub
git push -u origin main

# Verify
git remote -v
# Should show: origin https://github.com/YOUR_USERNAME/genrage-content-engine.git
```

## Step 3: Deploy to Vercel

**Option A: Via Dashboard (Easiest)**

1. Go to https://vercel.com/
2. Click "Add New..." → "Project"
3. Select GitHub account (authorize if needed)
4. Search for and select `genrage-content-engine`
5. Configure project:
   - Framework Preset: `Next.js`
   - Root Directory: `./` (default)
6. Click "Deploy"

Wait for deployment to complete (usually 2-5 minutes).

**Option B: Via Vercel CLI**

```bash
npm i -g vercel

cd /Users/ankit_genrage/SEO_genrage

# Login to Vercel
vercel login

# Link project
vercel link
# Follow prompts, select to create new project

# Deploy to production
vercel deploy --prod
```

**Note the domain**: After deployment, you'll get a URL like `genrage-content-engine.vercel.app`

---

## Step 4: Add Environment Variables

**CRITICAL**: All 13 environment variables must be set in Vercel before anything works.

### Go to Vercel Dashboard

1. Select project: `genrage-content-engine`
2. Click "Settings" tab
3. Click "Environment Variables" in left sidebar
4. Add each variable for "Production" environment

### Required Variables (13 total)

Paste these one at a time. Replace values with your actual credentials:

#### 1. Database
```
Name: DATABASE_URL
Value: postgresql://[user]:[password]@[host]/genrage_content_engine?sslmode=require
Environment: Production
```

#### 2-3. Google Search Console
```
Name: GSC_SERVICE_ACCOUNT_JSON
Value: {"type":"service_account","project_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
Environment: Production
(Make sure it's minified - single line, no newlines)

Name: GSC_SITE_URL
Value: https://genrage.com
Environment: Production
```

#### 4-5. GA4
```
Name: GA4_PROPERTY_ID
Value: 401864026
Environment: Production

Name: GA4_SERVICE_ACCOUNT_JSON
Value: {"type":"service_account",...}
Environment: Production
(Same format as GSC - minified, single line)
```

#### 6-8. Shopify
```
Name: SHOPIFY_STORE
Value: gen-rage-clothing.myshopify.com
Environment: Production

Name: SHOPIFY_ACCESS_TOKEN
Value: shpat_xxxxx
Environment: Production

Name: SHOPIFY_API_VERSION
Value: 2024-10
Environment: Production
```

#### 9. Claude API
```
Name: ANTHROPIC_API_KEY
Value: sk-ant-xxxxx
Environment: Production
```

#### 10. Security
```
Name: CRON_SECRET
Value: [your 32-char random secret]
Environment: Production
```

#### 11. Optional - AEO Checking
```
Name: PERPLEXITY_API_KEY
Value: pplx_xxxxx
Environment: Production
(Optional - only add if you have it)
```

---

## Step 5: Verify Deployment

After adding all env vars, click "Deploy" on the project dashboard (or trigger a redeployment):

```bash
git commit --allow-empty -m "trigger: production deployment"
git push origin main
```

Wait 2-5 minutes for deployment.

---

## Step 6: Health Check

Once deployed, verify the system is alive:

```bash
# Replace with your actual domain
DOMAIN=genrage-content-engine.vercel.app

# Test health
curl https://${DOMAIN}/api/health

# Expected response:
# {
#   "status": "healthy",
#   "checks": {
#     "database": "ok",
#     "timestamp": "...",
#     "environment": {
#       "hasGSCServiceAccount": true,
#       "hasGA4ServiceAccount": true,
#       "hasShopifyToken": true,
#       "hasAnthropicKey": true,
#       "hasCronSecret": true
#     }
#   }
# }
```

If you see `"status": "unhealthy"`, check:
- All env vars are set correctly
- No typos in credentials
- JSON files are minified (single line)

---

## Step 7: Initialize Database

Run the migration to create all tables:

```bash
DOMAIN=genrage-content-engine.vercel.app

curl -X POST https://${DOMAIN}/api/db/migrate

# Expected:
# {
#   "success": true,
#   "message": "Successfully executed 11 migration statements"
# }
```

---

## Step 8: Seed Initial Keywords

Trigger the first keyword discovery from Google Search Console:

```bash
DOMAIN=genrage-content-engine.vercel.app
CRON_SECRET=your-32-char-secret

curl -X GET https://${DOMAIN}/api/cron/discover-keywords \
  -H "Authorization: Bearer ${CRON_SECRET}"

# Expected:
# {
#   "success": true,
#   "message": "Discovered X new keywords, queued X for content",
#   "stats": {
#     "totalQueriesProcessed": 500,
#     "newKeywords": 42,
#     "queued": 10
#   }
# }
```

---

## Step 9: Visit Dashboard

Open your dashboard in browser:

```
https://genrage-content-engine.vercel.app/
```

You should see:
- ✅ Keywords count (50+)
- ✅ Content pipeline (empty, waiting for generation)
- ✅ Engine logs showing successful discovery job
- ✅ No errors in console

---

## Step 10: Test Full Pipeline (Optional)

Generate first batch of content:

```bash
DOMAIN=genrage-content-engine.vercel.app
CRON_SECRET=your-32-char-secret

# Generate content
curl -X GET https://${DOMAIN}/api/cron/generate-content \
  -H "Authorization: Bearer ${CRON_SECRET}"

# Should return something like:
# {
#   "success": true,
#   "message": "Generated 3 content pieces",
#   "generated": [
#     {"id": 1, "title": "...", "keyword": "...", "status": "review"},
#     ...
#   ]
# }
```

Check dashboard - you should see "3" in the "In Review" metric.

---

## Production Status Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] All 13 env vars added
- [ ] Health check returns "healthy"
- [ ] Database migration successful (11 statements)
- [ ] Keywords discovered (50+)
- [ ] Dashboard loads without errors
- [ ] Optional: First content generated

---

## Automated Jobs Running

Once deployed, these run automatically on schedule:

| Time (IST) | Job | Status |
|-----------|-----|--------|
| Sun 12:00 AM | Discover Keywords | ✅ Runs weekly |
| Daily 6:30 AM | Generate Content | ✅ Runs daily |
| Daily 7:30 AM | Publish | ✅ Runs daily |
| Daily 8:30 AM | Sync Performance | ✅ Runs daily |
| Wed 9:30 AM | AEO Check | ✅ Runs weekly |
| Mon 10:30 AM | Refresh Content | ✅ Runs weekly |

You can verify in Vercel dashboard → Crons tab.

---

## Monitoring

### Daily
- Visit dashboard: `https://genrage-content-engine.vercel.app/`
- Check for new keywords
- Review content in "review" status
- Approve/reject as needed

### Via Vercel Dashboard
- Settings → Deployments: See deployment history
- Analytics: Monitor API usage
- Logs: Check for errors
- Crons: Verify jobs are running

### Via API
```bash
# Get dashboard stats
curl https://your-domain.vercel.app/api/dashboard | jq .

# Get keywords
curl "https://your-domain.vercel.app/api/keywords?limit=10" | jq '.keywords[] | {keyword, opportunity_score}'

# Get content in review
curl "https://your-domain.vercel.app/api/content?status=review" | jq '.content[] | {id, title}'
```

---

## Troubleshooting

### Health check shows "unhealthy"

```bash
# Check which env vars are missing
curl https://your-domain.vercel.app/api/health | jq '.checks.environment'

# Add missing ones to Vercel Settings → Environment Variables
# Then redeploy: git commit --allow-empty -m "trigger" && git push
```

### Database migration fails

- Verify DATABASE_URL is correct
- Check Neon dashboard that database exists
- Retry migration: `curl -X POST https://your-domain/api/db/migrate`

### GSC not returning keywords

- Verify service account email is added to GSC property (as Owner)
- Check GSC_SITE_URL matches your verified property
- Wait 5 minutes and try again (GSC API can be slow)

### Cron jobs not running

- Go to Vercel → Crons tab
- Verify 6 jobs are listed
- Wait for scheduled time (they run on UTC schedule)
- Check logs for errors: Vercel dashboard → Logs

---

## Next Steps

1. **Day 1**: Deploy, run migration, seed keywords
2. **Day 2**: Generate first content batch, review in dashboard
3. **Day 3**: Approve content, trigger publish job
4. **Day 7+**: Monitor dashboard, let crons automate
5. **Week 2**: Review performance metrics, adjust scoring if needed
6. **Month 1**: Monitor ROI, assess content quality, scale volume

---

## Support

If you get stuck:

1. Check `QUICKSTART.md` - fast setup guide
2. Check `DEPLOYMENT.md` - detailed instructions
3. Check `COMMANDS.md` - command examples
4. Run `./scripts/setup.sh` - interactive troubleshooting

---

## Production URLs

Once deployed:

- **Dashboard**: `https://genrage-content-engine.vercel.app/`
- **API Base**: `https://genrage-content-engine.vercel.app/api/`
- **Health**: `https://genrage-content-engine.vercel.app/api/health`
- **Keywords**: `https://genrage-content-engine.vercel.app/api/keywords`
- **Content**: `https://genrage-content-engine.vercel.app/api/content`
- **Dashboard Data**: `https://genrage-content-engine.vercel.app/api/dashboard`

---

## Cost Tracking

In Vercel dashboard → Settings → Billing:
- Monitor Vercel costs (usually free)
- Track function invocations
- Set budget alerts

Monitor Claude API costs at:
- https://console.anthropic.com/account/usage

---

**Status**: ✅ Ready for production deployment

**Ready to deploy? Get your credentials and follow Steps 1-10 above.**

Once you have credentials, it's just:
1. Push to GitHub (1 min)
2. Deploy on Vercel (5 min)
3. Add env vars (5 min)
4. Run migration (1 min)
5. Test (5 min)

**Total time to live**: ~15-20 minutes

---

Made with ❤️ for GENRAGE
