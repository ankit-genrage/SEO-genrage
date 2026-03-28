import { NextRequest, NextResponse } from 'next/server';
import { insertKeyword, query } from '../../../../lib/db';
import { suggestRelatedKeywords } from '../../../../lib/groq';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

    // Use Groq to generate keyword variants
    const variants = await suggestRelatedKeywords(trimmedKeyword);
    const selectedVariants = variants.slice(0, count);

    if (!Array.isArray(selectedVariants) || selectedVariants.length === 0) {
      throw new Error('Failed to generate keyword variants');
    }

    console.log(`✅ Generated ${selectedVariants.length} variants`);

    // Insert all variants into the database
    const insertedKeywords = [];
    let successCount = 0;
    let duplicateCount = 0;

    for (const variant of selectedVariants) {
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
      totalGenerated: selectedVariants.length,
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
