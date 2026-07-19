import { NextRequest, NextResponse } from 'next/server';
import { GeminiProvider } from '@/lib/ai/adapter';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key. Please configure it in Dashboard.' }, { status: 401 });
    }

    const aiProvider = new GeminiProvider(apiKey);
    
    // Parse quiz from text
    const parsedData = await aiProvider.parseQuizFromText(text);

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error('Error parsing quiz:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during parsing' },
      { status: 500 }
    );
  }
}
