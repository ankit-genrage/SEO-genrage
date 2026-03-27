import { NextRequest, NextResponse } from 'next/server';
import { insertContent, query } from '../../../../lib/db';
import { generateContent } from '../../../../lib/claude';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, keyword_id } = body;

    if (!keyword && !keyword_id) {
      return NextResponse.json(
        { error: 'Either keyword or keyword_id is required' },
        { status: 400 }
      );
    }

    let targetKeyword = keyword;
    let targetKeywordId = keyword_id;

    // If keyword_id provided, fetch the keyword from database
    if (keyword_id && !keyword) {
      const result = await query(
        'SELECT id, keyword FROM keywords WHERE id = $1',
        [keyword_id]
      );

      if (!result.rows || result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Keyword not found' },
          { status: 404 }
        );
      }

      targetKeyword = result.rows[0].keyword;
      targetKeywordId = result.rows[0].id;
    }

    if (!targetKeyword) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    console.log(`📝 Generating content for keyword: "${targetKeyword}"`);

    // Check if content already exists for this keyword (via keyword_id)
    if (targetKeywordId) {
      const existingContent = await query(
        'SELECT id FROM content WHERE keyword_id = $1',
        [targetKeywordId]
      );

      if (existingContent.rows && existingContent.rows.length > 0) {
        return NextResponse.json(
          { 
            error: 'Content already exists for this keyword',
            contentId: existingContent.rows[0].id
          },
          { status: 409 }
        );
      }
    }

    // Generate blog content using Claude
    console.log('🤖 Calling Claude to generate content...');
    const contentResult = await generateContent({
      keyword: targetKeyword,
      intent: 'informational',
      contentType: 'blog',
      brief: null
    });
    const content = contentResult.body;

    console.log('✅ Content generated, inserting into database...');

    // Generate slug from keyword
    const slug = targetKeyword
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Insert content into database
    const insertedContent = await insertContent({
      title: `${targetKeyword.charAt(0).toUpperCase() + targetKeyword.slice(1)} - Guide to Streetwear`,
      slug: slug || 'untitled',
      body_markdown: content,
      keyword_id: targetKeywordId || 0,
      content_type: 'blog',
      intent: 'informational',
      meta_description: `Complete guide to ${targetKeyword}. Trends, styling tips, and GENRAGE picks for the perfect ${targetKeyword}.`,
      meta_title: `${targetKeyword.charAt(0).toUpperCase() + targetKeyword.slice(1)} - GENRAGE`
    });

    console.log('✅ Content inserted successfully');

    return NextResponse.json({
      success: true,
      message: 'Content generated successfully',
      contentId: insertedContent.id,
      keyword: targetKeyword,
      title: insertedContent.title,
      slug: insertedContent.slug,
      status: 'draft',
      excerpt: insertedContent.excerpt
    });
  } catch (error) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get all manually created content
    const result = await query(
      `SELECT 
        c.id, c.keyword, c.title, c.slug, c.status, c.created_at, c.updated_at,
        k.opportunity_score
      FROM content c
      LEFT JOIN keywords k ON c.keyword_id = k.id
      WHERE c.source = $1
      ORDER BY c.created_at DESC
      LIMIT 50`,
      ['manual']
    );

    return NextResponse.json({
      success: true,
      content: result.rows || [],
      count: (result.rows || []).length
    });
  } catch (error) {
    console.error('Fetch manual content error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
