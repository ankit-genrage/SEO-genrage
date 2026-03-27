import { NextRequest, NextResponse } from 'next/server';
import { insertKeyword, query } from '../../../../lib/db';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const maxDuration = 60;

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, count = 10 } = body;

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { error: 'Keyword is required and must be a string' },
        { status: 400 }
      );
    }

    const trimmedKeyword = keyword.trim();

    console.log(`📝 Generating ${count} variants for keyword: "${trimmedKeyword}"`);

    // Use Claude to generate keyword variants
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Generate ${count} SEO-friendly keyword variations for: "${trimmedKeyword}"
          
Requirements:
- Include long-tail variations
- Include intent modifiers (for men, cheap, buy, near me, how to, etc)
- Relevant to streetwear/fashion niche
- Return ONLY a JSON array of keywords, no other text
- Format: ["keyword1", "keyword2", ...]
- Do NOT include the original keyword in the list

Original keyword: "${trimmedKeyword}"`
        }
      ]
    });

    // Extract the response text
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    console.log('Claude response:', responseText);

    // Parse the JSON array
    const variants: string[] = JSON.parse(responseText);

    if (!Array.isArray(variants)) {
      throw new Error('Claude did not return an array of keywords');
    }

    console.log(`✅ Generated ${variants.length} variants`);

    // Insert all variants into the database
    const insertedKeywords = [];
    let successCount = 0;
    let duplicateCount = 0;

    for (const variant of variants) {
      const variantLower = variant.trim().toLowerCase();

      if (variantLower.length === 0) continue;

      // Check if keyword already exists
      const existingResult = await query(
        'SELECT id FROM keywords WHERE keyword = $1',
        [variantLower]
      );

      if (existingResult.rows && existingResult.rows.length > 0) {
        duplicateCount++;
        continue;
      }

      // Insert the variant
      const newKeyword = await insertKeyword({
        keyword: variantLower,
        source: 'manual',
        search_volume: 0,
        current_position: 999,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        intent: 'informational',
        difficulty_score: 50,
        relevance_score: 65,
        opportunity_score: 55
      });

      insertedKeywords.push(newKeyword);
      successCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Generated and inserted ${successCount} keyword variants`,
      originalKeyword: trimmedKeyword,
      totalGenerated: variants.length,
      inserted: successCount,
      duplicates: duplicateCount,
      keywords: insertedKeywords
    });
  } catch (error) {
    console.error('Keyword variant generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
