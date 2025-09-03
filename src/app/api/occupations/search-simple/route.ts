import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { occupation, task, automationScore } from '@/db/schema';
import { eq, like, or, sql } from 'drizzle-orm';
import { generateSlug } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ occupations: [] });
    }

    const searchTerm = `%${query.toLowerCase()}%`;

    // Recherche simple compatible avec toutes les versions de DB
    const matchingOccupations = await db
      .select({
        codeRome: occupation.codeRome,
        titre: occupation.titre,
        secteur: occupation.secteur,
        description: occupation.description,
      })
      .from(occupation)
      .where(
        or(
          sql`LOWER(${occupation.titre}) LIKE ${searchTerm}`,
          sql`LOWER(${occupation.codeRome}) LIKE ${searchTerm}`,
          sql`LOWER(${occupation.secteur}) LIKE ${searchTerm}`
        )
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
      .limit(50);

    // Ajouter des métriques basiques
    const enrichedOccupations = await Promise.all(
      matchingOccupations.map(async (occ) => {
        // Compter les tâches
        const taskCount = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(task)
          .where(eq(task.occupationCodeRome, occ.codeRome));

        // Calculer le score moyen d'automatisation
        const avgScore = await db
          .select({ 
            avg: sql<number>`COALESCE(ROUND(AVG(CAST(${automationScore.scorePct} AS NUMERIC))), 0)` 
          })
          .from(automationScore)
          .innerJoin(task, eq(automationScore.taskId, task.id))
          .where(eq(task.occupationCodeRome, occ.codeRome));

        return {
          codeRome: occ.codeRome,
          titre: occ.titre,
          slug: generateSlug(occ.titre), // Génère un slug SEO-friendly à partir du titre
          secteur: occ.secteur,
          description: occ.description,
          taskCount: Number(taskCount[0]?.count) || 0,
          avgAutomationScore: Number(avgScore[0]?.avg) || 0
        };
      })
    );

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