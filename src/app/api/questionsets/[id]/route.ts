import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    await prisma.questionSet.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question set:', error);
    return NextResponse.json({ error: 'Failed to delete question set' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, questions } = body;

    if (!name || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Update name and replace questions
    const updatedSet = await prisma.$transaction(async (tx) => {
      // 1. Update the set name
      const set = await tx.questionSet.update({
        where: { id },
        data: { name },
      });

      // 2. Delete existing questions
      await tx.question.deleteMany({
        where: { setId: id }
      });

      // 3. Insert new questions
      if (questions.length > 0) {
        await tx.question.createMany({
          data: questions.map((q, idx) => ({
            content: q,
            order: idx,
            setId: id
          }))
        });
      }

      return set;
    });

    return NextResponse.json(updatedSet);
  } catch (error) {
    console.error('Error updating question set:', error);
    return NextResponse.json({ error: 'Failed to update question set' }, { status: 500 });
  }
}
