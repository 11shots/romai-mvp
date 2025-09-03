import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { occupation, task, automationScore, userSimulation } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const occupationData = await db
      .select()
      .from(occupation)
      .where(eq(occupation.codeRome, code))
      .limit(1);

    if (occupationData.length === 0) {
      return NextResponse.json(
        { error: 'Occupation not found' },
        { status: 404 }
      );
    }

    const allTasks = await db
      .select({
        id: task.id,
        libelle: task.libelle,
        description: task.description,
        libelleTypeTexte: task.libelleTypeTexte,
        automationScore: sql<number>`COALESCE(${automationScore.scorePct}, 0)`,
      })
      .from(task)
      .leftJoin(
        automationScore,
        sql`${automationScore.taskId} = ${task.id} AND ${automationScore.horizon} = 'now'`
      )
      .where(eq(task.occupationCodeRome, code))
      .orderBy(task.libelle);

    // Filtrer pour ne garder que les vraies tâches (définitions)
    const filteredTasks = allTasks.filter(t => t.libelleTypeTexte === 'definition');

    const processedTasks = filteredTasks.map(t => ({
      id: t.id,
      libelle: t.libelle,
      description: t.description,
      automationScore: Number(t.automationScore) || 0,
    }));

    return NextResponse.json({
      occupation: occupationData[0],
      tasks: processedTasks,
    });
  } catch (error) {
    console.error('Error fetching simulation data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { timeAllocation } = body;

    if (!timeAllocation || typeof timeAllocation !== 'object') {
      return NextResponse.json(
        { error: 'Invalid time allocation data' },
        { status: 400 }
      );
    }

    // Get tasks with their automation scores
    const allTasks = await db
      .select({
        id: task.id,
        libelle: task.libelle,
        libelleTypeTexte: task.libelleTypeTexte,
        automationScore: sql<number>`COALESCE(${automationScore.scorePct}, 0)`,
      })
      .from(task)
      .leftJoin(
        automationScore,
        sql`${automationScore.taskId} = ${task.id} AND ${automationScore.horizon} = 'now'`
      )
      .where(eq(task.occupationCodeRome, code));

    // Filtrer pour ne garder que les vraies tâches (définitions)
    const tasks = allTasks.filter(t => t.libelleTypeTexte === 'definition');

    // Calculate automation simulation
    let totalTime = 0;
    let automatedTime = 0;
    const taskResults: { [key: string]: { timeSpent: number; timeAutomated: number; automationScore: number } } = {};

    for (const taskData of tasks) {
      const taskId = taskData.id.toString();
      const timeSpent = timeAllocation[taskId] || 0;
      const automationScore = Number(taskData.automationScore) || 0;
      const timeAutomated = (timeSpent * automationScore) / 100;

      taskResults[taskId] = {
        timeSpent,
        timeAutomated,
        automationScore
      };

      totalTime += timeSpent;
      automatedTime += timeAutomated;
    }

    const overallAutomationScore = totalTime > 0 ? (automatedTime / totalTime) * 100 : 0;

    return NextResponse.json({
      success: true,
      results: {
        overallAutomationScore: Math.round(overallAutomationScore * 100) / 100,
        totalTime,
        automatedTime: Math.round(automatedTime * 100) / 100,
        taskResults
      }
    });

  } catch (error) {
    console.error('Error processing simulation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}