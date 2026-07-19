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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const { title, timeLimit, questions } = body;

    if (!title || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Missing title or questions array' }, { status: 400 });
    }

    // Delete existing questions
    await prisma.quizQuestion.deleteMany({
      where: { quizId: resolvedParams.id }
    });

    // Update quiz and recreate questions
    const updatedQuiz = await prisma.quiz.update({
      where: { id: resolvedParams.id },
      data: {
        title,
        timeLimit: timeLimit ? parseInt(timeLimit) : null,
        questions: {
          create: questions.map((q: any) => ({
            content: q.content,
            options: q.options,
            correctAnswer: q.correctAnswer,
          }))
        }
      },
      include: {
        questions: true
      }
    });

    return NextResponse.json(updatedQuiz, { status: 200 });
  } catch (error: any) {
    console.error('Error updating quiz:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
