import { NextRequest, NextResponse } from 'next/server';
import { query, updateContent } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await query('SELECT * FROM content WHERE id = $1', [params.id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, content: result.rows[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const contentId = parseInt(params.id);

    const result = await updateContent(contentId, body);

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, content: result },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update content' },
      { status: 500 }
    );
  }
}
