import { NextRequest, NextResponse } from 'next/server';
import { getContentByStatus, query, logEngineJob } from '@/lib/db';
import { getPagePerformance } from '@/lib/gsc';
import { getPageMetrics } from '@/lib/ga4';
import { calculateContentHealthScore } from '@/lib/scoring';

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
      job_type: 'performance_sync',
      status: 'RUNNING'
    });

    // Get all published content
    const publishedContent = await getContentByStatus('published', 100);

    if (publishedContent.length === 0) {
      await logEngineJob({
        job_type: 'performance_sync',
        status: 'COMPLETED',
        items_processed: 0,
        details: { message: 'No published content' },
        completed_at: new Date()
      });

      return NextResponse.json(
        { success: true, message: 'No published content', itemsUpdated: 0 },
        { status: 200 }
      );
    }

    let itemsUpdated = 0;

    for (const content of publishedContent) {
      try {
        // Get GSC data for the content URL
        const gscData = await getPagePerformance(`/blogs/journal/${content.slug}`);

        // Get GA4 data for the content
        const ga4Data = await getPageMetrics(`/blogs/journal/${content.slug}`, 30);

        // Calculate health score
        const healthScore = calculateContentHealthScore({
          organic_sessions_30d: ga4Data.sessions,
          avg_position: gscData.position,
          clicks_30d: gscData.clicks,
          impressions_30d: gscData.impressions,
          aeo_citation_count: content.aeo_citation_count || 0,
          published_at: content.published_at
        });

        // Update content metrics
        await query(
          `UPDATE content SET
          current_position = $1,
          impressions_30d = $2,
          clicks_30d = $3,
          organic_sessions_30d = $4,
          organic_atc_30d = $5,
          organic_purchases_30d = $6,
          avg_position = $7,
          updated_at = NOW()
        WHERE id = $8`,
          [
            gscData.position,
            gscData.impressions,
            gscData.clicks,
            ga4Data.sessions,
            0, // ATC needs to come from GA4 custom events
            0, // Purchases needs to come from GA4 custom events
            gscData.position,
            content.id
          ]
        );

        // Insert performance snapshot
        const today = new Date().toISOString().split('T')[0];
        await query(
          `INSERT INTO content_performance
          (content_id, snapshot_date, organic_sessions, impressions, clicks, avg_position, aeo_citations)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (content_id, snapshot_date) DO UPDATE SET
          organic_sessions = EXCLUDED.organic_sessions,
          impressions = EXCLUDED.impressions,
          clicks = EXCLUDED.clicks,
          avg_position = EXCLUDED.avg_position,
          aeo_citations = EXCLUDED.aeo_citations`,
          [
            content.id,
            today,
            ga4Data.sessions,
            gscData.impressions,
            gscData.clicks,
            gscData.position,
            content.aeo_citation_count || 0
          ]
        );

        // If health score is low, flag for refresh
        if (healthScore < 30) {
          const daysOld = Math.floor(
            (Date.now() - new Date(content.published_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysOld > 30) {
            await query(
              `UPDATE content SET status = 'needs_refresh' WHERE id = $1`,
              [content.id]
            );
          }
        }

        itemsUpdated++;
      } catch (error) {
        console.error(`Error syncing performance for content ${content.id}:`, error);
        // Continue with next item
      }
    }

    // Log job completion
    await logEngineJob({
      job_type: 'performance_sync',
      status: 'COMPLETED',
      items_processed: itemsUpdated,
      details: {
        itemsUpdated,
        totalPublished: publishedContent.length,
        executionTimeMs: Date.now() - jobStart
      },
      completed_at: new Date()
    });

    return NextResponse.json(
      {
        success: true,
        message: `Updated performance data for ${itemsUpdated} content pieces`,
        stats: {
          itemsUpdated,
          totalPublished: publishedContent.length,
          executionTimeMs: Date.now() - jobStart
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Performance sync error:', error);

    await logEngineJob({
      job_type: 'performance_sync',
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
