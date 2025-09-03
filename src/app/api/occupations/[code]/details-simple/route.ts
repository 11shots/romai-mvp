import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { task, automationScore, occupation as occupationTable } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
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
      // Recherche par code ROME
      occupationData = await db
        .select()
        .from(occupationTable)
        .where(eq(occupationTable.codeRome, code))
        .limit(1);
    } else {
      // Recherche par slug - fallback compatible
      const allOccupations = await db.select().from(occupationTable);
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

    // Récupérer les tâches de manière très conservative
    let allTasks = [];
    try {
      // Essayer d'abord avec automation_score
      allTasks = await db
        .select({
          id: task.id,
          libelle: task.libelle,
          description: task.description,
          automationScore: sql<number>`COALESCE(${automationScore.scorePct}, NULL)`,
          analysis: automationScore.analysis,
          reasoning: automationScore.reasoning,
        })
        .from(task)
        .leftJoin(
          automationScore,
          sql`${automationScore.taskId} = ${task.id} AND ${automationScore.horizon} = 'now'`
        )
        .where(eq(task.occupationCodeRome, occupation.codeRome))
        .orderBy(task.libelle);
    } catch (error) {
      console.log('Automation score join failed, trying without:', error);
      try {
        // Fallback sans automation_score si la table n'existe pas
        const basicTasks = await db
          .select({
            id: task.id,
            libelle: task.libelle,
            description: task.description,
          })
          .from(task)
          .where(eq(task.occupationCodeRome, occupation.codeRome))
          .orderBy(task.libelle);
        
        allTasks = basicTasks.map(t => ({
          ...t,
          automationScore: null,
          analysis: null,
          reasoning: null,
        }));
      } catch (basicError) {
        console.error('Even basic task query failed:', basicError);
        allTasks = [];
      }
    }

    // Filtrage simple côté JavaScript
    const realTasks = allTasks.filter(t => {
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

    // Dédupliquer
    const tasks = realTasks.reduce((acc, current) => {
      const existingTask = acc.find(t => t.libelle === current.libelle);
      if (!existingTask) {
        acc.push(current);
      } else if (current.automationScore && !existingTask.automationScore) {
        const index = acc.indexOf(existingTask);
        acc[index] = current;
      }
      return acc;
    }, [] as typeof realTasks);

    const processedTasks = tasks.map(t => ({
      id: t.id,
      libelle: t.libelle,
      description: t.description,
      automationScore: Number(t.automationScore) || 0,
      analysis: t.analysis,
      reasoning: t.reasoning,
    }));

    return NextResponse.json({ 
      success: true,
      occupation: {
        ...occupation,
        slug: generateSlug(occupation.titre)
      },
      tasks: processedTasks
    });
  } catch (error) {
    console.error('Error fetching occupation details:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}