import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
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
      // Recherche par code ROME avec requête SQL directe (sans référencer slug)
      occupationData = await db.execute(sql`
        SELECT code_rome, titre, secteur, description 
        FROM occupation 
        WHERE code_rome = ${code} 
        LIMIT 1
      `);
    } else {
      // Recherche par slug - charger tout et filtrer
      const allOccupations = await db.execute(sql`
        SELECT code_rome, titre, secteur, description 
        FROM occupation
      `);
      
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

    return NextResponse.json({ 
      success: true,
      occupation: {
        codeRome: occupation.code_rome,
        titre: occupation.titre,
        slug: generateSlug(occupation.titre),
        secteur: occupation.secteur,
        description: occupation.description,
      },
      tasks: [] // Temporairement vide pour éviter les problèmes
    });
  } catch (error) {
    console.error('Minimal API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}