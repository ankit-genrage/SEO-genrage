import { query } from '../../../lib/db.ts';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const result = await query('SELECT NOW() as time');

    const checks = {
      database: result.rows.length > 0 ? 'ok' : 'failed',
      timestamp: new Date().toISOString(),
      environment: {
        hasGSCServiceAccount: !!process.env.GSC_SERVICE_ACCOUNT_JSON,
        hasGA4ServiceAccount: !!process.env.GA4_SERVICE_ACCOUNT_JSON,
        hasShopifyToken: !!process.env.SHOPIFY_ACCESS_TOKEN,
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
        hasCronSecret: !!process.env.CRON_SECRET,
        hasPerplexityKey: !!process.env.PERPLEXITY_API_KEY
      }
    };

    const allChecksPass = checks.database === 'ok';

    return NextResponse.json(
      {
        status: allChecksPass ? 'healthy' : 'unhealthy',
        checks
      },
      { status: allChecksPass ? 200 : 503 }
    );
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}
