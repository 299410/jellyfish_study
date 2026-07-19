import { NextRequest, NextResponse } from 'next/server';
import { GeminiProvider } from '@/lib/ai/adapter';

export async function POST(req: NextRequest) {
  try {
    const { questionContent, options, wrongAnswerIndex, correctAnswerIndex } = await req.json();

    if (!questionContent || !options || wrongAnswerIndex === undefined || correctAnswerIndex === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key. Please configure it in Dashboard.' }, { status: 401 });
    }

    const aiProvider = new GeminiProvider(apiKey);
    
    // Explain the answer
    const explanation = await aiProvider.explainQuizAnswer(questionContent, options, wrongAnswerIndex, correctAnswerIndex);

    return NextResponse.json({ explanation });

  } catch (error: any) {
    console.error('Error explaining quiz answer:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during explanation' },
      { status: 500 }
    );
  }
}
