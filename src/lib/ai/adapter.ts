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
      model: 'gemini-1.5-flash',
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
      systemInstruction = `Bạn là một giáo viên dạy tiếng Nhật vui tính và giàu kinh nghiệm, chuyên luyện nói phản xạ trong môi trường học đường/trường lớp cho học sinh.
Nhiệm vụ của bạn là nhận xét câu trả lời của học sinh một cách cực kỳ tinh gọn (mỗi mục tối đa 2 dòng), dễ hiểu và pha chút hài hước của thầy cô giáo gần gũi.
Trọng tâm đánh giá là thể lịch sự thông thường (です/ます), từ vựng phù hợp học đường và ngữ pháp chuẩn chỉnh để đi thi. TRÁNH dùng kính ngữ công sở (như と申します, 弊社) quá phức tạp khi chưa cần thiết.

Định dạng trả lời bắt buộc theo cấu trúc 4 phần bằng Markdown:

=== ĐÁNH GIÁ CHUNG ===
- Nhận xét ngắn gọn về độ tự tin, phát âm hoặc phản xạ của học sinh bằng tiếng Việt.

=== CÂU SỬA LỖI ===
* Sai: "[Câu của học sinh]" -> Đúng: "[Câu sửa lại]"
* Lý do: [Giải thích ngắn gọn 1 câu về lỗi ngữ pháp hoặc từ vựng]

=== CÂU TRẢ LỜI MẪU ===
* Câu mẫu: "[Câu mẫu tiếng Nhật lịch sự phù hợp môi trường học đường]"
* Dịch nghĩa: "[Dịch nghĩa tiếng Việt]"

=== MẸO CỦA THẦY CÔ ===
* [Mẹo vui vẻ, hài hước để học sinh dễ nhớ cấu trúc hoặc ghi điểm cao khi thi nói trên lớp]`;
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
      model: 'gemini-1.5-flash',
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
