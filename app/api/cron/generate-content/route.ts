import { NextRequest, NextResponse } from 'next/server';
import { getQueuedContent, updateContent, updateQueueStatus, logEngineJob } from '../../../../lib/db.ts';
import {
  generateContentBrief,
  generateContent,
  generateSchema
} from '../../../../lib/claude.ts';
import { marked } from 'marked';

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
      job_type: 'content_generation',
      status: 'RUNNING'
    });

    // Get queued content items (max 3 per day to control costs)
    const queuedItems = await getQueuedContent(3);

    if (queuedItems.rows.length === 0) {
      await logEngineJob({
        job_type: 'content_generation',
        status: 'COMPLETED',
        items_processed: 0,
        details: { message: 'No queued items' },
        completed_at: new Date()
      });

      return NextResponse.json(
        { success: true, message: 'No items in queue', itemsProcessed: 0 },
        { status: 200 }
      );
    }

    const generatedContent = [];
    let totalCost = 0;

    for (const queueItem of queuedItems.rows) {
      try {
        // Generate content brief
        const brief = await generateContentBrief(
          queueItem.keyword,
          'informational', // intent will be more sophisticated in production
          []
        );

        if (!brief) {
          throw new Error('Failed to generate content brief');
        }

        // Generate full content
        const generatedPiece = await generateContent({
          keyword: queueItem.keyword,
          intent: 'informational',
          contentType: 'blog_post',
          brief
        });

        // Generate schema markup
        const schema = await generateSchema('Article', {
          title: generatedPiece.title,
          description: generatedPiece.meta_description,
          faqs: generatedPiece.faq
        });

        // Convert markdown to HTML (simplified)
        let htmlBody = '';
        try {
          htmlBody = await marked(generatedPiece.body);
        } catch {
          htmlBody = `<p>${generatedPiece.body}</p>`;
        }

        // Create slug from title
        const slug = generatedPiece.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        // Insert content
        const createdContent = await updateContent(0, {
          title: generatedPiece.title,
          slug,
          keyword_id: queueItem.keyword_id,
          content_type: 'blog_post',
          intent: 'informational',
          body_markdown: generatedPiece.body,
          body_html: htmlBody,
          meta_title: generatedPiece.meta_title,
          meta_description: generatedPiece.meta_description,
          direct_answer: generatedPiece.direct_answer,
          faq_json: generatedPiece.faq,
          schema_markup: schema,
          status: 'review',
          model_used: 'claude-sonnet-4',
          generation_cost: 0.003 // Approximate cost per piece
        });

        // Update queue status
        await updateQueueStatus(queueItem.id, 'generated');

        generatedContent.push({
          id: createdContent?.id,
          title: generatedPiece.title,
          keyword: queueItem.keyword,
          status: 'review'
        });

        totalCost += 0.003;
      } catch (error) {
        console.error(`Error generating content for queue item ${queueItem.id}:`, error);
        await updateQueueStatus(queueItem.id, 'failed');
      }
    }

    // Log job completion
    await logEngineJob({
      job_type: 'content_generation',
      status: 'COMPLETED',
      items_processed: generatedContent.length,
      details: {
        generated: generatedContent.length,
        totalCost: Math.round(totalCost * 100) / 100,
        executionTimeMs: Date.now() - jobStart
      },
      completed_at: new Date()
    });

    return NextResponse.json(
      {
        success: true,
        message: `Generated ${generatedContent.length} content pieces`,
        generated: generatedContent,
        stats: {
          itemsProcessed: generatedContent.length,
          estimatedCost: Math.round(totalCost * 100) / 100,
          executionTimeMs: Date.now() - jobStart
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Content generation error:', error);

    await logEngineJob({
      job_type: 'content_generation',
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
