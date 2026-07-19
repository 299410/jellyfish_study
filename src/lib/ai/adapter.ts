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
   * Parse messy text into structured Quiz JSON
   */
  async parseQuizFromText(text: string): Promise<any> {
    const systemInstruction = `Bạn là một chuyên gia phân tích dữ liệu giáo dục.
Nhiệm vụ: Trích xuất TOÀN BỘ các câu hỏi trắc nghiệm từ đoạn text hỗn độn do người dùng cung cấp.
QUAN TRỌNG: Bạn PHẢI trích xuất TẤT CẢ các câu hỏi có trong text, tuyệt đối KHÔNG ĐƯỢC lười biếng bỏ sót hay tóm tắt. Trích xuất cho đến câu hỏi cuối cùng.
Bắt buộc trả về ĐÚNG định dạng JSON Schema sau, không thêm bất kỳ text nào khác:
{
  "questions": [
    {
      "content": "Nội dung câu hỏi",
      "options": ["A. Lựa chọn 1", "B. Lựa chọn 2", "C. Lựa chọn 3", "D. Lựa chọn 4"],
      "correctAnswer": 0 // Index (0 đến 3) của đáp án đúng
    }
  ]
}
Lưu ý: Nếu text không có đáp án đúng rõ ràng, hãy tự suy luận ra đáp án đúng nhất dựa trên kiến thức JLPT.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [{ role: 'user', parts: [{ text: text }] }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
      }
    });

    try {
      return JSON.parse(response.text || '{"questions":[]}');
    } catch (e) {
      console.error('Failed to parse AI response to JSON for Quiz', e);
      return { questions: [] };
    }
  }

  /**
   * Parse messy text from a PDF document into structured Quiz JSON
   */
  async parseQuizFromPdf(pdfBase64: string): Promise<any> {
    const systemInstruction = `Bạn là một chuyên gia phân tích dữ liệu giáo dục.
Nhiệm vụ: Trích xuất TOÀN BỘ các câu hỏi trắc nghiệm từ tài liệu PDF do người dùng cung cấp.
QUAN TRỌNG: Bạn PHẢI trích xuất TẤT CẢ các câu hỏi có trong file, tuyệt đối KHÔNG ĐƯỢC lười biếng bỏ sót hay tóm tắt. Nếu file có 50 câu, phải trả về đủ 50 câu.
Bắt buộc trả về ĐÚNG định dạng JSON Schema sau, không thêm bất kỳ text nào khác:
{
  "questions": [
    {
      "content": "Nội dung câu hỏi",
      "options": ["A. Lựa chọn 1", "B. Lựa chọn 2", "C. Lựa chọn 3", "D. Lựa chọn 4"],
      "correctAnswer": 0
    }
  ]
}
Lưu ý: Nếu không có đáp án đúng rõ ràng, hãy tự suy luận ra đáp án đúng nhất dựa trên kiến thức JLPT.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [
        { 
          role: 'user', 
          parts: [
            { text: 'Hãy trích xuất toàn bộ bộ câu hỏi trắc nghiệm từ tài liệu PDF này.' },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfBase64
              }
            }
          ] 
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
      }
    });

    try {
      return JSON.parse(response.text || '{"questions":[]}');
    } catch (e) {
      console.error('Failed to parse AI response to JSON for PDF Quiz', e);
      return { questions: [] };
    }
  }

  /**
   * Explain why a user's answer is wrong
   */
  async explainQuizAnswer(questionContent: string, options: string[], wrongAnswerIndex: number, correctAnswerIndex: number): Promise<string> {
    const wrongAnswer = options[wrongAnswerIndex];
    const correctAnswer = options[correctAnswerIndex];

    const prompt = `Câu hỏi: ${questionContent}
Đáp án học viên chọn (SAI): ${wrongAnswer}
Đáp án đúng chuẩn: ${correctAnswer}

Hãy giải thích ngắn gọn (bằng tiếng Việt, tối đa 3 câu) tại sao đáp án học viên chọn lại sai và tại sao đáp án kia mới đúng. Giọng điệu như một thầy giáo tận tâm.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: 'Bạn là thầy giáo tiếng Nhật chuyên luyện thi JLPT.',
      }
    });

    return response.text || 'Lỗi: Không thể tải lời giải thích.';
  }

  /**
   * Text to Speech
   */
  async textToSpeech(text: string): Promise<string | ArrayBuffer> {
    // TODO: Implement with Gemini TTS when available, or rely on client-side Web Speech API
    throw new Error('TTS will be handled client-side via Web Speech API in Phase 1.');
  }
}
