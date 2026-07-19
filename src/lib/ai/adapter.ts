import { GoogleGenAI } from '@google/genai';

// --- Interfaces ---
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface TextChatAdapter {
  transcribeAudio(audioFile: Blob, mimeType: string): Promise<string>;
  generateTeacherResponse(message: string, history: ChatMessage[], mode?: 'chat' | 'interview'): Promise<ReadableStream>;
  evaluateWriting(topic: string, text: string): Promise<any>;
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
      model: 'gemini-3.1-flash-lite',
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
      model: 'gemini-3.1-flash-lite',
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
   * Evaluate Writing and return JSON structured data
   */
  async evaluateWriting(topic: string, text: string): Promise<any> {
    const isInterview = topic.startsWith('Interview Question:');

    const systemInstruction = isInterview 
      ? `Bạn là Giám khảo phỏng vấn tiếng Nhật. Học viên đang chuẩn bị kịch bản trả lời phỏng vấn.
Nhiệm vụ:
1. Kiểm tra câu trả lời có phù hợp với câu hỏi phỏng vấn không.
2. Sửa lỗi ngữ pháp, từ vựng và ĐẶC BIỆT chú trọng vào văn phong lịch sự (Keigo/Teineigo) dùng trong phỏng vấn.
3. Trả về JSON theo Schema:
- score: Điểm số (0-100)
- overall_comment: Đánh giá chung (Tiếng Việt)
- errors: Mảng các lỗi, mỗi lỗi gồm: original_sentence, error_phrase, correction, explanation.
- rewritten_text: Câu trả lời mẫu hoàn hảo (Tiếng Nhật) kèm dịch nghĩa Tiếng Việt bên dưới.`
      : `Bạn là Giám khảo chấm thi viết JLPT (Level N5 đến N3).
Học viên được giao một Yêu cầu/Mẫu ngữ pháp (nếu có) và Bài viết.
Nhiệm vụ: 
1. Kiểm tra bài viết có sử dụng đúng Yêu cầu/Mẫu ngữ pháp không.
2. Bắt lỗi sai ngữ pháp, trợ từ, từ vựng (chỉ giới hạn ở mức N5-N3).
3. Trả về JSON theo Schema gồm: score, overall_comment, errors, rewritten_text.
- errors là mảng object gồm: original_sentence, error_phrase, correction, explanation.`;

    const userPrompt = `Yêu cầu/Mẫu ngữ pháp: ${topic || 'Không có'}
Bài viết: ${text}`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.error('Failed to parse AI response to JSON', e);
      return { score: 0, overall_comment: 'Lỗi khi chấm điểm', errors: [], rewritten_text: '' };
    }
  }

  /**
   * Text to Speech
   */
  async textToSpeech(text: string): Promise<string | ArrayBuffer> {
    // TODO: Implement with Gemini TTS when available, or rely on client-side Web Speech API
    throw new Error('TTS will be handled client-side via Web Speech API in Phase 1.');
  }
}
