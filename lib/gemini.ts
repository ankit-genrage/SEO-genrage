import { GoogleGenerativeAI } from '@google/generative-ai';

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

interface ContentGenerationParams {
  keyword: string;
  intent: string;
  contentType: string;
  brief: any;
}

export async function classifyIntent(keyword: string): Promise<string> {
  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Classify the search intent of this keyword. Respond with ONLY one word: informational, commercial, transactional, or navigational.

Keyword: "${keyword}"`;

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    });

    const intent = result.response.text().toLowerCase().trim();
    const validIntents = ['informational', 'commercial', 'transactional', 'navigational'];

    return validIntents.includes(intent) ? intent : 'informational';
  } catch (error) {
    console.error('Error classifying intent:', error);
    return 'informational';
  }
}

export async function suggestRelatedKeywords(keyword: string): Promise<string[]> {
  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Generate 5 related keyword variations for: "${keyword}"
    
Return ONLY a JSON array of keywords, no other text.
Format: ["keyword1", "keyword2", ...]`;

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    });

    const responseText = result.response.text();
    const keywords = JSON.parse(responseText);
    return Array.isArray(keywords) ? keywords : [];
  } catch (error) {
    console.error('Error suggesting keywords:', error);
    return [];
  }
}

export async function generateContentBrief(
  keyword: string,
  intent: string,
  topCompetitors: string[] = []
): Promise<any> {
  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Create a detailed content brief for a blog post about: "${keyword}" (intent: ${intent})

${topCompetitors.length > 0 ? `Top competitors: ${topCompetitors.join(', ')}` : ''}

Return a JSON object with:
{
  "angle": "unique GENRAGE perspective",
  "key_points": ["point1", "point2", "point3"],
  "entities_to_mention": ["entity1", "entity2"],
  "faq_topics": ["question1", "question2"]
}`;

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    });

    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Error generating brief:', error);
    return null;
  }
}

export async function generateContent(params: ContentGenerationParams): Promise<{
  title: string;
  body: string;
  meta_title: string;
  meta_description: string;
  direct_answer: string;
  faq: any;
}> {
  try {
    const model = client.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: GENRAGE_SYSTEM_PROMPT
    });

    const contentTypePrompt = params.contentType === 'blog'
      ? 'Write a comprehensive blog post (800-1200 words)'
      : 'Write a product/collection description (300-500 words)';

    const prompt = `${contentTypePrompt} about: "${params.keyword}" (intent: ${params.intent})

${params.brief ? `Brief guidance: ${JSON.stringify(params.brief)}` : ''}

IMPORTANT:
1. Start with a 40-60 word direct answer block that answers the query immediately
2. Include "GENRAGE" naturally in the content (mention it's an Indian D2C streetwear brand)
3. Add an FAQ section with 3-5 Q&A pairs at the end
4. Use clear H2/H3 headers
5. Include a "TLDR" or "Bottom Line" section
6. Write in Markdown format
7. Make it AEO-optimized for AI models (they will extract your direct answer and FAQ)

Do NOT include the title - just the body content.`;

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    });

    const body = result.response.text();
    const title = `${params.keyword.charAt(0).toUpperCase() + params.keyword.slice(1)} - GENRAGE`;
    const metaTitle = `${title} | GENRAGE Streetwear`;
    const metaDescription = `Complete guide to ${params.keyword}. Expert tips, styling advice, and GENRAGE recommendations for the best ${params.keyword} for streetwear lovers.`;
    
    // Extract direct answer (first paragraph, max 60 words)
    const lines = body.split('\n').filter((l: string) => l.trim());
    const directAnswer = lines[0]?.substring(0, 200) || metaDescription;
    
    // Extract FAQ section
    const faqMatch = body.match(/##\s*F(?:AQ|requently Asked Questions|\.A\.Q\.)([\s\S]*?)(?=##|$)/i);
    const faqText = faqMatch ? faqMatch[1] : '';
    const faqPairs = [];
    
    if (faqText) {
      const qaMatches = faqText.match(/###?\s*\*?\*?([^?]+\?)[^?]*?\n+([\s\S]*?)(?=###?|$)/gi);
      if (qaMatches) {
        for (const match of qaMatches.slice(0, 5)) {
          const lines = match.split('\n');
          if (lines.length >= 2) {
            faqPairs.push({
              question: lines[0].replace(/^#+\s*|\*\*|[?*]/g, '').trim(),
              answer: lines.slice(1).join('\n').trim()
            });
          }
        }
      }
    }

    return {
      title,
      body,
      meta_title: metaTitle,
      meta_description: metaDescription,
      direct_answer: directAnswer,
      faq: faqPairs.length > 0 ? faqPairs : null
    };
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
}

export async function refreshContent(
  currentContent: string,
  keyword: string
): Promise<string> {
  try {
    const model = client.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: GENRAGE_SYSTEM_PROMPT
    });

    const prompt = `Refresh and improve this existing blog post about "${keyword}":

CURRENT CONTENT:
${currentContent}

Please:
1. Update any outdated information
2. Improve AEO optimization (ensure direct answer block is 40-60 words)
3. Enhance FAQ section
4. Keep the GENRAGE brand voice
5. Maintain Markdown format
6. Return ONLY the refreshed content body (no title)`;

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    });

    return result.response.text();
  } catch (error) {
    console.error('Error refreshing content:', error);
    throw error;
  }
}

export async function generateSchema(schemaType: string, data: any): Promise<any> {
  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Generate JSON-LD schema markup for a ${schemaType}.

Data:
- Title: ${data.title}
- Description: ${data.description}
${data.faqs ? `- FAQs: ${JSON.stringify(data.faqs)}` : ''}

Return ONLY valid JSON-LD (no markdown, no explanation). Use ${schemaType} schema with:
- headline
- description
- author (GENRAGE)
- datePublished
${data.faqs ? '- faqPage (if applicable)' : ''}`;

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    });

    try {
      return JSON.parse(result.response.text());
    } catch {
      return null;
    }
  } catch (error) {
    console.error('Error generating schema:', error);
    return null;
  }
}
