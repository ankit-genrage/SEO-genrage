import { NextRequest, NextResponse } from 'next/server';
import { getKeywords, insertKeyword } from '../../../lib/db.ts';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const keywords = await getKeywords({
      status: status || undefined,
      limit,
      offset
    });

    return NextResponse.json(
      {
        success: true,
        keywords: keywords.rows,
        count: keywords.rows.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching keywords:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch keywords' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await insertKeyword({
      keyword: body.keyword,
      source: body.source || 'manual',
      search_volume: body.search_volume,
      current_position: body.current_position,
      impressions: body.impressions,
      clicks: body.clicks,
      ctr: body.ctr,
      intent: body.intent,
      difficulty_score: body.difficulty_score,
      relevance_score: body.relevance_score,
      opportunity_score: body.opportunity_score
    });

    return NextResponse.json(
      {
        success: true,
        keyword: result
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating keyword:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create keyword' },
      { status: 500 }
    );
  }
}
