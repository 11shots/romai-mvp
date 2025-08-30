import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { task, automationScore } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    const tasks = await db
      .select({
        id: task.id,
        libelle: task.libelle,
        automationScore: sql<number>`COALESCE(${automationScore.scorePct}, 0)`,
      })
      .from(task)
      .leftJoin(
        automationScore,
        sql`${automationScore.taskId} = ${task.id} AND ${automationScore.horizon} = 'now'`
      )
      .where(eq(task.occupationCodeRome, code))
      .orderBy(task.libelle);

    const processedTasks = tasks.map(t => ({
      id: t.id,
      libelle: t.libelle,
      automationScore: Number(t.automationScore) || 0,
    }));

    return NextResponse.json({ 
      success: true,
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