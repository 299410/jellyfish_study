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

    const prompt = `
      You are an expert Japanese Interviewer and Language Teacher. 
      The user is preparing an answer script for an interview or practicing their writing.
      
      Topic/Question: ${topic || 'Free writing'}
      User's Text: ${text}

      Please evaluate the user's text and provide feedback in EXACTLY this format, using markdown:

      === ĐÁNH GIÁ CHUNG ===
      (Provide a brief, encouraging 1-2 sentence overall assessment in Vietnamese. 
      Comment on whether this answer fits the interview question context (if a question was provided).)

      === CÁCH SỬA LỖI ===
      (List the errors found. If no errors, say "Không có lỗi sai nào đáng kể!"
      For each error, use exactly this format:
      Sai: "the wrong part" -> Đúng: "the corrected part"
      Lý do: explanation in Vietnamese of why it was wrong or unnatural for an interview context.)

      === CÂU TRẢ LỜI MẪU ===
      (Provide a completely rewritten, highly natural, and professional version of the user's text, suitable for a Japanese job interview or formal situation. Keep it close to their original meaning but upgrade the vocabulary and grammar (use Keigo/Teineigo appropriately).
      Format exactly like this:
      Câu mẫu: "the perfect Japanese version"
      Dịch nghĩa: "the Vietnamese translation of the perfect version")

      === MẸO CỦA THẦY CÔ ===
      (Provide 1-2 short bullet points with tips on vocabulary, grammar, or interview strategy relevant to their text. Write in Vietnamese.)
    `;

    const aiProvider = new GeminiProvider(apiKey);
    
    // Evaluate writing
    const evaluation = await aiProvider.evaluateWriting(prompt, text);

    return NextResponse.json(evaluation);

  } catch (error: any) {
    console.error('Error evaluating writing:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during evaluation' },
      { status: 500 }
    );
  }
}
