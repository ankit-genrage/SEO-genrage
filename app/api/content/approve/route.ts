import { NextRequest, NextResponse } from 'next/server';
import { updateContent } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content_id } = body;

    if (!content_id) {
      return NextResponse.json(
        { success: false, error: 'content_id is required' },
        { status: 400 }
      );
    }

    const result = await updateContent(content_id, {
      status: 'approved'
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Content approved', content: result },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error approving content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to approve content' },
      { status: 500 }
    );
  }
}
