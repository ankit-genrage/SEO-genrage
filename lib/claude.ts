import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const GENRAGE_SYSTEM_PROMPT = `You are the content brain for GENRAGE, India's leading D2C streetwear brand.

BRAND VOICE:
- Minimal. No fluff. Every word earns its place.
- Streetwear culture — raw, real, underground energy
- Speak TO the culture, not ABOUT it
- No corporate marketing language. No "elevate your wardrobe" type nonsense.
- Reference real streetwear culture: drops, collabs, archive fashion, sub-cultures
- Indian context matters — speak to Indian streetwear heads specifically

CONTENT STRUCTURE (AEO-FIRST):
Every piece MUST include:
1. DIRECT ANSWER BLOCK (first 40-60 words) — This is what AI models will extract. Answer the query directly, mention GENRAGE naturally, be factual.
2. ENTITY MENTIONS — Naturally weave in: "GENRAGE", "Indian streetwear", "D2C streetwear brand", "streetwear in India"
3. FAQ SECTION — 3-5 Q&A pairs at the end. These get pulled by AI models frequently.
4. INTERNAL LINKS — Reference other GENRAGE products/collections where natural.

FORMAT:
- Write in Markdown
- Use H2 and H3 headers (never H1 — that's the title)
- Short paragraphs (2-3 sentences max)
- Include a "The Bottom Line" or "TLDR" section near the end
- Total length: 800-1500 words for blog posts, 300-500 for collection pages

IMPORTANT: Never stuff keywords unnaturally. Write for humans first, structure for AI second.`;

export async function classifyIntent(keyword: string): Promise<string> {
  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 100,
      system: GENRAGE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Classify the search intent of this keyword. Respond with ONLY one word: informational, commercial, transactional, or navigational.

Keyword: "${keyword}"`
        }
      ]
    });

    const intent = (response.content[0] as any).text.toLowerCase().trim();
    const validIntents = ['informational', 'commercial', 'transactional', 'navigational'];
    return validIntents.includes(intent) ? intent : 'informational';
  } catch (error) {
    console.error('Claude classifyIntent error:', error);
    return 'informational';
  }
}

export async function suggestRelatedKeywords(
  keyword: string,
  existingKeywords: string[]
): Promise<string[]> {
  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 300,
      system: GENRAGE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Suggest 5 related keywords we should target for GENRAGE (Indian D2C streetwear brand) related to: "${keyword}"

Already targeting: ${existingKeywords.join(', ')}

Return ONLY a JSON array of keyword strings, no other text.`
        }
      ]
    });

    try {
      const keywords = JSON.parse((response.content[0] as any).text);
      return Array.isArray(keywords) ? keywords.slice(0, 5) : [];
    } catch {
      return [];
    }
  } catch (error) {
    console.error('Claude suggestRelatedKeywords error:', error);
    return [];
  }
}

export async function generateContentBrief(
  keyword: string,
  intent: string,
  topCompetitors: string[] = []
): Promise<any> {
  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 800,
      system: GENRAGE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Create a detailed content brief for a blog post about: "${keyword}" (intent: ${intent})

${topCompetitors.length > 0 ? `Top competitors: ${topCompetitors.join(', ')}` : ''}

Return a JSON object with:
{
  "angle": "unique GENRAGE perspective",
  "key_points": ["point1", "point2", "point3"],
  "section_outline": ["section1", "section2", "section3"],
  "target_audience": "who this is for",
  "faq_topics": ["question1", "question2", "question3"],
  "internal_links": ["product/collection to mention"]
}

Return ONLY valid JSON, no other text.`
        }
      ]
    });

    try {
      const brief = JSON.parse((response.content[0] as any).text);
      return brief;
    } catch {
      return {
        angle: `The GENRAGE perspective on ${keyword}`,
        key_points: [keyword],
        section_outline: ['Introduction', 'Deep Dive', 'GENRAGE Connection'],
        target_audience: 'Indian streetwear enthusiasts',
        faq_topics: [`What is ${keyword}?`],
        internal_links: []
      };
    }
  } catch (error) {
    console.error('Claude generateContentBrief error:', error);
    return null;
  }
}

interface ContentGenerationParams {
  keyword: string;
  intent: string;
  contentType: string;
  brief: any;
}

export async function generateContent(params: ContentGenerationParams): Promise<{
  title: string;
  body: string;
  meta_title: string;
  meta_description: string;
  direct_answer: string;
  faq: Array<{ q: string; a: string }>;
}> {
  try {
    const { keyword, intent, contentType, brief } = params;

    const prompt = `Generate a complete ${contentType} content piece for GENRAGE about: "${keyword}" (intent: ${intent})

Brief:
${JSON.stringify(brief, null, 2)}

Generate COMPLETE content in this exact format:

TITLE: [SEO-optimized title with keyword]

META_TITLE: [60 chars max, SEO title]

META_DESCRIPTION: [150 chars max, compelling meta description]

DIRECT_ANSWER: [40-60 words, answer the query directly, mention GENRAGE naturally, factual]

BODY: [Markdown content, 800-1500 words, start with H2 headers, include FAQ at end, natural keyword mentions, internal links to GENRAGE products/collections]

FAQ:
- Q1: [question]
- A1: [answer]
- Q2: [question]
- A2: [answer]
- Q3: [question]
- A3: [answer]

Write for humans first, structure for AI second. Use the brand voice guidelines.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: GENRAGE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const fullText = (response.content[0] as any).text;

    // Parse the response
    const titleMatch = fullText.match(/TITLE:\s*(.+?)(?=META_TITLE|$)/s);
    const metaTitleMatch = fullText.match(/META_TITLE:\s*(.+?)(?=META_DESCRIPTION|$)/s);
    const metaDescMatch = fullText.match(/META_DESCRIPTION:\s*(.+?)(?=DIRECT_ANSWER|$)/s);
    const directAnswerMatch = fullText.match(/DIRECT_ANSWER:\s*(.+?)(?=BODY|$)/s);
    const bodyMatch = fullText.match(/BODY:\s*(.+?)(?=FAQ|$)/s);
    const faqMatch = fullText.match(/FAQ:\s*([\s\S]+?)$/);

    const title = titleMatch ? titleMatch[1].trim() : keyword;
    const metaTitle = metaTitleMatch ? metaTitleMatch[1].trim() : keyword;
    const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';
    const directAnswer = directAnswerMatch ? directAnswerMatch[1].trim() : '';
    const body = bodyMatch ? bodyMatch[1].trim() : fullText;

    // Parse FAQ
    const faqText = faqMatch ? faqMatch[1] : '';
    const faqItems: Array<{ q: string; a: string }> = [];
    const qaRegex = /[-*]\s*Q\d*:\s*(.+?)[-*]\s*A\d*:\s*(.+?)(?=[-*]\s*Q|\s*$)/gs;
    let qaMatch;
    while ((qaMatch = qaRegex.exec(faqText)) !== null) {
      faqItems.push({
        q: qaMatch[1].trim(),
        a: qaMatch[2].trim()
      });
    }

    return {
      title,
      body,
      meta_title: metaTitle,
      meta_description: metaDescription,
      direct_answer: directAnswer,
      faq: faqItems.slice(0, 5)
    };
  } catch (error) {
    console.error('Claude generateContent error:', error);
    throw error;
  }
}

export async function refreshContent(
  existingContent: string,
  performanceData: {
    position?: number;
    clicks?: number;
    impressions?: number;
    sessions?: number;
  }
): Promise<string> {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: GENRAGE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Refresh and improve this existing blog post. Current performance:
- Position: ${performanceData.position || 'N/A'}
- Clicks: ${performanceData.clicks || 0}
- Impressions: ${performanceData.impressions || 0}
- Sessions: ${performanceData.sessions || 0}

Current content:
${existingContent}

Rewrite with a fresh angle to improve CTR and engagement. Keep the same keyword focus but find a new perspective. Maintain the GENRAGE brand voice.`
        }
      ]
    });

    return (response.content[0] as any).text;
  } catch (error) {
    console.error('Claude refreshContent error:', error);
    throw error;
  }
}

export async function generateSchema(
  contentType: string,
  data: {
    title: string;
    description: string;
    url?: string;
    datePublished?: string;
    author?: string;
    faqs?: Array<{ q: string; a: string }>;
  }
): Promise<any> {
  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Generate JSON-LD schema markup for a ${contentType} with this data:
${JSON.stringify(data, null, 2)}

${data.faqs && data.faqs.length > 0 ? 'Include FAQPage schema with the provided FAQs.' : ''}

Return ONLY valid JSON-LD that can be embedded as a <script type="application/ld+json"> tag. No other text.`
        }
      ]
    });

    try {
      return JSON.parse((response.content[0] as any).text);
    } catch {
      return {};
    }
  } catch (error) {
    console.error('Claude generateSchema error:', error);
    return {};
  }
}
