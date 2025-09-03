import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.MIGRATION_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚀 Adding libelle_type_texte column to task table...');

    // Ajouter la colonne si elle n'existe pas
    try {
      await db.execute(sql`
        ALTER TABLE task 
        ADD COLUMN IF NOT EXISTS libelle_type_texte VARCHAR(50)
      `);
      console.log('✅ Column libelle_type_texte added');
    } catch (error) {
      console.log('ℹ️ Column already exists or error:', error);
    }

    // Mettre à jour les enregistrements existants en se basant sur le contenu
    const updateResult = await db.execute(sql`
      UPDATE task 
      SET libelle_type_texte = 
        CASE 
          WHEN libelle ILIKE '%emploi est accessible%' 
            OR libelle ILIKE '%diplôme%' 
            OR libelle ILIKE '%formation%' 
            OR libelle ILIKE '%expérience%' 
            OR libelle ILIKE '%niveau bac%' 
            OR libelle ILIKE '%capa%' 
            OR libelle ILIKE '%certificat%' 
            OR libelle ILIKE '%recommandée%' 
          THEN 'acces_metier'
          ELSE 'definition'
        END
      WHERE libelle_type_texte IS NULL
    `);

    console.log('✅ Updated existing records with type classification');

    // Compter les résultats avec une approche plus simple
    const definitionCountResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM task WHERE libelle_type_texte = 'definition'
    `);

    const accesMetierCountResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM task WHERE libelle_type_texte = 'acces_metier'
    `);

    const definitionCount = definitionCountResult.length > 0 ? Number(definitionCountResult[0]?.count || 0) : 0;
    const accesMetierCount = accesMetierCountResult.length > 0 ? Number(accesMetierCountResult[0]?.count || 0) : 0;

    return NextResponse.json({
      success: true,
      message: 'Column added and data classified',
      stats: {
        definitions: definitionCount,
        acces_metier: accesMetierCount,
        totalUpdated: updateResult.rowCount || 0
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