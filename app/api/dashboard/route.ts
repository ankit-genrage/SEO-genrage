import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/db.ts';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get keyword counts by status
    const keywordStats = await query(
      `SELECT status, COUNT(*) as count FROM keywords GROUP BY status`
    );

    // Get content counts by status
    const contentStats = await query(
      `SELECT status, COUNT(*) as count FROM content GROUP BY status`
    );

    // Get top performing content
    const topContent = await query(
      `SELECT id, title, slug, organic_sessions_30d, clicks_30d, impressions_30d, avg_position
      FROM content
      WHERE status = 'published'
      ORDER BY organic_sessions_30d DESC
      LIMIT 10`
    );

    // Get top keywords by opportunity score
    const topKeywords = await query(
      `SELECT id, keyword, opportunity_score, current_position, impressions, intent
      FROM keywords
      ORDER BY opportunity_score DESC
      LIMIT 10`
    );

    // Get content in review
    const reviewContent = await query(
      `SELECT id, title, keyword_id, created_at
      FROM content
      WHERE status IN ('draft', 'review')
      ORDER BY created_at DESC
      LIMIT 10`
    );

    // Get recent engine logs
    const engineLogs = await query(
      `SELECT job_type, status, items_processed, started_at, completed_at
      FROM engine_log
      ORDER BY started_at DESC
      LIMIT 20`
    );

    // Get AEO scorecard
    const aeoData = await query(
      `SELECT platform, COUNT(CASE WHEN genrage_mentioned THEN 1 END) as mentioned_count, COUNT(*) as total
      FROM aeo_checks
      WHERE checked_at > NOW() - INTERVAL '7 days'
      GROUP BY platform`
    );

    // Get content performance trends
    const performanceTrends = await query(
      `SELECT
        c.id,
        c.title,
        cp.organic_sessions,
        cp.avg_position,
        cp.snapshot_date
      FROM content c
      LEFT JOIN content_performance cp ON c.id = cp.content_id
      WHERE cp.snapshot_date >= NOW() - INTERVAL '30 days'
      ORDER BY c.id, cp.snapshot_date DESC
      LIMIT 100`
    );

    // Build stats object
    const stats = {
      keywords: {
        total: keywordStats.rows.reduce((sum: number, row: any) => sum + row.count, 0),
        byStatus: Object.fromEntries(
          keywordStats.rows.map((row: any) => [row.status, row.count])
        )
      },
      content: {
        total: contentStats.rows.reduce((sum: number, row: any) => sum + row.count, 0),
        byStatus: Object.fromEntries(
          contentStats.rows.map((row: any) => [row.status, row.count])
        )
      },
      topContent: topContent.rows,
      topKeywords: topKeywords.rows,
      reviewQueue: reviewContent.rows,
      aeoScorecard: Object.fromEntries(
        aeoData.rows.map((row: any) => [
          row.platform,
          {
            mentioned: row.mentioned_count,
            total: row.total,
            rate: Math.round((row.mentioned_count / row.total) * 100)
          }
        ])
      ),
      engineStatus: engineLogs.rows.slice(0, 6).map((log: any) => ({
        jobType: log.job_type,
        status: log.status,
        itemsProcessed: log.items_processed,
        startedAt: log.started_at,
        completedAt: log.completed_at
      }))
    };

    return NextResponse.json(
      {
        success: true,
        stats,
        performanceTrends: performanceTrends.rows
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
