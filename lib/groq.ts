import Groq from 'groq-sdk';

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
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

interface ContentGenerationParams {
  keyword: string;
  intent: string;
  contentType: string;
  brief: any;
}

export async function classifyIntent(keyword: string): Promise<string> {
  try {
    const message = await client.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `Classify the search intent of this keyword. Respond with ONLY one word: informational, commercial, transactional, or navigational.\n\nKeyword: "${keyword}"`
        }
      ]
    });

    const text = message.choices[0]?.message?.content || '';
    return text.trim().toLowerCase();
  } catch (error) {
    console.error('Intent classification error:', error);
    return 'informational';
  }
}

export async function suggestRelatedKeywords(keyword: string): Promise<string[]> {
  try {
    const message = await client.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Generate 5 related keyword variations for: "${keyword}"\n\nRespond with ONLY a comma-separated list, no numbers or bullets.\nExample: "keyword variant 1, keyword variant 2, keyword variant 3"`
        }
      ]
    });

    const text = message.choices[0]?.message?.content || '';
    return text
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
  } catch (error) {
    console.error('Keyword suggestion error:', error);
    return [];
  }
}

export async function generateContentBrief(keyword: string, intent: string): Promise<string> {
  try {
    const message = await client.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: GENRAGE_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `Create a brief content outline for a ${intent} piece about "${keyword}". Include main sections, target audience, and key points to cover.`
        }
      ]
    });

    return message.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Brief generation error:', error);
    return '';
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
    const { keyword, intent, brief } = params;

    const message = await client.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: GENRAGE_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `Generate a complete ${intent} article about "${keyword}".

BRIEF:
${brief}

REQUIREMENTS:
1. Start with a 40-60 word direct answer block
2. Write engaging, SEO-optimized body content (800-1200 words)
3. Include FAQ section with 3-5 Q&A pairs
4. Include "The Bottom Line" section
5. Mention GENRAGE naturally throughout
6. Use H2/H3 headers, not H1

RESPONSE FORMAT (use these exact separators):
---TITLE---
[Article Title Here]

---META_TITLE---
[Meta Title 40-60 chars]

---META_DESCRIPTION---
[Meta Description 150-160 chars]

---DIRECT_ANSWER---
[40-60 word direct answer]

---BODY---
[Full article body in markdown]

---FAQ---
[Q&A pairs in markdown]`
        }
      ]
    });

    const text = message.choices[0]?.message?.content || '';
    if (!text) {
      throw new Error('Empty response from Groq');
    }
    const sections = text.split('---');

    const extractSection = (name: string) => {
      const index = sections.findIndex(s => s.includes(name));
      if (index >= 0 && index + 1 < sections.length) {
        return sections[index + 1].replace(name, '').trim();
      }
      return '';
    };

    return {
      title: extractSection('TITLE'),
      body: extractSection('BODY'),
      meta_title: extractSection('META_TITLE'),
      meta_description: extractSection('META_DESCRIPTION'),
      direct_answer: extractSection('DIRECT_ANSWER'),
      faq: extractSection('FAQ')
    };
  } catch (error) {
    console.error('Content generation error:', error);
    throw error;
  }
}

export async function refreshContent(
  keyword: string,
  currentContent: string,
  intent: string
): Promise<string> {
  try {
    const message = await client.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: GENRAGE_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `Refresh and improve this article about "${keyword}" while maintaining the ${intent} intent:

CURRENT CONTENT:
${currentContent}

IMPROVEMENTS:
- Update any outdated information
- Add new insights about streetwear/fashion trends
- Enhance AEO elements (direct answer, FAQ, schema)
- Keep GENRAGE brand voice consistent
- Maintain markdown structure with H2/H3 headers

Return the improved article in the same format.`
        }
      ]
    });

    return message.choices[0]?.message?.content || currentContent;
  } catch (error) {
    console.error('Content refresh error:', error);
    throw error;
  }
}

export async function generateSchema(schemaType: string, data: any): Promise<string> {
  try {
    const message = await client.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Generate a valid JSON-LD schema for ${schemaType} with this data:
${JSON.stringify(data, null, 2)}

Return ONLY valid JSON-LD, no explanation.`
        }
      ]
    });

    return message.choices[0]?.message?.content || '{}';
  } catch (error) {
    console.error('Schema generation error:', error);
    return '{}';
  }
}
