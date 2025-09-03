import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.MIGRATION_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚀 Adding search indexes...');

    // Index pour la recherche textuelle sur le titre des métiers
    try {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_occupation_titre_search 
        ON occupation USING gin(to_tsvector('french', titre))
      `);
      console.log('✅ Full-text search index on occupation.titre created');
    } catch (error) {
      console.log('ℹ️ Error creating full-text index on titre:', error);
    }

    // Index pour la recherche sur le secteur
    try {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_occupation_secteur 
        ON occupation(secteur)
      `);
      console.log('✅ Index on occupation.secteur created');
    } catch (error) {
      console.log('ℹ️ Error creating secteur index:', error);
    }

    // Index pour la recherche par slug (déjà unique mais pour les performances)
    try {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_occupation_slug 
        ON occupation(slug)
      `);
      console.log('✅ Index on occupation.slug created');
    } catch (error) {
      console.log('ℹ️ Error creating slug index:', error);
    }

    // Index pour optimiser les jointures task -> occupation
    try {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_task_occupation_code_rome 
        ON task(occupation_code_rome)
      `);
      console.log('✅ Index on task.occupation_code_rome created');
    } catch (error) {
      console.log('ℹ️ Error creating task occupation index:', error);
    }

    // Index pour filtrer les tâches par type
    try {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_task_libelle_type_texte 
        ON task(libelle_type_texte)
      `);
      console.log('✅ Index on task.libelle_type_texte created');
    } catch (error) {
      console.log('ℹ️ Error creating task type index:', error);
    }

    // Index composite pour optimiser les requêtes de tâches avec scores d'automatisation
    try {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_automation_score_task_horizon 
        ON automation_score(task_id, horizon)
      `);
      console.log('✅ Composite index on automation_score(task_id, horizon) created');
    } catch (error) {
      console.log('ℹ️ Error creating automation score composite index:', error);
    }

    // Index pour la recherche textuelle sur les libellés de tâches (optionnel, peut être lourd)
    try {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_task_libelle_search 
        ON task USING gin(to_tsvector('french', libelle))
      `);
      console.log('✅ Full-text search index on task.libelle created');
    } catch (error) {
      console.log('ℹ️ Error creating full-text index on task libelle:', error);
    }

    // Index ILIKE pour recherche insensible à la casse (plus performant que ILIKE sans index)
    try {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_occupation_titre_ilike 
        ON occupation(LOWER(titre))
      `);
      console.log('✅ ILIKE index on occupation.titre created');
    } catch (error) {
      console.log('ℹ️ Error creating ILIKE index on titre:', error);
    }

    // Afficher les index existants pour vérification
    const indexes = await db.execute(sql`
      SELECT schemaname, tablename, indexname, indexdef
      FROM pg_indexes 
      WHERE tablename IN ('occupation', 'task', 'automation_score')
      AND schemaname = 'public'
      ORDER BY tablename, indexname
    `);

    return NextResponse.json({
      success: true,
      message: 'Search indexes created successfully',
      indexes: indexes.rows
    });

  } catch (error) {
    console.error('❌ Index creation failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Index creation failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}