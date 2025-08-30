import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { occupation, task, automationScore } from '@/db/schema';
import { sql, like, count, avg } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ occupations: [] });
    }

    const searchQuery = `%${query.trim()}%`;

    const occupations = await db
      .select({
        codeRome: occupation.codeRome,
        titre: occupation.titre,
        secteur: occupation.secteur,
        description: occupation.description,
        taskCount: count(task.id),
        avgAutomationScore: sql<number>`COALESCE(AVG(${automationScore.scorePct}), 0)`,
      })
      .from(occupation)
      .leftJoin(task, sql`${task.occupationCodeRome} = ${occupation.codeRome}`)
      .leftJoin(
        automationScore,
        sql`${automationScore.taskId} = ${task.id} AND ${automationScore.horizon} = 'now'`
      )
      .where(
        sql`${occupation.titre} LIKE ${searchQuery} OR ${occupation.codeRome} LIKE ${searchQuery}`
      )
      .groupBy(occupation.codeRome, occupation.titre, occupation.secteur, occupation.description)
      .orderBy(sql`${occupation.titre}`)
      .limit(50);

    return NextResponse.json({ 
      occupations: occupations.map(occ => ({
        ...occ,
        avgAutomationScore: Number(occ.avgAutomationScore) || 0
      })) 
    });
  } catch (error) {
    console.error('Error searching occupations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}