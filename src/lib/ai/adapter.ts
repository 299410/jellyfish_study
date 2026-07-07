import { GoogleGenAI } from '@google/genai';

// --- Interfaces ---
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface TextChatAdapter {
  transcribeAudio(audioFile: Blob, mimeType: string): Promise<string>;
  generateTeacherResponse(message: string, history: ChatMessage[], mode?: 'chat' | 'interview'): Promise<ReadableStream>;
}

export interface TTSAdapter {
  textToSpeech(text: string): Promise<string | ArrayBuffer>;
}

// --- Gemini Implementation ---
export class GeminiProvider implements TextChatAdapter, TTSAdapter {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Transcribe audio using Gemini Multimodal
   */
  async transcribeAudio(audioFile: Blob, mimeType: string): Promise<string> {
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const base64Data = buffer.toString("base64");

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Please transcribe the following Japanese audio exactly as it is spoken. Do not translate. Output ONLY the transcript in Japanese.' },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ]
    });

    return response.text || '';
  }

  /**
   * Generate Teacher Feedback & Reply using Streaming
   */
  async generateTeacherResponse(
    message: string, 
    history: ChatMessage[],
    mode: 'chat' | 'interview' = 'chat'
  ): Promise<ReadableStream> {
    let systemInstruction = '';

    if (mode === 'interview') {
      systemInstruction = `Bạn là một Mentor dạy tiếng Nhật kỳ cựu với nhiều năm kinh nghiệm giảng dạy và luyện thi phỏng vấn công sở Nhật Bản. Nhiệm vụ của bạn là đưa ra chỉ dẫn và đánh giá câu trả lời phỏng vấn của học viên.
Hãy cung cấp phản hồi thật chi tiết, đơn giản, dễ hiểu và pha chút hài hước để giúp học viên giải tỏa căng thẳng, nhưng vẫn giữ tính chuyên nghiệp khi sửa lỗi.

Định dạng trả lời bắt buộc theo cấu trúc 4 phần bằng Markdown:

=== ĐÁNH GIÁ CHUNG ===
(Nhận xét về thái độ trả lời, sự tự tin và độ trôi chảy của học viên bằng tiếng Việt)

=== NGỮ PHÁP & TỪ VỰNG (KEIGO) ===
(Chỉ ra các điểm chưa chuẩn, đặc biệt là lỗi ngữ pháp, từ vựng hoặc cách sử dụng kính ngữ Keigo chuyên nghiệp trong phỏng vấn và sửa lại cho đúng bằng tiếng Việt)

=== CÂU TRẢ LỜI MẪU THAM KHẢO ===
(Cung cấp câu trả lời mẫu ngắn gọn, lịch sự chuẩn công sở bằng tiếng Nhật)

=== DỊCH NGHĨA & HƯỚNG DẪN CHI TIẾT ===
(Dịch nghĩa câu trả lời mẫu sang tiếng Việt, đồng thời giải thích chi tiết các cấu trúc ngữ pháp và từ vựng đắt giá được dùng trong câu mẫu để học viên dễ học theo)`;
    } else {
      systemInstruction = `Bạn là một giáo viên tiếng Nhật bản xứ thân thiện và nghiêm khắc. Nhiệm vụ của bạn là luyện giao tiếp với học viên.
Với mỗi tin nhắn của học viên (bằng tiếng Nhật), bạn phải thực hiện 2 việc:
1. [FEEDBACK]: Bằng TIẾNG VIỆT. Chỉ ra lỗi ngữ pháp, từ vựng hoặc cách dùng từ thiếu tự nhiên trong câu của học viên. Nếu câu hoàn hảo, hãy khen ngợi.
2. [REPLY]: Bằng TIẾNG NHẬT. Trả lời lại câu nói của học viên để tiếp tục cuộc hội thoại một cách tự nhiên.

Định dạng trả lời bắt buộc:
---FEEDBACK---
(Nhận xét của bạn ở đây)
---REPLY---
(Câu trả lời tiếng Nhật của bạn ở đây)`;
    }

    const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    const responseStream = await this.ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    // Convert the Gemini AsyncGenerator to a standard Web ReadableStream
    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return readable;
  }

  /**
   * Text to Speech
   */
  async textToSpeech(text: string): Promise<string | ArrayBuffer> {
    // TODO: Implement with Gemini TTS when available, or rely on client-side Web Speech API
    throw new Error('TTS will be handled client-side via Web Speech API in Phase 1.');
  }
}
