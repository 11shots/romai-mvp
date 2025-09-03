import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { generateSlug } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Déterminer si c'est un code ROME ou un slug
    const isCodeRome = /^[A-Z]\d{4}$/.test(code);
    
    let occupationData;
    
    if (isCodeRome) {
      // Recherche par code ROME avec requête SQL directe (sans référencer slug)
      occupationData = await db.execute(sql`
        SELECT code_rome, titre, secteur, description 
        FROM occupation 
        WHERE code_rome = ${code} 
        LIMIT 1
      `);
    } else {
      // Recherche par slug - charger tout et filtrer
      const allOccupations = await db.execute(sql`
        SELECT code_rome, titre, secteur, description 
        FROM occupation
      `);
      
      const matchingOcc = allOccupations.find(occ => generateSlug(occ.titre) === code);
      occupationData = matchingOcc ? [matchingOcc] : [];
    }

    if (occupationData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Occupation not found' },
        { status: 404 }
      );
    }

    const occupation = occupationData[0];

    // Récupérer les tâches avec requête SQL directe
    let tasks = [];
    try {
      const tasksResult = await db.execute(sql`
        SELECT t.id, t.libelle, t.description,
               COALESCE(CAST(a.score_pct AS NUMERIC), 0) as automation_score,
               a.analysis, a.reasoning
        FROM task t
        LEFT JOIN automation_score a ON a.task_id = t.id AND a.horizon = 'now'
        WHERE t.occupation_code_rome = ${occupation.code_rome}
        ORDER BY t.libelle
      `);
      
      // Filtrer les vraies tâches
      const realTasks = tasksResult.filter(t => {
        const libelle = t.libelle.toLowerCase();
        return !libelle.includes('emploi est accessible') &&
               !libelle.includes('diplôme') &&
               !libelle.includes('formation') &&
               !libelle.includes('expérience') &&
               !libelle.includes('niveau bac') &&
               !libelle.includes('capa') &&
               !libelle.includes('certificat') &&
               !libelle.includes('recommandée') &&
               libelle.length > 20;
      });

      tasks = realTasks.map(t => ({
        id: t.id,
        libelle: t.libelle,
        automationScore: Number(t.automation_score) || undefined,
        analysis: t.analysis,
        reasoning: t.reasoning,
      }));
    } catch (taskError) {
      console.log('Task loading failed, returning empty array:', taskError);
      tasks = [];
    }

    return NextResponse.json({ 
      success: true,
      occupation: {
        codeRome: occupation.code_rome,
        titre: occupation.titre,
        slug: generateSlug(occupation.titre),
        secteur: occupation.secteur,
        description: occupation.description,
      },
      tasks
    });
  } catch (error) {
    console.error('Minimal API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}