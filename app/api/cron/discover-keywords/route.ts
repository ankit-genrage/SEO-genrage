import { NextRequest, NextResponse } from 'next/server';
import { getTopQueries } from '../../../../lib/gsc.ts';
import { classifyIntent, suggestRelatedKeywords } from '../../../../lib/groq';
import { calculateOpportunityScore } from '../../../../lib/scoring.ts';
import {
  insertKeyword,
  getKeywords,
  query,
  logEngineJob
} from '../../../../lib/db.ts';

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
    const jobLog = await logEngineJob({
      job_type: 'keyword_discovery',
      status: 'RUNNING'
    });

    // Debug: Check environment variables
    console.log('🔍 DEBUG: GSC_SITE_URL =', process.env.GSC_SITE_URL);
    console.log('🔍 DEBUG: GSC_SERVICE_ACCOUNT has email:', process.env.GSC_SERVICE_ACCOUNT_JSON ? 'YES' : 'NO');

    // Get top queries from GSC
    console.log('📡 Attempting to fetch top queries from GSC...');
    const topQueries = await getTopQueries(28, 500);
    console.log('✅ Successfully fetched', topQueries.length, 'top queries from GSC');

    // Get existing keywords
    const existingKeywords = await getKeywords();
    const existingKeywordSet = new Set(existingKeywords.rows.map((k: any) => k.keyword));

    // Insert/update keywords
    let newKeywordsCount = 0;

    for (const query of topQueries) {
      const isNew = !existingKeywordSet.has(query.query);

      // Classify intent for new keywords
      const intent = await classifyIntent(query.query);

      // Calculate opportunity score (simplified for now)
      const relevanceScore = 60; // Will be improved with ML later
      const difficultyScore = 40 + Math.random() * 30; // Placeholder

      const opportunityScore = calculateOpportunityScore({
        search_volume: query.impressions * 0.05, // Rough estimate
        current_position: query.position,
        impressions: query.impressions,
        clicks: query.clicks,
        ctr: query.ctr,
        relevance_score: relevanceScore,
        difficulty_score: difficultyScore
      });

      await insertKeyword({
        keyword: query.query,
        source: 'gsc',
        search_volume: Math.round(query.impressions * 0.05),
        current_position: query.position,
        impressions: query.impressions,
        clicks: query.clicks,
        ctr: query.ctr,
        intent,
        difficulty_score: difficultyScore,
        relevance_score: relevanceScore,
        opportunity_score: opportunityScore
      });

      if (isNew) {
        newKeywordsCount++;
      }
    }

    // Get top opportunity keywords and suggest related ones
    const topOpportunityKeywords = existingKeywords.rows
      .sort((a: any, b: any) => (b.opportunity_score || 0) - (a.opportunity_score || 0))
      .slice(0, 20)
      .map((k: any) => k.keyword);

    // Batch suggest related keywords (limit to reduce API costs)
    if (topOpportunityKeywords.length > 0) {
      const batchSize = 3;
      for (let i = 0; i < topOpportunityKeywords.length; i += batchSize) {
        const batch = topOpportunityKeywords.slice(i, i + batchSize);
        for (const keyword of batch) {
          try {
            const relatedKeywords = await suggestRelatedKeywords(keyword);

            // Insert related keywords if not already present
            for (const related of relatedKeywords) {
              if (!existingKeywordSet.has(related)) {
                const relIntent = await classifyIntent(related);
                await insertKeyword({
                  keyword: related,
                  source: 'ai_suggested',
                  intent: relIntent,
                  relevance_score: 50,
                  difficulty_score: 50,
                  opportunity_score: 50
                });
                newKeywordsCount++;
              }
            }
          } catch (err) {
            console.error(`Error getting related keywords for "${keyword}":`, err);
          }
        }
      }
    }

    // Queue top unassigned keywords for content generation
    const unassignedKeywords = (await getKeywords({ status: 'discovered' })).rows.filter(
      (k: any) => !k.content_id
    );

    const topToQueue = unassignedKeywords
      .sort((a: any, b: any) => (b.opportunity_score || 0) - (a.opportunity_score || 0))
      .slice(0, 10);

    for (const keyword of topToQueue) {
      await query(
        `INSERT INTO content_queue (keyword_id, priority, content_type, status)
        VALUES ($1, $2, 'blog_post', 'pending')
        ON CONFLICT DO NOTHING`,
        [keyword.id, Math.round(keyword.opportunity_score || 50)]
      );
    }

    // Update job log
    await logEngineJob({
      job_type: 'keyword_discovery',
      status: 'COMPLETED',
      items_processed: topQueries.length,
      details: {
        newKeywordsCount,
        suggestedCount: topToQueue.length,
        executionTimeMs: Date.now() - jobStart
      },
      completed_at: new Date()
    });

    return NextResponse.json(
      {
        success: true,
        message: `Discovered ${newKeywordsCount} new keywords, queued ${topToQueue.length} for content`,
        stats: {
          totalQueriesProcessed: topQueries.length,
          newKeywords: newKeywordsCount,
          queued: topToQueue.length,
          executionTimeMs: Date.now() - jobStart
        }
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = error instanceof Error ? error.stack : '';
    
    console.error('❌ Keyword discovery error:', errorMessage);
    console.error('📋 Stack:', errorDetails);
    
    // Log detailed error info
    if (error instanceof Error && error.message.includes('permission')) {
      console.error('🔐 Permission error detected. Checking config:');
      console.error('   - GSC_SITE_URL:', process.env.GSC_SITE_URL);
      console.error('   - Service Account JSON exists:', !!process.env.GSC_SERVICE_ACCOUNT_JSON);
    }

    await logEngineJob({
      job_type: 'keyword_discovery',
      status: 'FAILED',
      error_message: errorMessage,
      completed_at: new Date()
    });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}
