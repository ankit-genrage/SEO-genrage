import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

let jwtClient: JWT | null = null;

function initJWT() {
  if (jwtClient) return jwtClient;

  const serviceAccount = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON || '{}');

  jwtClient = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly']
  });

  return jwtClient;
}

let analyticsdata: any = null;

function getAnalyticsData() {
  if (!analyticsdata) {
    const auth = initJWT();
    analyticsdata = google.analyticsdata({
      version: 'v1beta',
      auth: auth
    });
  }
  return analyticsdata;
}

export async function getOrganicSessions(
  days: number = 30
): Promise<
  Array<{
    landing_page: string;
    sessions: number;
    conversions: number;
    conversion_rate: number;
  }>
> {
  try {
    const auth = initJWT();
    const propertyId = process.env.GA4_PROPERTY_ID;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const response = await getAnalyticsData().properties.runReport(
      {
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [
            {
              startDate: startDate.toISOString().split('T')[0],
              endDate: new Date().toISOString().split('T')[0]
            }
          ],
          dimensions: [{ name: 'landingPage' }],
          metrics: [
            { name: 'sessions' },
            { name: 'conversions' },
            { name: 'conversionRate' }
          ],
          dimensionFilter: {
            andGroup: {
              expressions: [
                {
                  filter: {
                    fieldName: 'sessionDefaultChannelGroup',
                    stringFilter: {
                      matchType: 'EXACT',
                      value: 'Organic Search'
                    }
                  }
                }
              ]
            }
          },
          limit: 500
        }
      }
    );

    const rows = response.data.rows || [];

    return rows.map((row: any) => ({
      landing_page: row.dimensionValues[0].value,
      sessions: parseInt(row.metricValues[0].value) || 0,
      conversions: parseInt(row.metricValues[1].value) || 0,
      conversion_rate: parseFloat(row.metricValues[2].value) || 0
    }));
  } catch (error) {
    console.error('GA4 getOrganicSessions error:', error);
    throw error;
  }
}

export async function getPageMetrics(
  pagePath: string,
  days: number = 30
): Promise<{
  sessions: number;
  pageviews: number;
  avg_session_duration: number;
  bounce_rate: number;
  conversions: number;
  conversion_rate: number;
}> {
  try {
    const auth = initJWT();
    const propertyId = process.env.GA4_PROPERTY_ID;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const response = await getAnalyticsData().properties.runReport(
      {
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [
            {
              startDate: startDate.toISOString().split('T')[0],
              endDate: new Date().toISOString().split('T')[0]
            }
          ],
          dimensions: [],
          metrics: [
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
            { name: 'conversions' },
            { name: 'conversionRate' }
          ],
          dimensionFilter: {
            andGroup: {
              expressions: [
                {
                  filter: {
                    fieldName: 'pagePath',
                    stringFilter: {
                      matchType: 'EXACT',
                      value: pagePath
                    }
                  }
                }
              ]
            }
          }
        }
      }
    );

    const row = response.data.rows?.[0];

    if (!row) {
      return {
        sessions: 0,
        pageviews: 0,
        avg_session_duration: 0,
        bounce_rate: 0,
        conversions: 0,
        conversion_rate: 0
      };
    }

    return {
      sessions: parseInt(row.metricValues[0].value) || 0,
      pageviews: parseInt(row.metricValues[1].value) || 0,
      avg_session_duration: parseFloat(row.metricValues[2].value) || 0,
      bounce_rate: parseFloat(row.metricValues[3].value) || 0,
      conversions: parseInt(row.metricValues[4].value) || 0,
      conversion_rate: parseFloat(row.metricValues[5].value) || 0
    };
  } catch (error) {
    console.error('GA4 getPageMetrics error:', error);
    throw error;
  }
}

export async function getAddToCartEvents(
  days: number = 30
): Promise<
  Array<{
    item_name: string;
    event_count: number;
  }>
> {
  try {
    const auth = initJWT();
    const propertyId = process.env.GA4_PROPERTY_ID;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const response = await getAnalyticsData().properties.runReport(
      {
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [
            {
              startDate: startDate.toISOString().split('T')[0],
              endDate: new Date().toISOString().split('T')[0]
            }
          ],
          dimensions: [{ name: 'itemName' }],
          metrics: [{ name: 'eventCount' }],
          dimensionFilter: {
            andGroup: {
              expressions: [
                {
                  filter: {
                    fieldName: 'eventName',
                    stringFilter: {
                      matchType: 'EXACT',
                      value: 'add_to_cart'
                    }
                  }
                }
              ]
            }
          },
          limit: 100
        }
      }
    );

    const rows = response.data.rows || [];

    return rows.map((row: any) => ({
      item_name: row.dimensionValues[0].value,
      event_count: parseInt(row.metricValues[0].value) || 0
    }));
  } catch (error) {
    console.error('GA4 getAddToCartEvents error:', error);
    throw error;
  }
}

export async function getPurchaseEvents(
  days: number = 30
): Promise<
  Array<{
    item_name: string;
    purchase_count: number;
    revenue: number;
  }>
> {
  try {
    const auth = initJWT();
    const propertyId = process.env.GA4_PROPERTY_ID;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const response = await getAnalyticsData().properties.runReport(
      {
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [
            {
              startDate: startDate.toISOString().split('T')[0],
              endDate: new Date().toISOString().split('T')[0]
            }
          ],
          dimensions: [{ name: 'itemName' }],
          metrics: [{ name: 'purchaseToViewRate' }, { name: 'totalRevenue' }],
          dimensionFilter: {
            andGroup: {
              expressions: [
                {
                  filter: {
                    fieldName: 'eventName',
                    stringFilter: {
                      matchType: 'EXACT',
                      value: 'purchase'
                    }
                  }
                }
              ]
            }
          },
          limit: 100
        }
      }
    );

    const rows = response.data.rows || [];

    return rows.map((row: any) => ({
      item_name: row.dimensionValues[0].value,
      purchase_count: parseInt(row.metricValues[0].value) || 0,
      revenue: parseFloat(row.metricValues[1].value) || 0
    }));
  } catch (error) {
    console.error('GA4 getPurchaseEvents error:', error);
    throw error;
  }
}

export async function getPageTraffic(
  days: number = 30,
  limit: number = 100
): Promise<
  Array<{
    page: string;
    sessions: number;
    pageviews: number;
    conversion_rate: number;
  }>
> {
  try {
    const auth = initJWT();
    const propertyId = process.env.GA4_PROPERTY_ID;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const response = await getAnalyticsData().properties.runReport(
      {
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [
            {
              startDate: startDate.toISOString().split('T')[0],
              endDate: new Date().toISOString().split('T')[0]
            }
          ],
          dimensions: [{ name: 'pagePath' }],
          metrics: [
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'conversionRate' }
          ],
          limit
        }
      }
    );

    const rows = response.data.rows || [];

    return rows.map((row: any) => ({
      page: row.dimensionValues[0].value,
      sessions: parseInt(row.metricValues[0].value) || 0,
      pageviews: parseInt(row.metricValues[1].value) || 0,
      conversion_rate: parseFloat(row.metricValues[2].value) || 0
    }));
  } catch (error) {
    console.error('GA4 getPageTraffic error:', error);
    throw error;
  }
}
