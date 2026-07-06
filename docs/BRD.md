# Business Requirements Document (BRD)
**Project Name:** Nihongo-reflex (GlobeLingua | JellyFish)
**Version:** 1.0 (Dựa trên source code hiện tại)
**Date:** 2026-07-06

---

## 1. Tổng quan dự án (Project Overview)
Nihongo-reflex là một ứng dụng Web (Fullstack Next.js) ứng dụng AI (Google GenAI) để giúp người dùng luyện phản xạ giao tiếp tiếng Nhật và giả lập phỏng vấn. 
Ứng dụng cung cấp môi trường thực hành hội thoại qua giọng nói (Speech-to-Text & Text-to-Speech) và đánh giá ngay lập tức câu trả lời của người dùng.

## 2. Mục tiêu (Objectives)
- **Cải thiện phản xạ:** Giúp người học tiếng Nhật tương tác với AI thông qua giọng nói theo thời gian thực.
- **Luyện phỏng vấn:** Cung cấp môi trường giả lập phỏng vấn với các bộ câu hỏi được soạn sẵn.
- **Phản hồi chi tiết:** Sử dụng AI để phân tích câu trả lời, chỉ ra lỗi sai và gợi ý cách trả lời tốt hơn (Feedback).

## 3. Phạm vi hệ thống (System Scope)
Hệ thống hiện tại tập trung vào 2 chế độ học tập chính (Modes):
1. **Free Chat:** Trò chuyện tự do với AI, luyện phản xạ giao tiếp thông thường.
2. **Interview:** Phỏng vấn theo danh sách câu hỏi cố định (Question Sets), ghi nhận kết quả và đánh giá.

---

## 4. Yêu cầu Chức năng (Functional Requirements)

### 4.1. Quản lý Bộ câu hỏi (Question Sets Management)
- Người dùng có thể tạo, xem, sửa, xóa (CRUD) các bộ câu hỏi (QuestionSet).
- Mỗi QuestionSet bao gồm nhiều câu hỏi chi tiết (Question), có thứ tự nhất định.

### 4.2. Chế độ Phỏng vấn (Interview Mode)
- Người dùng chọn một QuestionSet để bắt đầu Session phỏng vấn.
- Hệ thống (AI) đọc câu hỏi bằng giọng nói (Text-to-Speech - TTS).
- Người dùng trả lời bằng giọng nói (Speech-to-Text - STT).
- AI phân tích câu trả lời của người dùng và sinh ra Feedback (đánh giá từ vựng, ngữ pháp, độ tự nhiên).
- Chuyển tiếp sang câu hỏi tiếp theo theo thứ tự (order) của QuestionSet.

### 4.3. Chế độ Trò chuyện tự do (Free Chat Mode)
- Trò chuyện mở với AI.
- Hỗ trợ Voice chat 2 chiều (STT / TTS).

### 4.4. Lịch sử & Đánh giá (Session & Results)
- Tự động lưu lại mỗi lần luyện tập thành một `Session`.
- Ghi nhận chi tiết từng câu hỏi, câu trả lời của người dùng (userAnswer) và nhận xét của AI (feedback) vào `SessionResult`.
- Người dùng có thể xem lại lịch sử để theo dõi tiến độ.

---

## 5. Kiến trúc & Công nghệ (Technical Stack & Constraints)

### 5.1. Công nghệ sử dụng
- **Frontend / Backend:** Next.js 16 (App Router), React 19.
- **Styling:** Tailwind CSS v4, shadcn/ui, base-ui, tw-animate-css, lucide-react.
- **Database ORM:** Prisma.
- **Database Engine:** SQLite (Môi trường dev).
- **AI Integration:** `@google/genai` (Sử dụng model của Google Gemini để xử lý chat và feedback).
- **Audio Processing:** API nội bộ (`/api/stt`, `/api/tts`).

### 5.2. Database Schema (Mô hình Dữ liệu)
- **QuestionSet:** Lưu tên bộ câu hỏi.
- **Question:** Lưu nội dung câu hỏi, thuộc về một QuestionSet, có đánh số thứ tự (`order`).
- **Session:** Lưu phiên luyện tập, ghi nhớ thời gian (`date`) và QuestionSet đã sử dụng.
- **SessionResult:** Liên kết với Session, lưu lại chi tiết câu hỏi (`question`), câu trả lời (`userAnswer`) và đánh giá của AI (`feedback`).

---

## 6. Lộ trình phát triển đề xuất (Next Steps)
Dựa trên kiến trúc hiện tại, các tính năng có thể mở rộng tiếp theo (Nếu cần thiết):
1. **Authentication:** Thêm đăng nhập để cá nhân hóa dữ liệu học tập (Clerk, NextAuth).
2. **Dashboard:** Màn hình tổng quan thống kê số phiên luyện tập, tiến độ phản xạ, các lỗi thường gặp.
3. **Audio Optimization:** Tối ưu hóa độ trễ của luồng STT và TTS để giao tiếp realtime giống người thật hơn.
