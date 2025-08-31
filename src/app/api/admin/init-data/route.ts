import { NextRequest, NextResponse } from 'next/server';
import { db, occupation, task } from '@/db/index';
// import romeData from '../../../../../rome_data.json';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.MIGRATION_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer les données depuis le body de la requête
    const romeData = await request.json();
    
    console.log('🚀 Starting data initialization...');
    console.log(`📊 ${romeData.occupations?.length || 0} occupations, ${romeData.tasks?.length || 0} tasks`);

    // Batch insert occupations (lots de 100)
    const occupationBatchSize = 100;
    for (let i = 0; i < romeData.occupations.length; i += occupationBatchSize) {
      const batch = romeData.occupations.slice(i, i + occupationBatchSize);
      try {
        await db.insert(occupation).values(
          batch.map(occ => ({
            codeRome: occ.code_rome,
            titre: occ.titre,
            secteur: occ.secteur,
            description: occ.description,
          }))
        ).onConflictDoNothing();
        console.log(`✅ Occupations batch ${Math.floor(i/occupationBatchSize) + 1}/${Math.ceil(romeData.occupations.length/occupationBatchSize)}`);
      } catch (error) {
        console.error(`❌ Error in occupation batch ${i}:`, error);
      }
    }

    // Batch insert tasks (lots de 500)
    const taskBatchSize = 500;
    for (let i = 0; i < romeData.tasks.length; i += taskBatchSize) {
      const batch = romeData.tasks.slice(i, i + taskBatchSize);
      try {
        await db.insert(task).values(
          batch.map(taskData => ({
            occupationCodeRome: taskData.occupation_code_rome,
            libelle: taskData.libelle,
            description: taskData.description,
          }))
        );
        console.log(`✅ Tasks batch ${Math.floor(i/taskBatchSize) + 1}/${Math.ceil(romeData.tasks.length/taskBatchSize)}`);
      } catch (error) {
        console.error(`❌ Error in task batch ${i}:`, error);
      }
    }

    // Vérification finale
    const occupationCount = await db.select().from(occupation);
    const taskCount = await db.select().from(task);

    return NextResponse.json({
      success: true,
      message: 'Data initialization completed',
      stats: {
        occupations: occupationCount.length,
        tasks: taskCount.length,
      }
    });

  } catch (error) {
    console.error('❌ Initialization failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Initialization failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}