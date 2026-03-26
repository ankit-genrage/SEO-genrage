import { Pool } from '@neondatabase/serverless';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  try {
    const result = await getPool().query(text, params);
    return { rows: result.rows || [] };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function getConnection() {
  return { query };
}

// Specific query helpers
export async function getKeywords(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  let whereClause = '1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.status) {
    whereClause += ` AND status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  const limit = filters?.limit || 100;
  const offset = filters?.offset || 0;

  const result = await query(
    `SELECT * FROM keywords WHERE ${whereClause} ORDER BY opportunity_score DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return result;
}

export async function getContentByStatus(status: string, limit = 10) {
  const result = await query(
    'SELECT * FROM content WHERE status = $1 ORDER BY updated_at DESC LIMIT $2',
    [status, limit]
  );
  return result;
}

export async function insertKeyword(keyword: {
  keyword: string;
  source: string;
  search_volume?: number;
  current_position?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  intent?: string;
  difficulty_score?: number;
  relevance_score?: number;
  opportunity_score?: number;
}) {
  const result = await query(
    `INSERT INTO keywords (
      keyword, source, search_volume, current_position, impressions, clicks, ctr, intent, difficulty_score, relevance_score, opportunity_score
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (keyword) DO UPDATE SET
      source = EXCLUDED.source,
      current_position = COALESCE(EXCLUDED.current_position, keywords.current_position),
      impressions = COALESCE(EXCLUDED.impressions, keywords.impressions),
      clicks = COALESCE(EXCLUDED.clicks, keywords.clicks),
      ctr = COALESCE(EXCLUDED.ctr, keywords.ctr),
      updated_at = NOW()
    RETURNING *`,
    [
      keyword.keyword,
      keyword.source,
      keyword.search_volume,
      keyword.current_position,
      keyword.impressions,
      keyword.clicks,
      keyword.ctr,
      keyword.intent,
      keyword.difficulty_score,
      keyword.relevance_score,
      keyword.opportunity_score
    ]
  );

  return result.rows[0];
}

export async function insertContent(content: {
  title: string;
  slug: string;
  keyword_id: number;
  content_type: string;
  intent?: string;
  body_markdown?: string;
  body_html?: string;
  meta_title?: string;
  meta_description?: string;
  direct_answer?: string;
  faq_json?: any;
  schema_markup?: any;
  entity_mentions?: any;
}) {
  const result = await query(
    `INSERT INTO content (
      title, slug, keyword_id, content_type, intent, body_markdown, body_html,
      meta_title, meta_description, direct_answer, faq_json, schema_markup, entity_mentions
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      content.title,
      content.slug,
      content.keyword_id,
      content.content_type,
      content.intent,
      content.body_markdown,
      content.body_html,
      content.meta_title,
      content.meta_description,
      content.direct_answer,
      content.faq_json ? JSON.stringify(content.faq_json) : null,
      content.schema_markup ? JSON.stringify(content.schema_markup) : null,
      content.entity_mentions ? JSON.stringify(content.entity_mentions) : null
    ]
  );

  return result.rows[0];
}

export async function updateContent(
  id: number,
  updates: Record<string, any>
) {
  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;
    setClauses.push(`${key} = $${paramIndex}`);
    if (typeof value === 'object' && value !== null) {
      values.push(JSON.stringify(value));
    } else {
      values.push(value);
    }
    paramIndex++;
  }

  if (setClauses.length === 0) return null;

  values.push(id);
  const result = await query(
    `UPDATE content SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0];
}

export async function logEngineJob(job: {
  job_type: string;
  status: string;
  items_processed?: number;
  details?: any;
  error_message?: string;
  completed_at?: Date;
}) {
  const result = await query(
    `INSERT INTO engine_log (job_type, status, items_processed, details, error_message, completed_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      job.job_type,
      job.status,
      job.items_processed,
      job.details ? JSON.stringify(job.details) : null,
      job.error_message,
      job.completed_at
    ]
  );

  return result.rows[0];
}

export async function getQueuedContent(limit = 3) {
  const result = await query(
    `SELECT cq.*, k.keyword FROM content_queue cq
    JOIN keywords k ON cq.keyword_id = k.id
    WHERE cq.status = 'pending'
    ORDER BY cq.priority DESC, cq.created_at ASC
    LIMIT $1`,
    [limit]
  );
  return result;
}

export async function updateQueueStatus(id: number, status: string) {
  const result = await query(
    'UPDATE content_queue SET status = $1, processed_at = NOW() WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0];
}
