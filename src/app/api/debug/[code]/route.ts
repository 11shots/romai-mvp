import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    const debug = {
      received_code: code,
      is_rome_code: /^[A-Z]\d{4}$/.test(code),
      environment: process.env.NODE_ENV,
      database_url_exists: !!process.env.DATABASE_URL,
      database_url_preview: process.env.DATABASE_URL?.substring(0, 20) + '...',
    };

    // Test database connection
    try {
      const { db } = await import('@/db');
      const { occupation } = await import('@/db/schema');
      
      // Test basic query
      const testQuery = await db.select().from(occupation).limit(1);
      debug.database_connection = 'success';
      debug.sample_occupation = testQuery[0] || 'no data';
      debug.has_data = testQuery.length > 0;
      
      if (!debug.is_rome_code) {
        // Test slug search
        const { generateSlug } = await import('@/lib/utils');
        const allOccupations = await db.select().from(occupation).limit(10);
        debug.total_occupations_sample = allOccupations.length;
        debug.sample_slugs = allOccupations.map(occ => ({
          titre: occ.titre,
          slug: generateSlug(occ.titre),
          matches: generateSlug(occ.titre) === code
        }));
        debug.found_match = allOccupations.find(occ => generateSlug(occ.titre) === code);
      }
      
    } catch (dbError) {
      debug.database_connection = 'failed';
      debug.database_error = dbError.message;
    }

    return NextResponse.json(debug);
  } catch (error) {
    return NextResponse.json({
      error: 'Debug failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}