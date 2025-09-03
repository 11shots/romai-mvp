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

    const searchTerm = `%${query.toLowerCase()}%`;

    // Recherche optimisée avec PostgreSQL
    const matchingOccupations = await db
      .select({
        codeRome: occupation.codeRome,
        titre: occupation.titre,
        slug: occupation.slug,
        secteur: occupation.secteur,
        description: occupation.description,
        taskCount: sql<number>`COUNT(DISTINCT CASE WHEN ${task.libelleTypeTexte} = 'definition' THEN ${task.id} END)`,
        avgAutomationScore: sql<number>`
          COALESCE(
            ROUND(
              AVG(
                CASE 
                  WHEN ${task.libelleTypeTexte} = 'definition' AND ${automationScore.scorePct} IS NOT NULL 
                  THEN CAST(${automationScore.scorePct} AS NUMERIC) 
                END
              )
            ), 
            0
          )
        `
      })
      .from(occupation)
      .leftJoin(task, eq(task.occupationCodeRome, occupation.codeRome))
      .leftJoin(
        automationScore, 
        sql`${automationScore.taskId} = ${task.id} AND ${automationScore.horizon} = 'now'`
      )
      .where(
        or(
          sql`LOWER(${occupation.titre}) LIKE ${searchTerm}`,
          sql`LOWER(${occupation.codeRome}) LIKE ${searchTerm}`,
          sql`LOWER(${occupation.secteur}) LIKE ${searchTerm}`,
          sql`${occupation.titre} ILIKE ${searchTerm}`, // Utilise l'index ILIKE
          sql`to_tsvector('french', ${occupation.titre}) @@ plainto_tsquery('french', ${query})` // Recherche full-text
        )
      )
      .groupBy(
        occupation.codeRome,
        occupation.titre,
        occupation.slug,
        occupation.secteur,
        occupation.description
      )
      .orderBy(sql`
        CASE
          WHEN LOWER(${occupation.titre}) = ${query.toLowerCase()} THEN 1
          WHEN LOWER(${occupation.titre}) LIKE ${query.toLowerCase() + '%'} THEN 2
          WHEN ${occupation.codeRome} = ${query.toUpperCase()} THEN 3
          ELSE 4
        END,
        ${occupation.titre}
      `)
      .limit(50); // Limiter les résultats pour les performances

    const enrichedOccupations = matchingOccupations.map(occ => ({
      codeRome: occ.codeRome,
      titre: occ.titre,
      slug: occ.slug,
      secteur: occ.secteur,
      description: occ.description,
      taskCount: Number(occ.taskCount) || 0,
      avgAutomationScore: Number(occ.avgAutomationScore) || 0
    }));

    return NextResponse.json({ 
      occupations: enrichedOccupations
    });
  } catch (error) {
    console.error('Error searching occupations:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}