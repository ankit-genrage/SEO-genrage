export interface AEOCheckResult {
  keyword: string;
  platform: string;
  query_used: string;
  response_text: string;
  genrage_mentioned: boolean;
  genrage_linked: boolean;
  competitor_mentioned: string[];
  checked_at: Date;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkPerplexity(keyword: string): Promise<AEOCheckResult> {
  try {
    const query = `What is ${keyword}?`;

    const response = await fetchWithTimeout(
      'https://api.perplexity.ai/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'pplx-70b-online',
          messages: [
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: 1000
        })
      },
      10000
    );

    const data = (await response.json()) as any;
    const responseText = data.choices?.[0]?.message?.content || '';

    const genrageMentioned = responseText.toLowerCase().includes('genrage');
    const genrageLinked = /https?:\/\/[^\s]*genrage[^\s]*/.test(responseText);

    // Extract competitor mentions
    const competitors = ['forever 21', 'h&m', 'zara', 'uniqlo', 'shein'];
    const competitorMentioned = competitors.filter((comp) =>
      responseText.toLowerCase().includes(comp)
    );

    return {
      keyword,
      platform: 'perplexity',
      query_used: query,
      response_text: responseText,
      genrage_mentioned: genrageMentioned,
      genrage_linked: genrageLinked,
      competitor_mentioned: competitorMentioned,
      checked_at: new Date()
    };
  } catch (error) {
    console.error('Perplexity check error:', error);
    return {
      keyword,
      platform: 'perplexity',
      query_used: `What is ${keyword}?`,
      response_text: '',
      genrage_mentioned: false,
      genrage_linked: false,
      competitor_mentioned: [],
      checked_at: new Date()
    };
  }
}

export async function checkClaude(keyword: string): Promise<AEOCheckResult> {
  try {
    const Groq = (await import('groq-sdk')).default;
    const client = new Groq({
      apiKey: process.env.GROQ_API_KEY || ''
    });

    const query = `What is ${keyword}? Please provide a brief answer (2-3 sentences).`;

    const response = await client.chat.completions.create({
      model: 'mixtral-8x7b',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: query
        }
      ]
    });

    const responseText = response.choices[0]?.message?.content || '';

    const genrageMentioned = responseText.toLowerCase().includes('genrage');
    const genrageLinked = /https?:\/\/[^\s]*genrage[^\s]*/.test(responseText);

    // Extract competitor mentions
    const competitors = ['forever 21', 'h&m', 'zara', 'uniqlo', 'shein'];
    const competitorMentioned = competitors.filter((comp) =>
      responseText.toLowerCase().includes(comp)
    );

    return {
      keyword,
      platform: 'claude',
      query_used: query,
      response_text: responseText,
      genrage_mentioned: genrageMentioned,
      genrage_linked: genrageLinked,
      competitor_mentioned: competitorMentioned,
      checked_at: new Date()
    };
  } catch (error) {
    console.error('Claude check error:', error);
    return {
      keyword,
      platform: 'claude',
      query_used: `What is ${keyword}?`,
      response_text: '',
      genrage_mentioned: false,
      genrage_linked: false,
      competitor_mentioned: [],
      checked_at: new Date()
    };
  }
}

export async function checkGoogleAIOverview(keyword: string): Promise<AEOCheckResult> {
  // Google AI Overview checking is more complex and requires either:
  // 1. SerpAPI integration (paid)
  // 2. Headless browser approach
  // For now, return a placeholder that can be enhanced
  try {
    const query = `${keyword} site:genrage.com`;

    // This would need SerpAPI or similar to work properly
    // For now, we'll return a template response
    return {
      keyword,
      platform: 'google_ai_overview',
      query_used: query,
      response_text: 'Google AI Overview checking requires SerpAPI integration',
      genrage_mentioned: false,
      genrage_linked: false,
      competitor_mentioned: [],
      checked_at: new Date()
    };
  } catch (error) {
    console.error('Google AI Overview check error:', error);
    return {
      keyword,
      platform: 'google_ai_overview',
      query_used: `${keyword}`,
      response_text: '',
      genrage_mentioned: false,
      genrage_linked: false,
      competitor_mentioned: [],
      checked_at: new Date()
    };
  }
}

export async function runAEOAudit(keywords: string[]): Promise<AEOCheckResult[]> {
  const results: AEOCheckResult[] = [];

  // Check top 10 keywords across platforms
  for (const keyword of keywords.slice(0, 10)) {
    try {
      // Check Perplexity
      if (process.env.PERPLEXITY_API_KEY) {
        const perpResult = await checkPerplexity(keyword);
        results.push(perpResult);
      }

      // Check Claude
      const claudeResult = await checkClaude(keyword);
      results.push(claudeResult);

      // Check Google AI Overview (template for now)
      const googleResult = await checkGoogleAIOverview(keyword);
      results.push(googleResult);

      // Rate limit: wait a bit between keywords
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error checking AEO for keyword "${keyword}":`, error);
    }
  }

  return results;
}

export function getAEOScorecard(
  results: AEOCheckResult[]
): {
  totalKeywordsChecked: number;
  citedInClaude: number;
  citedInPerplexity: number;
  citedInGoogleAI: number;
  totalCitations: number;
  linkedCitations: number;
  citationRate: number;
} {
  const claudeResults = results.filter((r) => r.platform === 'claude');
  const perplexityResults = results.filter((r) => r.platform === 'perplexity');
  const googleResults = results.filter((r) => r.platform === 'google_ai_overview');

  const citedClaude = claudeResults.filter((r) => r.genrage_mentioned).length;
  const citedPerplexity = perplexityResults.filter((r) => r.genrage_mentioned).length;
  const citedGoogle = googleResults.filter((r) => r.genrage_mentioned).length;
  const linked = results.filter((r) => r.genrage_linked).length;
  const totalCited = results.filter((r) => r.genrage_mentioned).length;

  return {
    totalKeywordsChecked: results.length,
    citedInClaude: citedClaude,
    citedInPerplexity: citedPerplexity,
    citedInGoogleAI: citedGoogle,
    totalCitations: totalCited,
    linkedCitations: linked,
    citationRate: results.length > 0 ? totalCited / results.length : 0
  };
}

export async function checkAEOForKeyword(
  keyword: string
): Promise<{
  keyword: string;
  mentioned_in: string[];
  linked_from: string[];
  aeo_score: number;
}> {
  const results: AEOCheckResult[] = [];

  try {
    if (process.env.PERPLEXITY_API_KEY) {
      results.push(await checkPerplexity(keyword));
    }

    results.push(await checkClaude(keyword));
    results.push(await checkGoogleAIOverview(keyword));
  } catch (error) {
    console.error(`Error running AEO check for "${keyword}":`, error);
  }

  const mentionedIn = results
    .filter((r) => r.genrage_mentioned)
    .map((r) => r.platform);
  const linkedFrom = results
    .filter((r) => r.genrage_linked)
    .map((r) => r.platform);

  const aeoScore = mentionedIn.length > 0 ? (mentionedIn.length / results.length) * 100 : 0;

  return {
    keyword,
    mentioned_in: mentionedIn,
    linked_from: linkedFrom,
    aeo_score: Math.round(aeoScore)
  };
}

export function generateAEOReport(
  results: AEOCheckResult[],
  threshold = 0.5
): {
  strong_keywords: string[];
  weak_keywords: string[];
  opportunities: string[];
  overall_aeo_health: number;
} {
  // Group by keyword
  const byKeyword: Record<string, AEOCheckResult[]> = {};
  results.forEach((r) => {
    if (!byKeyword[r.keyword]) byKeyword[r.keyword] = [];
    byKeyword[r.keyword].push(r);
  });

  const strong_keywords: string[] = [];
  const weak_keywords: string[] = [];
  const opportunities: string[] = [];

  for (const [keyword, checks] of Object.entries(byKeyword)) {
    const citationRate = checks.filter((c) => c.genrage_mentioned).length / checks.length;

    if (citationRate >= threshold) {
      strong_keywords.push(keyword);
    } else if (citationRate === 0) {
      weak_keywords.push(keyword);
      opportunities.push(keyword);
    }
  }

  const overall =
    results.filter((r) => r.genrage_mentioned).length / Math.max(results.length, 1);

  return {
    strong_keywords,
    weak_keywords,
    opportunities,
    overall_aeo_health: Math.round(overall * 100)
  };
}
