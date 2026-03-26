-- Keywords discovered and tracked
CREATE TABLE IF NOT EXISTS keywords (
  id SERIAL PRIMARY KEY,
  keyword TEXT NOT NULL UNIQUE,
  source VARCHAR(50) NOT NULL,
  search_volume INTEGER,
  current_position REAL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr REAL DEFAULT 0,
  intent VARCHAR(30),
  difficulty_score REAL,
  relevance_score REAL,
  opportunity_score REAL,
  status VARCHAR(30) DEFAULT 'discovered',
  content_id INTEGER,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content pieces generated and published
CREATE TABLE IF NOT EXISTS content (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  keyword_id INTEGER REFERENCES keywords(id),
  content_type VARCHAR(30) NOT NULL,
  intent VARCHAR(30),
  status VARCHAR(30) DEFAULT 'draft',
  body_markdown TEXT,
  body_html TEXT,
  meta_title TEXT,
  meta_description TEXT,
  direct_answer TEXT,
  faq_json JSONB,
  schema_markup JSONB,
  entity_mentions JSONB,
  shopify_blog_id TEXT,
  shopify_article_id TEXT,
  shopify_published_at TIMESTAMPTZ,
  organic_sessions_30d INTEGER DEFAULT 0,
  organic_atc_30d INTEGER DEFAULT 0,
  organic_purchases_30d INTEGER DEFAULT 0,
  avg_position REAL,
  impressions_30d INTEGER DEFAULT 0,
  clicks_30d INTEGER DEFAULT 0,
  aeo_citation_count INTEGER DEFAULT 0,
  last_aeo_check TIMESTAMPTZ,
  aeo_platforms JSONB,
  model_used VARCHAR(50),
  generation_prompt TEXT,
  generation_cost REAL,
  human_edited BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  last_refreshed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance snapshots over time
CREATE TABLE IF NOT EXISTS content_performance (
  id SERIAL PRIMARY KEY,
  content_id INTEGER REFERENCES content(id) NOT NULL,
  snapshot_date DATE NOT NULL,
  organic_sessions INTEGER DEFAULT 0,
  organic_atc INTEGER DEFAULT 0,
  organic_purchases INTEGER DEFAULT 0,
  avg_position REAL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr REAL DEFAULT 0,
  aeo_citations INTEGER DEFAULT 0,
  UNIQUE(content_id, snapshot_date)
);

-- AEO monitoring results
CREATE TABLE IF NOT EXISTS aeo_checks (
  id SERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  platform VARCHAR(30) NOT NULL,
  query_used TEXT NOT NULL,
  response_text TEXT,
  genrage_mentioned BOOLEAN DEFAULT FALSE,
  genrage_linked BOOLEAN DEFAULT FALSE,
  competitor_mentioned TEXT[],
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitor content tracking
CREATE TABLE IF NOT EXISTS competitor_content (
  id SERIAL PRIMARY KEY,
  competitor_name VARCHAR(100) NOT NULL,
  competitor_url TEXT NOT NULL,
  page_url TEXT NOT NULL UNIQUE,
  title TEXT,
  keywords TEXT[],
  estimated_traffic INTEGER,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_checked_at TIMESTAMPTZ
);

-- Content generation queue
CREATE TABLE IF NOT EXISTS content_queue (
  id SERIAL PRIMARY KEY,
  keyword_id INTEGER REFERENCES keywords(id) NOT NULL,
  priority INTEGER DEFAULT 50,
  content_type VARCHAR(30) NOT NULL,
  content_brief JSONB,
  status VARCHAR(30) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Engine run log
CREATE TABLE IF NOT EXISTS engine_log (
  id SERIAL PRIMARY KEY,
  job_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'RUNNING',
  items_processed INTEGER DEFAULT 0,
  details JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_keywords_status ON keywords(status);
CREATE INDEX IF NOT EXISTS idx_keywords_opportunity ON keywords(opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_keywords_position ON keywords(current_position);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_keyword ON content(keyword_id);
CREATE INDEX IF NOT EXISTS idx_content_perf_date ON content_performance(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_content_perf_content ON content_performance(content_id);
CREATE INDEX IF NOT EXISTS idx_aeo_keyword ON aeo_checks(keyword);
CREATE INDEX IF NOT EXISTS idx_aeo_platform ON aeo_checks(platform);
CREATE INDEX IF NOT EXISTS idx_queue_status ON content_queue(status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_engine_log_type ON engine_log(job_type, started_at DESC);
