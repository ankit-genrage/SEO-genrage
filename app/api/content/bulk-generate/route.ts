import { NextRequest, NextResponse } from 'next/server';
import { query, insertContent } from '../../../../lib/db';
import { generateContentBrief, generateContent, generateSchema } from '../../../../lib/groq';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for bulk operations

interface GenerationResult {
  total: number;
  generated: number;
  failed: number;
  skipped: number;
  details: Array<{
    keyword_id: number;
    keyword: string;
    status: 'generated' | 'failed' | 'skipped';
    message?: string;
    content_id?: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { limit = 5, intent_filter } = body;

    if (limit < 1 || limit > 20) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 20' },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting bulk content generation (limit: ${limit})...`);

    // Get keywords without content
    let whereClause = 'content_id IS NULL';
    const params: any[] = [];

    if (intent_filter) {
      whereClause += ' AND intent = $1';
      params.push(intent_filter);
    }

    const keywordsResult = await query(
      `SELECT * FROM keywords WHERE ${whereClause} 
       ORDER BY opportunity_score DESC LIMIT $${params.length + 1}`,
      [...params, limit]
    );

    const keywords = keywordsResult.rows || [];
    const result: GenerationResult = {
      total: keywords.length,
      generated: 0,
      failed: 0,
      skipped: 0,
      details: []
    };

    if (keywords.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No keywords found to generate content for',
        result
      });
    }

    console.log(`📝 Found ${keywords.length} keywords to generate content for`);

    for (const kw of keywords) {
      try {
        console.log(`\n🔄 Generating content for: "${kw.keyword}"`);

        // Step 1: Generate brief
        console.log(`  → Generating brief...`);
        const brief = await generateContentBrief(kw.keyword, kw.intent);

        // Step 2: Generate full content
        console.log(`  → Generating full content...`);
        const contentData = await generateContent({
          keyword: kw.keyword,
          intent: kw.intent,
          contentType: 'blog',
          brief
        });

        // Step 3: Generate schema
        console.log(`  → Generating schema...`);
        const schema = await generateSchema('BlogPosting', {
          title: contentData.title,
          description: contentData.meta_description,
          faqs: contentData.faq
        });

        // Step 4: Save content to database
        const slug = contentData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        const savedContent = await insertContent({
          keyword_id: kw.id,
          title: contentData.title,
          slug: slug,
          content_type: 'blog',
          intent: kw.intent,
          body_markdown: contentData.body,
          meta_title: contentData.meta_title,
          meta_description: contentData.meta_description,
          direct_answer: contentData.direct_answer,
          faq_json: contentData.faq,
          schema_markup: schema
        });

        // Step 5: Update keyword with content_id
        await query(
          'UPDATE keywords SET content_id = $1, status = $2, updated_at = NOW() WHERE id = $3',
          [savedContent.id, 'draft', kw.id]
        );

        result.generated++;
        result.details.push({
          keyword_id: kw.id,
          keyword: kw.keyword,
          status: 'generated',
          content_id: savedContent.id
        });

        console.log(`  ✅ Content generated and saved (ID: ${savedContent.id})`);
      } catch (error) {
        result.failed++;
        result.details.push({
          keyword_id: kw.id,
          keyword: kw.keyword,
          status: 'failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`  ❌ Error generating content:`, error);
      }
    }

    console.log(`\n📊 Bulk generation complete: ${result.generated} generated, ${result.failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Generated ${result.generated} content pieces, ${result.failed} failed`,
      result
    });
  } catch (error) {
    console.error('Bulk content generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint to show status of content generation queue
export async function GET(request: NextRequest) {
  try {
    const keywordsResult = await query(
      `SELECT COUNT(*) as total, 
              SUM(CASE WHEN content_id IS NULL THEN 1 ELSE 0 END) as pending,
              SUM(CASE WHEN content_id IS NOT NULL THEN 1 ELSE 0 END) as completed
       FROM keywords`
    );

    const stats = keywordsResult.rows?.[0] || {};

    return NextResponse.json({
      success: true,
      queue_status: {
        total_keywords: stats.total,
        pending_content_generation: stats.pending,
        completed_content: stats.completed
      }
    });
  } catch (error) {
    console.error('Queue status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
