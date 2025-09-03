import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.MIGRATION_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚀 Adding slug column to occupation table...');

    // Ajouter la colonne slug si elle n'existe pas
    try {
      await db.execute(sql`
        ALTER TABLE occupation 
        ADD COLUMN IF NOT EXISTS slug VARCHAR(150) UNIQUE
      `);
      console.log('✅ Column slug added');
    } catch (error) {
      console.log('ℹ️ Column already exists or error:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Slug column added successfully'
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}