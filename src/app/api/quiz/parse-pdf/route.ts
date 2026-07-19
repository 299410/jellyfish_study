import { NextRequest, NextResponse } from 'next/server';
import { GeminiProvider } from '@/lib/ai/adapter';

export const maxDuration = 60; // Increase max duration for PDF parsing if needed (Vercel)

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64 } = await req.json();

    if (!pdfBase64) {
      return NextResponse.json({ error: 'PDF data is required' }, { status: 400 });
    }

    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key. Please configure it in Dashboard.' }, { status: 401 });
    }

    const aiProvider = new GeminiProvider(apiKey);
    
    // Parse quiz from PDF
    const parsedData = await aiProvider.parseQuizFromPdf(pdfBase64);

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error('Error parsing quiz from PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during PDF parsing' },
      { status: 500 }
    );
  }
}
