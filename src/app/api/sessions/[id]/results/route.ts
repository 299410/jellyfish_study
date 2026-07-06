import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: sessionId } = await params;
    const body = await req.json();
    const { question, userAnswer, feedback } = body;

    const result = await prisma.sessionResult.create({
      data: {
        sessionId,
        question,
        userAnswer,
        feedback
      }
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
