import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const quiz = await prisma.quiz.findUnique({
      where: { id: resolvedParams.id },
      include: {
        questions: true
      }
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error: any) {
    console.error('Error fetching quiz details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
