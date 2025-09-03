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

    // Recherche ultra-rapide sur la table occupation seulement
    const matchingOccupations = await db
      .select({
        codeRome: occupation.codeRome,
        titre: occupation.titre,
        slug: sql<string>`COALESCE(${occupation.slug}, ${occupation.codeRome})`.as('slug'), // Fallback si slug n'existe pas
        secteur: occupation.secteur,
        description: occupation.description,
      })
      .from(occupation)
      .where(
        or(
          sql`${occupation.titre} ILIKE ${searchTerm}`, // Index optimisé
          sql`to_tsvector('french', ${occupation.titre}) @@ plainto_tsquery('french', ${query})`, // Full-text
          sql`${occupation.codeRome} ILIKE ${searchTerm.replace('%', '').toUpperCase() + '%'}`, // Code ROME
          sql`${occupation.secteur} ILIKE ${searchTerm}` // Secteur
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

    // Récupérer les métriques seulement pour les résultats trouvés (requête séparée)
    const occupationCodes = matchingOccupations.map(occ => occ.codeRome);
    
    const metrics = occupationCodes.length > 0 ? await db
      .select({
        codeRome: occupation.codeRome,
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
      .where(sql`${occupation.codeRome} = ANY(${occupationCodes})`)
      .groupBy(occupation.codeRome)
    : [];

    // Construire le résultat final en associant les métriques
    const metricsMap = new Map(metrics.map(m => [m.codeRome, m]));
    
    const enrichedOccupations = matchingOccupations.map(occ => {
      const metric = metricsMap.get(occ.codeRome);
      return {
        codeRome: occ.codeRome,
        titre: occ.titre,
        slug: occ.slug,
        secteur: occ.secteur,
        description: occ.description,
        taskCount: metric ? Number(metric.taskCount) || 0 : 0,
        avgAutomationScore: metric ? Number(metric.avgAutomationScore) || 0 : 0
      };
    });

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