import { NextRequest, NextResponse } from 'next/server';
import { db, occupation, task } from '@/db/index';
import { sql } from 'drizzle-orm';

interface RomeData {
  occupations: Array<{
    code_rome: string;
    titre: string;
    secteur?: string;
    description?: string;
  }>;
  tasks: Array<{
    occupation_code_rome: string;
    libelle: string;
    description?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification (optionnel - à adapter selon tes besoins)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.MIGRATION_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: RomeData = await request.json();

    console.log('🚀 Starting migration...');
    console.log(`📊 Found ${data.occupations?.length || 0} occupations and ${data.tasks?.length || 0} tasks`);

    // Insérer les occupations
    if (data.occupations && data.occupations.length > 0) {
      console.log('📝 Inserting occupations...');
      
      for (const occ of data.occupations) {
        try {
          await db.insert(occupation).values({
            codeRome: occ.code_rome,
            titre: occ.titre,
            secteur: occ.secteur || null,
            description: occ.description || null,
          }).onConflictDoNothing();
        } catch (error) {
          console.error(`❌ Error inserting occupation ${occ.code_rome}:`, error);
        }
      }
      
      console.log('✅ Occupations inserted');
    }

    // Insérer les tâches
    if (data.tasks && data.tasks.length > 0) {
      console.log('📝 Inserting tasks...');
      
      for (const taskData of data.tasks) {
        try {
          await db.insert(task).values({
            occupationCodeRome: taskData.occupation_code_rome,
            libelle: taskData.libelle,
            description: taskData.description || null,
          });
        } catch (error) {
          console.error(`❌ Error inserting task for ${taskData.occupation_code_rome}:`, error);
        }
      }
      
      console.log('✅ Tasks inserted');
    }

    // Statistiques finales
    const occupationCount = await db.select().from(occupation);
    const taskCount = await db.select().from(task);

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      stats: {
        occupations: occupationCount.length,
        tasks: taskCount.length,
      }
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}