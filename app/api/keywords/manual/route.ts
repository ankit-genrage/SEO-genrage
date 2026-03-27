import { NextRequest, NextResponse } from 'next/server';
import { insertKeyword, query } from '../../../../lib/db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, intent = 'informational', search_volume = 0 } = body;

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { error: 'Keyword is required and must be a string' },
        { status: 400 }
      );
    }

    const trimmedKeyword = keyword.trim().toLowerCase();

    if (trimmedKeyword.length === 0) {
      return NextResponse.json(
        { error: 'Keyword cannot be empty' },
        { status: 400 }
      );
    }

    // Check if keyword already exists
    const existingResult = await query(
      'SELECT * FROM keywords WHERE keyword = $1',
      [trimmedKeyword]
    );

    if (existingResult.rows && existingResult.rows.length > 0) {
      return NextResponse.json(
        { 
          error: 'Keyword already exists',
          keyword: existingResult.rows[0]
        },
        { status: 409 }
      );
    }

    // Insert the keyword
    const newKeyword = await insertKeyword({
      keyword: trimmedKeyword,
      source: 'manual',
      search_volume: parseInt(search_volume) || 0,
      current_position: 999,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      intent: intent.toLowerCase(),
      difficulty_score: 50,
      relevance_score: 70,
      opportunity_score: 60
    });

    return NextResponse.json({
      success: true,
      message: 'Keyword created successfully',
      keyword: newKeyword
    });
  } catch (error) {
    console.error('Manual keyword creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get all manual keywords
    const result = await query(
      'SELECT * FROM keywords WHERE source = $1 ORDER BY created_at DESC LIMIT 50',
      ['manual']
    );

    return NextResponse.json({
      success: true,
      keywords: result.rows || [],
      count: (result.rows || []).length
    });
  } catch (error) {
    console.error('Fetch manual keywords error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
