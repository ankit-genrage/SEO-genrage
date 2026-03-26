import { NextRequest, NextResponse } from 'next/server';
import { query, logEngineJob } from '../../../../lib/db.ts';
import { calculateContentHealthScore, shouldRefreshContent } from '../../../../lib/scoring.ts';

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
      job_type: 'content_refresh',
      status: 'RUNNING'
    });

    // Get published content older than 30 days
    const result = await query(
      `SELECT c.*,
        EXTRACT(DAY FROM NOW() - c.published_at) as days_old,
        (SELECT avg_position FROM content_performance WHERE content_id = c.id ORDER BY snapshot_date DESC LIMIT 1) as latest_position,
        (SELECT avg_position FROM content_performance WHERE content_id = c.id ORDER BY snapshot_date DESC LIMIT 1 OFFSET 30) as position_30_days_ago
      FROM content c
      WHERE c.status = 'published'
      AND c.published_at < NOW() - INTERVAL '30 days'
      ORDER BY c.organic_sessions_30d DESC`,
      []
    );

    const publishedContent = result.rows || [];

    if (publishedContent.length === 0) {
      await logEngineJob({
        job_type: 'content_refresh',
        status: 'COMPLETED',
        items_processed: 0,
        details: { message: 'No old content found' },
        completed_at: new Date()
      });

      return NextResponse.json(
        { success: true, message: 'No old content to refresh', itemsQueued: 0 },
        { status: 200 }
      );
    }

    let itemsQueued = 0;

    for (const content of publishedContent) {
      try {
        // Calculate health score
        const healthScore = calculateContentHealthScore({
          organic_sessions_30d: content.organic_sessions_30d,
          avg_position: content.avg_position,
          clicks_30d: content.clicks_30d,
          impressions_30d: content.impressions_30d,
          aeo_citation_count: content.aeo_citation_count,
          published_at: content.published_at
        });

        // Check if content should be refreshed
        const positionTrend = content.latest_position
          ? (content.position_30_days_ago || content.latest_position) - content.latest_position
          : 0;

        if (
          shouldRefreshContent(
            healthScore,
            content.days_old,
            positionTrend / 30,
            0,
            content.aeo_citation_count
          )
        ) {
          // Queue for refresh with high priority
          await query(
            `INSERT INTO content_queue (keyword_id, priority, content_type, status, content_brief)
            VALUES (
              (SELECT keyword_id FROM content WHERE id = $1),
              90,
              $2,
              'pending',
              jsonb_build_object('type', 'refresh', 'original_id', $1, 'reason', $3)
            )`,
            [
              content.id,
              content.content_type || 'blog_post',
              healthScore < 30 ? 'low_health' : 'position_decline'
            ]
          );

          // Update content status
          await query('UPDATE content SET status = $1 WHERE id = $2', [
            'needs_refresh',
            content.id
          ]);

          itemsQueued++;
        }
      } catch (error) {
        console.error(`Error processing content ${content.id} for refresh:`, error);
        // Continue with next item
      }
    }

    // Log job completion
    await logEngineJob({
      job_type: 'content_refresh',
      status: 'COMPLETED',
      items_processed: itemsQueued,
      details: {
        itemsQueued,
        totalEvaluated: publishedContent.length,
        executionTimeMs: Date.now() - jobStart
      },
      completed_at: new Date()
    });

    return NextResponse.json(
      {
        success: true,
        message: `Queued ${itemsQueued} content pieces for refresh`,
        stats: {
          itemsQueued,
          totalEvaluated: publishedContent.length,
          executionTimeMs: Date.now() - jobStart
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Content refresh error:', error);

    await logEngineJob({
      job_type: 'content_refresh',
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
