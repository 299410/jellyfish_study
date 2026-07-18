import { NextRequest, NextResponse } from 'next/server';
import { GeminiProvider, ChatMessage } from '@/lib/ai/adapter';

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key. Please configure it in Dashboard.' }, { status: 401 });
    }

    const body = await req.json();
    const { message, history, mode } = body as { message: string, history: ChatMessage[], mode?: 'chat' | 'interview' };

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const provider = new GeminiProvider(apiKey);
    const stream = await provider.generateTeacherResponse(message, history || [], mode);

    // Return the stream directly for SSE / Streaming consumption
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process chat' }, { status: 500 });
  }
}
