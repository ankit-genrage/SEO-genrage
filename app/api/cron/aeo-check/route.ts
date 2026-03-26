import { NextRequest, NextResponse } from 'next/server';
import { getKeywords, query, logEngineJob } from '../../../../lib/db.ts';
import { runAEOAudit, getAEOScorecard } from '../../../../lib/aeo.ts';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobStart = Date.now();

  try {
    // Log job start
    await logEngineJob({
      job_type: 'aeo_check',
      status: 'RUNNING'
    });

    // Get top 20 target keywords
    const allKeywords = await getKeywords({ limit: 100 });
    const topKeywords = allKeywords.rows
      .sort((a: any, b: any) => (b.opportunity_score || 0) - (a.opportunity_score || 0))
      .slice(0, 20)
      .map((k: any) => k.keyword);

    if (topKeywords.length === 0) {
      await logEngineJob({
        job_type: 'aeo_check',
        status: 'COMPLETED',
        items_processed: 0,
        details: { message: 'No keywords to check' },
        completed_at: new Date()
      });

      return NextResponse.json(
        { success: true, message: 'No keywords to check', keywordsChecked: 0 },
        { status: 200 }
      );
    }

    // Run AEO audit
    const aeoResults = await runAEOAudit(topKeywords);

    // Store results in database
    for (const result of aeoResults) {
      await query(
        `INSERT INTO aeo_checks (keyword, platform, query_used, response_text, genrage_mentioned, genrage_linked, competitor_mentioned, checked_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          result.keyword,
          result.platform,
          result.query_used,
          result.response_text,
          result.genrage_mentioned,
          result.genrage_linked,
          JSON.stringify(result.competitor_mentioned),
          result.checked_at
        ]
      );

      // If GENRAGE was mentioned, update the content AEO citation count
      if (result.genrage_mentioned) {
        await query(
          `UPDATE content
          SET aeo_citation_count = COALESCE(aeo_citation_count, 0) + 1,
              last_aeo_check = NOW(),
              aeo_platforms = COALESCE(aeo_platforms, '[]'::jsonb) || jsonb_build_array($2)
          WHERE keyword_id IN (SELECT id FROM keywords WHERE keyword = $1)`,
          [result.keyword, result.platform]
        );
      }
    }

    // Generate AEO scorecard
    const scorecard = getAEOScorecard(aeoResults);

    // Log job completion
    await logEngineJob({
      job_type: 'aeo_check',
      status: 'COMPLETED',
      items_processed: aeoResults.length,
      details: {
        keywordsChecked: topKeywords.length,
        checksRun: aeoResults.length,
        citedInAI: scorecard.totalCitations,
        citationRate: Math.round(scorecard.citationRate * 100),
        executionTimeMs: Date.now() - jobStart
      },
      completed_at: new Date()
    });

    return NextResponse.json(
      {
        success: true,
        message: `AEO audit complete: ${scorecard.totalCitations}/${aeoResults.length} mentions found`,
        scorecard,
        stats: {
          keywordsChecked: topKeywords.length,
          checksRun: aeoResults.length,
          citationRate: `${Math.round(scorecard.citationRate * 100)}%`,
          executionTimeMs: Date.now() - jobStart
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('AEO check error:', error);

    await logEngineJob({
      job_type: 'aeo_check',
      status: 'FAILED',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      completed_at: new Date()
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
