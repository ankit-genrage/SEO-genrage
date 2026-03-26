import { NextRequest, NextResponse } from 'next/server';
import { query, getContentByStatus } from '../../../lib/db.ts';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    let result;

    if (status) {
      result = await getContentByStatus(status, limit);
    } else {
      result = await query('SELECT * FROM content ORDER BY created_at DESC LIMIT $1', [limit]);
    }

    return NextResponse.json(
      {
        success: true,
        content: result.rows,
        count: result.rows.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await query(
      `INSERT INTO content (title, slug, keyword_id, content_type, intent, body_markdown, body_html, meta_title, meta_description, direct_answer, faq_json, schema_markup, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        body.title,
        body.slug,
        body.keyword_id,
        body.content_type || 'blog_post',
        body.intent,
        body.body_markdown,
        body.body_html,
        body.meta_title,
        body.meta_description,
        body.direct_answer,
        body.faq_json ? JSON.stringify(body.faq_json) : null,
        body.schema_markup ? JSON.stringify(body.schema_markup) : null,
        body.status || 'draft'
      ]
    );

    return NextResponse.json(
      {
        success: true,
        content: result.rows[0]
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create content' },
      { status: 500 }
    );
  }
}
