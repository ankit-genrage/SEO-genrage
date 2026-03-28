import { NextRequest, NextResponse } from 'next/server';
import { insertKeyword, query } from '../../../../lib/db';

export const runtime = 'nodejs';

interface BulkKeywordInput {
  keyword: string;
  intent?: string;
  search_volume?: number;
  difficulty?: number;
}

interface BulkResult {
  total: number;
  created: number;
  duplicates: number;
  errors: number;
  details: Array<{
    keyword: string;
    status: 'created' | 'duplicate' | 'error';
    message?: string;
    data?: any;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keywords } = body;

    if (!Array.isArray(keywords)) {
      return NextResponse.json(
        { error: 'Keywords must be an array' },
        { status: 400 }
      );
    }

    if (keywords.length === 0) {
      return NextResponse.json(
        { error: 'At least one keyword is required' },
        { status: 400 }
      );
    }

    if (keywords.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 keywords per request' },
        { status: 400 }
      );
    }

    const result: BulkResult = {
      total: keywords.length,
      created: 0,
      duplicates: 0,
      errors: 0,
      details: []
    };

    console.log(`🔄 Bulk importing ${keywords.length} keywords...`);

    for (const item of keywords) {
      try {
        const { keyword, intent = 'informational', search_volume = 0, difficulty = 50 } = item as BulkKeywordInput;

        // Validate keyword
        if (!keyword || typeof keyword !== 'string') {
          result.errors++;
          result.details.push({
            keyword: item.keyword || 'invalid',
            status: 'error',
            message: 'Keyword is required and must be a string'
          });
          continue;
        }

        const trimmedKeyword = keyword.trim().toLowerCase();

        if (trimmedKeyword.length === 0) {
          result.errors++;
          result.details.push({
            keyword: keyword,
            status: 'error',
            message: 'Keyword cannot be empty'
          });
          continue;
        }

        // Check if keyword already exists
        const existingResult = await query(
          'SELECT * FROM keywords WHERE keyword = $1',
          [trimmedKeyword]
        );

        if (existingResult.rows && existingResult.rows.length > 0) {
          result.duplicates++;
          result.details.push({
            keyword: trimmedKeyword,
            status: 'duplicate',
            message: 'Keyword already exists',
            data: existingResult.rows[0]
          });
          continue;
        }

        // Insert the keyword
        const newKeyword = await insertKeyword({
          keyword: trimmedKeyword,
          source: 'manual',
          search_volume: parseInt(String(search_volume)) || 0,
          current_position: 999,
          impressions: 0,
          clicks: 0,
          ctr: 0,
          intent: intent.toLowerCase(),
          difficulty_score: difficulty,
          relevance_score: 70,
          opportunity_score: 60
        });

        result.created++;
        result.details.push({
          keyword: trimmedKeyword,
          status: 'created',
          data: newKeyword
        });

        console.log(`✅ Created: ${trimmedKeyword}`);
      } catch (error) {
        result.errors++;
        result.details.push({
          keyword: item.keyword || 'unknown',
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`❌ Error with keyword ${item.keyword}:`, error);
      }
    }

    console.log(`📊 Bulk import complete: ${result.created} created, ${result.duplicates} duplicates, ${result.errors} errors`);

    return NextResponse.json({
      success: true,
      message: `Bulk import complete: ${result.created} created, ${result.duplicates} duplicates, ${result.errors} errors`,
      result
    });
  } catch (error) {
    console.error('Bulk keyword import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
