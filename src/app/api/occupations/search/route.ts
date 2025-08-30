import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { occupation, task, automationScore } from '@/db/schema';
import { eq, like, or, sql } from 'drizzle-orm';

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ occupations: [] });
    }

    // Get all occupations and filter in JavaScript for better accent handling
    const allOccupations = await db.select().from(occupation);
    
    const normalizedQuery = normalizeString(query);
    
    const matchingOccupations = allOccupations.filter(occ => {
      const normalizedTitle = normalizeString(occ.titre);
      const normalizedCode = normalizeString(occ.codeRome);
      const normalizedSector = normalizeString(occ.secteur || '');
      
      return normalizedTitle.includes(normalizedQuery) ||
             normalizedCode.includes(normalizedQuery) ||
             normalizedSector.includes(normalizedQuery);
    });


    // Then get task counts and automation scores for each occupation
    const enrichedOccupations = [];
    
    for (const occ of matchingOccupations) {
      // Count tasks
      const taskCount = await db
        .select({ count: task.id })
        .from(task)
        .where(eq(task.occupationCodeRome, occ.codeRome));

      // Calculate average automation score
      const scores = await db
        .select({ score: automationScore.scorePct })
        .from(automationScore)
        .innerJoin(task, eq(automationScore.taskId, task.id))
        .where(
          eq(task.occupationCodeRome, occ.codeRome)
        );

      const avgScore = scores.length > 0 
        ? scores.reduce((sum, s) => sum + (s.score || 0), 0) / scores.length
        : 0;

      enrichedOccupations.push({
        ...occ,
        taskCount: taskCount.length,
        avgAutomationScore: Math.round(avgScore)
      });
    }

    return NextResponse.json({ 
      occupations: enrichedOccupations
    });
  } catch (error) {
    console.error('Error searching occupations:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}