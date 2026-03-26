import { sql } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const migrationPath = join(process.cwd(), 'db/migrations/001_initial_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      await sql(statement);
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully executed ${statements.length} migration statements`
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      message: 'POST to this endpoint to run migrations'
    },
    { status: 200 }
  );
}
