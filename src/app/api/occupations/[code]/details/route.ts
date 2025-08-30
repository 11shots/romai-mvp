import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { task, automationScore, occupation } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { analyzeOccupationTasks } from '@/lib/llm-analysis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Récupérer les informations du métier
    const occupationData = await db
      .select()
      .from(occupation)
      .where(eq(occupation.codeRome, code))
      .limit(1);

    if (occupationData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Occupation not found' },
        { status: 404 }
      );
    }

    // Récupérer les tâches avec leurs scores d'automatisation
    const tasks = await db
      .select({
        id: task.id,
        libelle: task.libelle,
        description: task.description,
        automationScore: sql<number>`COALESCE(${automationScore.scorePct}, NULL)`,
        analysis: automationScore.analysis,
        reasoning: automationScore.reasoning,
        source: automationScore.source,
      })
      .from(task)
      .leftJoin(
        automationScore,
        sql`${automationScore.taskId} = ${task.id} AND ${automationScore.horizon} = 'now'`
      )
      .where(eq(task.occupationCodeRome, code))
      .orderBy(task.libelle);

    // Vérifier si on a besoin de faire une analyse LLM
    // Une analyse LLM est considérée comme existante si au moins une tâche a une analysis non-null
    const hasLLMAnalysis = tasks.some(t => t.analysis && t.analysis.trim().length > 0);
    
    console.log(`[${code}] Analyse LLM existante: ${hasLLMAnalysis}, Tâches: ${tasks.length}`);
    
    if (!hasLLMAnalysis && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
      // Déclencher l'analyse LLM en arrière-plan
      try {
        console.log(`Démarrage de l'analyse LLM pour ${code}...`);
        
        const tasksForAnalysis = tasks.map(t => ({
          id: t.id,
          libelle: t.libelle,
          description: t.description || undefined
        }));

        const analysis = await analyzeOccupationTasks(occupationData[0], tasksForAnalysis);
        
        // Sauvegarder les résultats dans la base
        for (const taskAnalysis of analysis.tasks) {
          // D'abord essayer de mettre à jour si existe, sinon insérer
          const existingScore = await db.select().from(automationScore)
            .where(sql`${automationScore.taskId} = ${taskAnalysis.taskId} AND ${automationScore.horizon} = 'now'`)
            .limit(1);
            
          if (existingScore.length > 0) {
            // Mettre à jour
            await db.update(automationScore)
              .set({
                scorePct: taskAnalysis.automationScore.toString(),
                analysis: taskAnalysis.analysis,
                reasoning: taskAnalysis.reasoning,
                source: 'ai_calculated',
                updatedAt: sql`NOW()`,
              })
              .where(sql`${automationScore.taskId} = ${taskAnalysis.taskId} AND ${automationScore.horizon} = 'now'`);
          } else {
            // Insérer
            await db.insert(automationScore).values({
              taskId: taskAnalysis.taskId,
              scorePct: taskAnalysis.automationScore.toString(),
              horizon: 'now',
              source: 'ai_calculated',
              analysis: taskAnalysis.analysis,
              reasoning: taskAnalysis.reasoning,
            });
          }
        }
        
        console.log(`Analyse LLM terminée pour ${code}`);
        
        // Recharger les données avec les nouveaux scores
        const updatedTasks = await db
          .select({
            id: task.id,
            libelle: task.libelle,
            description: task.description,
            automationScore: sql<number>`COALESCE(${automationScore.scorePct}, 0)`,
            analysis: automationScore.analysis,
            reasoning: automationScore.reasoning,
          })
          .from(task)
          .leftJoin(
            automationScore,
            sql`${automationScore.taskId} = ${task.id} AND ${automationScore.horizon} = 'now'`
          )
          .where(eq(task.occupationCodeRome, code))
          .orderBy(task.libelle);

        const processedTasks = updatedTasks.map(t => ({
          id: t.id,
          libelle: t.libelle,
          description: t.description,
          automationScore: Number(t.automationScore) || 0,
          analysis: t.analysis,
          reasoning: t.reasoning,
        }));

        return NextResponse.json({ 
          success: true,
          occupation: occupationData[0],
          tasks: processedTasks,
          llmAnalysis: {
            summary: analysis.summary,
            overallScore: analysis.overallScore
          }
        });
        
      } catch (llmError) {
        console.error('Erreur lors de l\'analyse LLM:', llmError);
        // Continuer avec les données existantes en cas d'erreur LLM
      }
    }

    // Retourner les données existantes
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
      occupation: occupationData[0],
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