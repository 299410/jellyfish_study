import { NextRequest, NextResponse } from 'next/server';
import { GeminiProvider } from '@/lib/ai/adapter';

export async function POST(req: NextRequest) {
  try {
    const { topic, text } = await req.json();

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key. Please configure it in Dashboard.' }, { status: 401 });
    }

    const aiProvider = new GeminiProvider(apiKey);
    
    // Evaluate writing
    const evaluation = await aiProvider.evaluateWriting(topic || '', text);

    return NextResponse.json(evaluation);

  } catch (error: any) {
    console.error('Error evaluating writing:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during evaluation' },
      { status: 500 }
    );
  }
}
