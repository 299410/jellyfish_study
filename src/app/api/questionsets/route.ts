import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sets = await prisma.questionSet.findMany({
      include: { questions: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(sets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, questions } = body;
    
    if (!name || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const newSet = await prisma.questionSet.create({
      data: {
        name,
        questions: {
          create: questions.map((q: string, i: number) => ({ content: q, order: i }))
        }
      },
      include: { questions: true }
    });
    return NextResponse.json(newSet);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
