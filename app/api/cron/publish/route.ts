import { NextRequest, NextResponse } from 'next/server';
import { getContentByStatus, updateContent, logEngineJob } from '../../../../lib/db.ts';
import { createBlogPost, injectSchemaMarkup, injectDirectAnswer } from '../../../../lib/shopify.ts';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobStart = Date.now();

  try {
    // Log job start
    await logEngineJob({
      job_type: 'publish',
      status: 'RUNNING'
    });

    // Get approved content
    const approvedContent = await getContentByStatus('approved', 10);

    if (approvedContent.rows.length === 0) {
      await logEngineJob({
        job_type: 'publish',
        status: 'COMPLETED',
        items_processed: 0,
        details: { message: 'No approved content' },
        completed_at: new Date()
      });

      return NextResponse.json(
        { success: true, message: 'No approved content to publish', itemsPublished: 0 },
        { status: 200 }
      );
    }

    const published = [];

    for (const content of approvedContent.rows) {
      try {
        // Prepare HTML with schema and direct answer
        let bodyHtml = content.body_html || '';

        // Inject direct answer block
        if (content.direct_answer) {
          bodyHtml = injectDirectAnswer(bodyHtml, content.direct_answer);
        }

        // Inject schema markup
        if (content.schema_markup) {
          bodyHtml = injectSchemaMarkup(bodyHtml, content.schema_markup);
        }

        // Create blog post
        const shopifyResult = await createBlogPost({
          title: content.title,
          bodyHtml,
          metaTitle: content.meta_title,
          metaDescription: content.meta_description,
          tags: ['genrage', 'blog', content.intent || 'article']
        });

        // Update content with Shopify details
        const now = new Date();
        await updateContent(content.id, {
          status: 'published',
          shopify_article_id: shopifyResult.articleId,
          shopify_published_at: now,
          published_at: now
        });

        published.push({
          id: content.id,
          title: content.title,
          shopifyId: shopifyResult.articleId,
          url: shopifyResult.url
        });
      } catch (error) {
        console.error(`Error publishing content ${content.id}:`, error);
        // Keep content as approved, will retry later
      }
    }

    // Log job completion
    await logEngineJob({
      job_type: 'publish',
      status: 'COMPLETED',
      items_processed: published.length,
      details: {
        published: published.length,
        failed: approvedContent.rows.length - published.length,
        executionTimeMs: Date.now() - jobStart
      },
      completed_at: new Date()
    });

    return NextResponse.json(
      {
        success: true,
        message: `Published ${published.length} content pieces to Shopify`,
        published: published,
        stats: {
          itemsPublished: published.length,
          itemsFailed: approvedContent.rows.length - published.length,
          executionTimeMs: Date.now() - jobStart
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Publish error:', error);

    await logEngineJob({
      job_type: 'publish',
      status: 'FAILED',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      completed_at: new Date()
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
