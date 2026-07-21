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
      systemInstruction = `Bạn là một giáo viên dạy ngoại ngữ vui tính và giàu kinh nghiệm, chuyên luyện nói phản xạ trong môi trường học đường/trường lớp cho học sinh.
Nhiệm vụ của bạn là lắng nghe học sinh trả lời bằng ngoại ngữ mục tiêu và nhận xét.
TRẢ VỀ ĐÚNG ĐỊNH DẠNG SAU, KHÔNG DÙNG JSON:
=== ĐÁNH GIÁ CHUNG ===
[Nhận xét tổng quan, khen ngợi và chấm điểm 1-10]
=== CÂU SỬA LỖI ===
[Chỉ ra các lỗi sai nếu có, định dạng: Sai: "..." -> Đúng: "..." (Lý do: ...)]
=== CÂU TRẢ LỜI MẪU ===
[Câu trả lời mẫu chuẩn xác và tự nhiên]
=== MẸO CỦA THẦY CÔ ===
[Một mẹo nhỏ về từ vựng, ngữ pháp hoặc văn hóa giao tiếp]`;
    } else {
      systemInstruction = `Bạn là một giáo viên ngoại ngữ bản xứ thân thiện và nghiêm khắc. Nhiệm vụ của bạn là luyện giao tiếp với học viên.
Với mỗi tin nhắn của học viên (bằng ngoại ngữ đang học), bạn phải thực hiện 2 việc:
1. [CORRECTION]: Sửa lỗi ngữ pháp/từ vựng (nếu có) một cách ngắn gọn, dễ hiểu. Nếu học viên nói đúng, hãy khen ngợi.
2. [REPLY]: Bằng NGOẠI NGỮ. Trả lời lại câu nói của học viên để tiếp tục cuộc hội thoại một cách tự nhiên.

Trả về kết quả chuẩn JSON:
{
  "correction": "(Nhận xét và sửa lỗi bằng tiếng Việt, hoặc khen ngợi nếu đúng)",
  "reply": "(Câu trả lời của bạn ở đây)"
}`;
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
      ? `Bạn là Giám khảo phỏng vấn. Học viên đang chuẩn bị kịch bản trả lời phỏng vấn.
Nhiệm vụ: Chấm điểm đoạn văn của học viên, chỉ ra lỗi sai ngữ pháp, dùng từ, và viết lại một phiên bản hoàn hảo hơn, chuyên nghiệp hơn.
Trả về JSON: 
{
  "score": Điểm số (0-10),
  "feedback": "Nhận xét chi tiết",
  "errors": [{"error": "lỗi", "correction": "sửa thành", "explanation": "giải thích"}],
  "rewritten_text": "Câu trả lời mẫu hoàn hảo kèm dịch nghĩa bên dưới."
}`
      : `Bạn là Giám khảo chấm thi viết ngoại ngữ. Học viên viết một đoạn văn theo chủ đề.
Nhiệm vụ: Chấm điểm đoạn văn, chỉ ra lỗi sai (ngữ pháp, từ vựng, chính tả), và viết lại một bài mẫu hoàn chỉnh tự nhiên như người bản xứ.
Trả về JSON:
{
  "score": Điểm số (0-10),
  "feedback": "Nhận xét chi tiết",
  "errors": [{"error": "lỗi", "correction": "sửa thành", "explanation": "giải thích"}],
  "rewritten_text": "Bài mẫu hoàn chỉnh"
}`;

    const userPrompt = `Chủ đề/Yêu cầu: ${topic || 'Không có'}
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
Lưu ý: Nếu text không có đáp án đúng rõ ràng, hãy tự suy luận ra đáp án đúng nhất dựa trên ngữ cảnh.`;

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
Lưu ý: Nếu không có đáp án đúng rõ ràng, hãy tự suy luận ra đáp án đúng nhất dựa trên ngữ cảnh.`;

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
        systemInstruction: 'Bạn là giáo viên chuyên luyện thi ngoại ngữ.'
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
