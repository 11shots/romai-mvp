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

    const result = await db
      .insert(userSimulation)
      .values({
        userId: null, // For now, we don't have user authentication
        occupationCodeRome,
        jsonTempsParTache: JSON.stringify(timeAllocations),
        scoreGlobal: globalScore,
      });

    return NextResponse.json({
      success: true,
      simulation: {
        id: result.insertId,
        occupationCodeRome,
        jsonTempsParTache: JSON.stringify(timeAllocations),
        scoreGlobal: globalScore,
      },
    });
  } catch (error) {
    console.error('Error saving simulation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}