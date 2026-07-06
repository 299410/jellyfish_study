import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      include: { results: true },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(sessions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionSetId, questionSetName } = body;

    const newSession = await prisma.session.create({
      data: {
        questionSetId,
        questionSetName
      }
    });
    return NextResponse.json(newSession);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
