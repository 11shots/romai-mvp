import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { occupation as occupationTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateSlug } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    console.log(`Basic API called with code: ${code}`);

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
      // Recherche par slug - méthode ultra-simple
      console.log('Searching by slug, loading all occupations...');
      const allOccupations = await db.select().from(occupationTable);
      console.log(`Found ${allOccupations.length} total occupations`);
      
      const matchingOcc = allOccupations.find(occ => {
        const generatedSlug = generateSlug(occ.titre);
        console.log(`Comparing "${generatedSlug}" with "${code}"`);
        return generatedSlug === code;
      });
      
      occupationData = matchingOcc ? [matchingOcc] : [];
      console.log(`Slug search result: ${occupationData.length} matches`);
    }

    if (occupationData.length === 0) {
      console.log('No occupation found');
      return NextResponse.json(
        { success: false, error: 'Occupation not found' },
        { status: 404 }
      );
    }

    const occupation = occupationData[0];
    console.log(`Found occupation: ${occupation.titre}`);

    // Retourner seulement les données de base sans tâches pour éviter les erreurs
    return NextResponse.json({ 
      success: true,
      occupation: {
        codeRome: occupation.codeRome,
        titre: occupation.titre,
        slug: generateSlug(occupation.titre),
        secteur: occupation.secteur,
        description: occupation.description,
      },
      tasks: [] // Vide temporairement pour éviter les erreurs de base
    });
  } catch (error) {
    console.error('Basic API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}