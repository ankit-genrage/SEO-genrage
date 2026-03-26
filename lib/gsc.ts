import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

let jwtClient: JWT | null = null;

function initJWT() {
  if (jwtClient) return jwtClient;

  const serviceAccount = JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON || '{}');

  jwtClient = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: [
      'https://www.googleapis.com/auth/webmasters',
      'https://www.googleapis.com/auth/webmasters.readonly'
    ]
  });

  return jwtClient;
}

let searchconsole: any = null;

function getSearchConsole() {
  if (!searchconsole) {
    const auth = initJWT();
    searchconsole = google.searchconsole({
      version: 'v1',
      auth: auth
    });
  }
  return searchconsole;
}

export async function getTopQueries(
  days: number = 28,
  limit: number = 500
): Promise<
  Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>
> {
  try {
    const auth = initJWT();
    const siteUrl = process.env.GSC_SITE_URL || 'https://genrage.com';

    console.log('🔐 GSC Auth initialized');
    console.log('🌐 Querying site:', siteUrl);
    console.log('📅 Query days:', days, 'Limit:', limit);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log('📊 Request dates:', startDate.toISOString().split('T')[0], 'to', new Date().toISOString().split('T')[0]);

    const response = await getSearchConsole().searchanalytics.query(
      {
        siteUrl,
        requestBody: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          dimensions: ['query'],
          rowLimit: limit
        }
      }
    );
    
    console.log('✅ GSC API response received with', response.data?.rows?.length || 0, 'rows');

    const rows = response.data.rows || [];

    return rows.map((row: any) => ({
      query: row.keys[0],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0
    }));
  } catch (error: any) {
    console.error('❌ GSC getTopQueries error:', error?.message || String(error));
    console.error('📋 Full error:', error);
    
    // Log API-specific error details
    if (error?.errors) {
      console.error('🔴 API Errors:', error.errors);
    }
    if (error?.message?.includes('permission')) {
      console.error('🔐 Permission denied - check service account access in GSC');
      console.error('   Site URL being queried:', process.env.GSC_SITE_URL);
    }
    
    throw error;
  }
}

export async function getStrikingDistanceKeywords(
  days: number = 28
): Promise<
  Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>
> {
  const queries = await getTopQueries(days, 500);
  return queries.filter((q) => q.position >= 5 && q.position <= 20);
}

export async function getNewOpportunities(
  days: number = 28
): Promise<
  Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>
> {
  const queries = await getTopQueries(days, 500);
  return queries.filter((q) => q.impressions > 50 && q.clicks < 5);
}

export async function getPagePerformance(
  url: string,
  days: number = 28
): Promise<{
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}> {
  try {
    const auth = initJWT();
    const siteUrl = process.env.GSC_SITE_URL || 'https://genrage.com';

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const response = await getSearchConsole().searchanalytics.query(
      {
        siteUrl,
        requestBody: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          dimensions: ['page'],
          filters: [
            {
              dimension: 'page',
              operator: 'equals',
              value: url
            }
          ]
        }
      }
    );

    const row = response.data.rows?.[0];

    return {
      clicks: row?.clicks || 0,
      impressions: row?.impressions || 0,
      ctr: row?.ctr || 0,
      position: row?.position || 0
    };
  } catch (error) {
    console.error('GSC getPagePerformance error:', error);
    throw error;
  }
}

export async function getQueryPerformance(
  query: string,
  days: number = 28
): Promise<{
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}> {
  try {
    const auth = initJWT();
    const siteUrl = process.env.GSC_SITE_URL || 'https://genrage.com';

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const response = await getSearchConsole().searchanalytics.query(
      {
        siteUrl,
        requestBody: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          dimensions: ['query'],
          filters: [
            {
              dimension: 'query',
              operator: 'equals',
              value: query
            }
          ]
        }
      }
    );

    const row = response.data.rows?.[0];

    return {
      clicks: row?.clicks || 0,
      impressions: row?.impressions || 0,
      ctr: row?.ctr || 0,
      position: row?.position || 0
    };
  } catch (error) {
    console.error('GSC getQueryPerformance error:', error);
    throw error;
  }
}

export async function getPageAndQueryPerformance(
  url: string,
  query: string,
  days: number = 28
): Promise<{
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}> {
  try {
    const auth = initJWT();
    const siteUrl = process.env.GSC_SITE_URL || 'https://genrage.com';

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const response = await getSearchConsole().searchanalytics.query(
      {
        siteUrl,
        requestBody: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          dimensions: ['query', 'page'],
          filters: [
            {
              dimension: 'page',
              operator: 'equals',
              value: url
            },
            {
              dimension: 'query',
              operator: 'equals',
              value: query
            }
          ]
        }
      }
    );

    const row = response.data.rows?.[0];

    return {
      clicks: row?.clicks || 0,
      impressions: row?.impressions || 0,
      ctr: row?.ctr || 0,
      position: row?.position || 0
    };
  } catch (error) {
    console.error('GSC getPageAndQueryPerformance error:', error);
    throw error;
  }
}
