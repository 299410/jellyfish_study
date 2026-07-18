import { NextRequest, NextResponse } from 'next/server';
import { GeminiProvider } from '@/lib/ai/adapter';

// Ensure the API key is present
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key. Please configure it in Dashboard.' }, { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const provider = new GeminiProvider(apiKey);
    const transcript = await provider.transcribeAudio(audioFile, audioFile.type || 'audio/webm');

    return NextResponse.json({ transcript });
  } catch (error: any) {
    console.error('STT Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process audio' }, { status: 500 });
  }
}
