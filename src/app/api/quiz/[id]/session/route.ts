import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { score, total, timeSpent } = await req.json();

    if (score === undefined || total === undefined || timeSpent === undefined) {
      return NextResponse.json({ error: 'Missing session data' }, { status: 400 });
    }

    const session = await prisma.quizSession.create({
      data: {
        quizId: resolvedParams.id,
        score,
        total,
        timeSpent,
      }
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error: any) {
    console.error('Error saving quiz session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
