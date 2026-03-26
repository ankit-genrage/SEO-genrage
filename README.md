# GENRAGE Content Engine

Automated SEO + AEO content generation engine for GENRAGE, powered by Claude AI, Google Search Console, GA4, and Shopify.

## Overview

This system automatically:

1. **Discovers keywords** from Google Search Console and AI suggestions
2. **Generates SEO+AEO optimized content** using Claude API
3. **Publishes content** to your Shopify blog
4. **Tracks performance** via GSC, GA4, and AEO monitoring
5. **Refreshes underperforming content** automatically

## Architecture

- **Frontend**: Next.js 14 App Router with React
- **Backend**: Next.js API routes (serverless)
- **Database**: Neon Postgres (Singapore region)
- **APIs**: Google Search Console, GA4, Shopify Admin, Anthropic Claude
- **Scheduling**: Vercel Cron Jobs (6 automated jobs)

## Setup Instructions

### 1. Prerequisites

- Neon Postgres account (Singapore region)
- Vercel account connected to GitHub
- Google Cloud Service Account with Search Console + Analytics APIs
- Shopify store with Admin API access
- Anthropic API key (Claude)
- Optional: Perplexity API key for AEO checking

### 2. Database Setup

Create a new Neon project called `genrage-content-engine`:

```bash
# Get connection string from Neon dashboard
# Format: postgresql://user:password@region.neon.tech/genrage-content-engine
```

### 3. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

**Required:**
- `DATABASE_URL` - Neon connection string
- `GSC_SERVICE_ACCOUNT_JSON` - Google service account (JSON minified, single line)
- `GA4_PROPERTY_ID` - Your GA4 property ID
- `GA4_SERVICE_ACCOUNT_JSON` - Same or separate Google service account
- `SHOPIFY_STORE` - Your store: `yourstoure.myshopify.com`
- `SHOPIFY_ACCESS_TOKEN` - Admin API token (needs `write_content` scope)
- `ANTHROPIC_API_KEY` - Claude API key
- `CRON_SECRET` - Random secret string for Vercel cron protection

**Optional:**
- `PERPLEXITY_API_KEY` - For Perplexity AEO checks

### 4. Installation & Deployment

```bash
# Install dependencies
npm install

# Deploy to Vercel
vercel deploy

# Set environment variables in Vercel dashboard
vercel env add DATABASE_URL
vercel env add GSC_SERVICE_ACCOUNT_JSON
# ... add all env vars

# Deploy production
vercel deploy --prod
```

### 5. Database Migration

After first deployment, run the migration:

```bash
curl -X POST https://your-domain.vercel.app/api/db/migrate
```

Or via Vercel dashboard webhook/cron.

### 6. Initial Keyword Discovery

Manually trigger keyword discovery to seed the database:

```bash
curl -X GET https://your-domain.vercel.app/api/cron/discover-keywords \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## File Structure

```
genrage-content-engine/
├── app/
│   ├── api/
│   │   ├── db/migrate/route.ts          # Run migrations
│   │   ├── health/route.ts              # Health check
│   │   ├── cron/
│   │   │   ├── discover-keywords/       # Weekly keyword sync
│   │   │   ├── generate-content/        # Daily content generation
│   │   │   ├── publish/                 # Daily publishing
│   │   │   ├── sync-performance/        # Daily performance sync
│   │   │   ├── aeo-check/               # Weekly AEO audit
│   │   │   └── refresh-content/         # Weekly content refresh
│   │   ├── content/                     # Content CRUD
│   │   ├── keywords/                    # Keywords CRUD
│   │   └── dashboard/                   # Dashboard data API
│   ├── page.tsx                         # Dashboard UI
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── db.ts                            # Neon database wrapper
│   ├── gsc.ts                           # Google Search Console client
│   ├── ga4.ts                           # GA4 Analytics client
│   ├── shopify.ts                       # Shopify Admin API client
│   ├── claude.ts                        # Anthropic Claude wrapper
│   ├── aeo.ts                           # AEO checker (AI platforms)
│   ├── scoring.ts                       # Keyword/content scoring
│   ├── schema-generator.ts              # JSON-LD schema markup
│   └── content-templates.ts             # Content templates & prompts
├── db/
│   └── migrations/
│       └── 001_initial_schema.sql       # Database schema
├── package.json
├── tsconfig.json
├── next.config.js
├── vercel.json                          # Cron schedule
├── .env.local.example
├── .gitignore
└── README.md
```

## Cron Jobs Schedule

All times converted from IST (India Standard Time) to UTC for Vercel:

| Job | Schedule | Time (IST) | Time (UTC) |
|-----|----------|-----------|-----------|
| Discover Keywords | `30 18 * * 0` | Sun 12:00 AM | Sat 6:30 PM |
| Generate Content | `0 1 * * *` | Daily 6:30 AM | Daily 1:00 AM |
| Publish | `0 2 * * *` | Daily 7:30 AM | Daily 2:00 AM |
| Sync Performance | `0 3 * * *` | Daily 8:30 AM | Daily 3:00 AM |
| AEO Check | `0 4 * * 3` | Wed 9:30 AM | Wed 4:00 AM |
| Refresh Content | `0 5 * * 1` | Mon 10:30 AM | Mon 5:00 AM |

## API Endpoints

### Health & Admin

- `GET /api/health` - System health check
- `POST /api/db/migrate` - Run database migrations

### Content Management

- `GET /api/content` - List content
- `POST /api/content` - Create content
- `GET /api/content/[id]` - Get content
- `PATCH /api/content/[id]` - Update content
- `POST /api/content/approve` - Approve content for publishing

### Keywords

- `GET /api/keywords` - List keywords
- `POST /api/keywords` - Add keyword

### Dashboard

- `GET /api/dashboard` - Dashboard stats and data

### Cron Jobs (require `Authorization: Bearer CRON_SECRET`)

- `GET /api/cron/discover-keywords`
- `GET /api/cron/generate-content`
- `GET /api/cron/publish`
- `GET /api/cron/sync-performance`
- `GET /api/cron/aeo-check`
- `GET /api/cron/refresh-content`

## Database Schema

### Core Tables

- **keywords** - Discovered and tracked keywords from GSC
- **content** - Generated blog posts and pages
- **content_performance** - Daily performance snapshots
- **content_queue** - Queue for content generation
- **aeo_checks** - AEO monitoring results
- **engine_log** - Cron job execution logs
- **competitor_content** - Competitor tracking (optional)

## Content Generation Process

1. **Keyword Discovery** → GSC queries synced weekly
2. **Opportunity Scoring** → Based on volume, position, relevance, difficulty
3. **Brief Generation** → Claude generates content brief
4. **Content Generation** → Claude writes full content (AEO-optimized)
5. **Schema Markup** → JSON-LD generated automatically
6. **Manual Review** → Content flagged as "review" status
7. **Approval** → Admin approves via dashboard
8. **Publishing** → Pushed to Shopify blog automatically
9. **Performance Tracking** → GSC + GA4 metrics synced daily
10. **Auto-Refresh** → Low-performing content auto-queued for refresh

## Brand Voice & Content Quality

All content is generated with GENRAGE brand guidelines:

- **Minimal, no fluff** - Every word earns its place
- **Streetwear culture focused** - Raw, real, underground energy
- **Indian context** - Speaks to Indian streetwear heads
- **AEO-first** - Direct answer blocks for AI extraction
- **Human-first** - Written for humans, optimized for AI crawlers

## AEO (AI Engine Optimization)

Monitors mentions of GENRAGE across AI platforms:

- **Claude** (via API)
- **Perplexity** (via API, if key provided)
- **Google AI Overview** (semi-manual for now)

Tracks:
- How many target keywords cite GENRAGE
- Citation rate across platforms
- Linked vs. mentioned citations
- Competitor appearances in responses

## Performance Metrics

### Keyword Metrics

- Search volume (estimated)
- Current Google position
- Impressions (30-day)
- Clicks (30-day)
- CTR (click-through rate)
- Opportunity score (0-100)

### Content Metrics

- Organic sessions (30-day)
- Average position
- Impressions & clicks
- Conversion rate
- AEO citation count
- Health score (0-100)

### Health Score Formula

```
health = (sessions_trend * 0.3) +
         (position_trend * 0.25) +
         (conversion_rate * 0.25) +
         (aeo_citations * 0.2)
```

Content with health < 30 after 60 days auto-queues for refresh.

## Customization

### Change Content Style

Edit `lib/content-templates.ts` and `lib/claude.ts` system prompt.

### Adjust Cron Schedule

Edit `vercel.json` with valid cron expressions.

### Add New Data Sources

- Extend `lib/gsc.ts` for more GSC queries
- Add more GA4 dimensions in `lib/ga4.ts`
- Integrate additional APIs in corresponding `lib/*.ts` files

### Change Scoring Logic

Edit `lib/scoring.ts` functions:
- `calculateOpportunityScore()`
- `calculateContentHealthScore()`
- `shouldRefreshContent()`

## Cost Estimates

**Monthly costs (rough):**

- Neon Postgres: $15-50
- Vercel: Free-$20 (depending on bandwidth)
- Claude API: $2-10 (depends on content volume; 3 pieces/day ≈ $180-270/month)
- Google APIs: Free (first 10,000 requests/day)
- Shopify: Included in your Shopify plan

**Total: ~$50-150/month depending on scale**

## Troubleshooting

### Migrations fail

```bash
# Check database connection
curl https://your-domain.vercel.app/api/health
```

### Content not generating

- Check ANTHROPIC_API_KEY is set
- Check API quotas in Vercel logs
- Verify DATABASE_URL is correct

### GSC/GA4 not syncing

- Verify service account email has access to GSC property
- Check GA4 property ID is correct
- Ensure service account has Analytics read permissions

### Shopify publishing fails

- Verify SHOPIFY_ACCESS_TOKEN has `write_content` scope
- Check store name format: `yourstor.myshopify.com`
- Check API version in .env matches Shopify admin API

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Run migrations
3. ✅ Trigger keyword discovery
4. ✅ Review and approve first batch of content
5. ✅ Let crons take over (they'll run on schedule)
6. 📊 Monitor dashboard daily
7. 🔄 Adjust scoring weights based on actual performance
8. 🚀 Add more content types (guides, collections, landing pages)

## Support

For issues or questions:

- Check Vercel deployment logs
- Review database directly via Neon console
- Test API endpoints manually with curl
- Check environment variables in Vercel dashboard

---

**Made for GENRAGE by Claude** | Next.js 14 | Neon Postgres | Claude AI
