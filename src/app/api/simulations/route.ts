import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userSimulation } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { occupationCodeRome, timeAllocations, globalScore } = body;

    if (!occupationCodeRome || !timeAllocations || globalScore === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const simulation = await db
      .insert(userSimulation)
      .values({
        userId: null, // For now, we don't have user authentication
        occupationCodeRome,
        jsonTempsParTache: JSON.stringify(timeAllocations),
        scoreGlobal: globalScore,
      })
      .returning();

    return NextResponse.json({
      success: true,
      simulation: simulation[0],
    });
  } catch (error) {
    console.error('Error saving simulation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}