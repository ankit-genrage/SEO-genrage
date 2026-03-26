# 🚀 START HERE - GENRAGE Content Engine

**Welcome!** Your SEO+AEO content engine is ready. Choose your path below.

---

## ⚡ I Want to Deploy Now (5-60 minutes)

**Start here**: [`QUICKSTART.md`](./QUICKSTART.md)

- **5 min setup**: Get your 6 credentials ready
- **5 min deployment**: Push to Vercel
- **1 min migration**: Initialize database
- **20 min testing**: Run first jobs
- **Optional 30 min**: Full end-to-end test

**TL;DR**: Gather credentials → Push to GitHub → Connect to Vercel → Add env vars → Done.

---

## 📋 I Want Step-by-Step Instructions

**Read this**: [`DEPLOYMENT.md`](./DEPLOYMENT.md)

Detailed breakdown of:
1. Neon database setup
2. Google Cloud configuration
3. Shopify app creation
4. Vercel deployment
5. Environment variable setup
6. Database migration
7. Initial data seeding
8. Troubleshooting

**Best for**: First-time deployers, detailed learners

---

## ✅ I Want a Checklist to Follow

**Use this**: [`SETUP_CHECKLIST.md`](./SETUP_CHECKLIST.md)

Complete checklist with:
- Pre-deployment verification
- 10 phases with checkboxes
- Environment variable reminders
- Troubleshooting checklist
- Success indicators

**Best for**: Making sure you don't miss anything

---

## 🎯 I Want the Complete Picture

**Read this**: [`PROJECT_SUMMARY.md`](./PROJECT_SUMMARY.md)

Everything you need to know:
- Technology stack
- Project structure
- Feature breakdown
- Cost analysis
- Performance targets
- Security features
- Future enhancements

**Best for**: Understanding the full system

---

## 📖 I Want Full Documentation

**Read this**: [`README.md`](./README.md)

Comprehensive guide including:
- Architecture overview
- API endpoints
- Database schema
- Content generation process
- AEO optimization
- Performance metrics
- Customization guide
- Troubleshooting

**Best for**: Deep technical understanding

---

## 🔧 I Need Command References

**Use this**: [`COMMANDS.md`](./COMMANDS.md)

Copy-paste commands for:
- Generating credentials
- Testing APIs
- Triggering cron jobs
- Monitoring the system
- Troubleshooting
- Batch operations

**Best for**: Quick reference while deploying

---

## 🤖 I Want Interactive Help

**Run this**: `./scripts/setup.sh`

Interactive setup script with:
- Prerequisite checking
- Credential generation
- JSON minification
- Local environment setup
- API testing
- Git initialization

**Best for**: Guided setup experience

---

## 📊 What You Have

```
✅ 50+ Production-ready files
✅ 24 TypeScript files (strict mode)
✅ 6 Automated cron jobs
✅ 15 API endpoints
✅ Complete database schema (10 tables)
✅ Dark mode dashboard UI
✅ 6 Documentation files
✅ Interactive setup script
✅ Command reference guide
```

---

## 🎓 Learning Path

Choose based on your style:

**Visual Learner:**
1. Read `PROJECT_SUMMARY.md` (2 min)
2. Follow `QUICKSTART.md` (15 min)
3. Run `./scripts/setup.sh` (interactive)

**Detail-Oriented:**
1. Read `README.md` (10 min)
2. Follow `DEPLOYMENT.md` (30 min)
3. Use `SETUP_CHECKLIST.md` (10 min)

**Just Get It Done:**
1. Skim `QUICKSTART.md` (2 min)
2. Gather 6 credentials (10 min)
3. Deploy to Vercel (3 min)
4. Add env vars (5 min)
5. Run migration (1 min)

---

## 🚨 If Something Goes Wrong

**Check here first**: [`DEPLOYMENT.md`](./DEPLOYMENT.md) → Troubleshooting section

**Common issues**:
- "Database connection failed" → Check DATABASE_URL
- "GSC data not syncing" → Add service account to GSC property
- "Shopify publishing fails" → Verify write_content scope
- "Claude API errors" → Check API key and credits

**Still stuck?** Run `./scripts/setup.sh` → Option 5 (Test database)

---

## 📱 Dashboard Access

Once deployed:

```
https://genrage-content-engine.vercel.app/
```

You'll see:
- Keyword opportunities
- Content pipeline (draft → review → published)
- Performance metrics
- AEO scorecard
- Engine status

---

## 🔄 What Happens Automatically

Once deployed, the system runs 24/7:

| When | Job | What |
|------|-----|------|
| Sun 12 AM IST | Discover Keywords | Pull GSC data, find opportunities |
| Daily 6:30 AM | Generate Content | Create 2-3 SEO+AEO pieces |
| Daily 7:30 AM | Publish | Push approved content to Shopify |
| Daily 8:30 AM | Sync Performance | Update metrics from GSC + GA4 |
| Wed 9:30 AM | AEO Check | Monitor AI citations |
| Mon 10:30 AM | Refresh Content | Flag underperforming pieces |

(Times converted from IST to UTC for Vercel)

---

## 💰 Cost Preview

**Monthly (at scale):**
- Claude API: ~$200-270
- Neon Database: $15-50
- Vercel: Free
- Google APIs: Free
- **Total: ~$250-320**

(Scales with content volume; estimate based on 3 pieces/day)

---

## 🎯 Success Criteria

You'll know everything is working when:

✅ Health check returns `status: healthy`
✅ Keywords synced from GSC (> 100 keywords)
✅ Dashboard shows keyword count
✅ First content generated (status: review)
✅ Content approved and published to Shopify
✅ Cron jobs running on schedule
✅ Performance metrics updating daily

---

## 📝 Before You Start

### Have These Ready:

1. **Neon account** (https://console.neon.tech/)
2. **Google Cloud account** (https://console.cloud.google.com/)
3. **Shopify store access** (admin.shopify.com)
4. **Anthropic API key** (https://console.anthropic.com/)
5. **GitHub account** (for deploying to Vercel)
6. **Vercel account** (connected to GitHub)

### 6 Credentials to Gather:

1. Neon connection string
2. Google service account JSON (minified)
3. Shopify access token
4. Claude API key
5. Random CRON_SECRET (generate: `openssl rand -hex 32`)
6. Vercel domain name

---

## 🚀 The Fast Track

```bash
# 1. Get Neon connection string
# 2. Create Google service account + minify JSON
# 3. Create Shopify app + get token
# 4. Get Claude API key
# 5. Generate CRON_SECRET: openssl rand -hex 32

# 6. Push code
git init
git add .
git commit -m "initial: genrage content engine"
git push -u origin main

# 7. Deploy to Vercel
# Go to vercel.com → New Project → Select repo → Deploy

# 8. Add environment variables in Vercel Dashboard
# (13 variables, see QUICKSTART.md)

# 9. Run migration
curl -X POST https://genrage-content-engine.vercel.app/api/db/migrate

# 10. Trigger keyword discovery
curl -X GET https://genrage-content-engine.vercel.app/api/cron/discover-keywords \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# 11. Visit dashboard
# https://genrage-content-engine.vercel.app/
```

---

## 📚 Full Documentation Index

| Document | Purpose | Read Time |
|----------|---------|-----------|
| `START_HERE.md` | You are here! | 5 min |
| `QUICKSTART.md` | Fast 60-min setup | 10 min |
| `DEPLOYMENT.md` | Detailed instructions | 20 min |
| `SETUP_CHECKLIST.md` | Step-by-step verification | 30 min |
| `PROJECT_SUMMARY.md` | Complete overview | 15 min |
| `README.md` | Full technical docs | 20 min |
| `COMMANDS.md` | Command reference | 5 min |
| `PROJECT_SUMMARY.md` | Architecture deep-dive | 15 min |

---

## 🆘 Need Help?

1. **Deployment questions?** → `DEPLOYMENT.md`
2. **Setup stuck?** → `SETUP_CHECKLIST.md`
3. **Want to understand the system?** → `PROJECT_SUMMARY.md`
4. **Need command examples?** → `COMMANDS.md`
5. **Want technical details?** → `README.md`
6. **Want interactive help?** → `./scripts/setup.sh`

---

## ⏱️ Time Estimate

- **Reading this page**: 5 minutes
- **Gathering credentials**: 30 minutes
- **Deploying to Vercel**: 5 minutes
- **Running migrations**: 1 minute
- **Testing system**: 10 minutes
- **First content generation**: 2 minutes

**Total**: ~60 minutes for complete deployment

---

## 🎉 You're Ready!

Everything is built and waiting for you:

- ✅ 50+ production-ready files
- ✅ Complete database schema
- ✅ 6 automated cron jobs
- ✅ Dashboard UI
- ✅ API endpoints
- ✅ Comprehensive documentation

**Next step**: Choose your path above and get started!

---

## Quick Links

- **[QUICKSTART](./QUICKSTART.md)** - Start deploying now
- **[DEPLOYMENT](./DEPLOYMENT.md)** - Detailed setup guide
- **[SETUP_CHECKLIST](./SETUP_CHECKLIST.md)** - Verification checklist
- **[PROJECT_SUMMARY](./PROJECT_SUMMARY.md)** - System overview
- **[README](./README.md)** - Full documentation
- **[COMMANDS](./COMMANDS.md)** - Command reference
- **[Setup Script](./scripts/setup.sh)** - Interactive helper

---

**Made with ❤️ for GENRAGE**
*Next.js 14 • Neon Postgres • Claude AI • Shopify • Vercel*

Good luck! 🚀
