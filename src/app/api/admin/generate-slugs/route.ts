import { NextRequest, NextResponse } from 'next/server';
import { db, occupation } from '@/db/index';
import { generateSlug } from '@/lib/utils';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.MIGRATION_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🏷️ Starting slug generation...');

    // D'abord, ajouter la colonne slug si elle n'existe pas
    try {
      await db.execute(sql`ALTER TABLE occupation ADD COLUMN IF NOT EXISTS slug VARCHAR(150) UNIQUE`);
      console.log('✅ Column slug added');
    } catch (error) {
      console.log('ℹ️ Column slug already exists or error:', error);
    }

    // Récupérer toutes les occupations
    const occupations = await db.select({
      codeRome: occupation.codeRome,
      titre: occupation.titre
    }).from(occupation);

    console.log(`📊 Found ${occupations.length} occupations to process`);

    let updated = 0;
    let errors = 0;

    // Générer et mettre à jour les slugs
    for (const occ of occupations) {
      try {
        const slug = generateSlug(occ.titre);
        
        // Vérifier l'unicité en ajoutant le code ROME si nécessaire
        let uniqueSlug = slug;
        const existingSlug = await db.select().from(occupation).where(sql`slug = ${uniqueSlug}`).limit(1);
        
        if (existingSlug.length > 0) {
          uniqueSlug = `${slug}-${occ.codeRome.toLowerCase()}`;
        }

        // Mettre à jour avec le slug
        await db.execute(sql`
          UPDATE occupation 
          SET slug = ${uniqueSlug} 
          WHERE code_rome = ${occ.codeRome}
        `);
        
        updated++;
        
        if (updated % 100 === 0) {
          console.log(`✅ Updated ${updated}/${occupations.length} slugs`);
        }
        
      } catch (error) {
        console.error(`❌ Error updating slug for ${occ.codeRome}:`, error);
        errors++;
      }
    }

    console.log(`🎉 Slug generation completed: ${updated} updated, ${errors} errors`);

    return NextResponse.json({
      success: true,
      message: 'Slugs generated successfully',
      stats: {
        total: occupations.length,
        updated,
        errors
      }
    });

  } catch (error) {
    console.error('❌ Slug generation failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Slug generation failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}