'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Loader2, Save, Trash2, Plus, Edit3 } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function QuizImportPage() {
  const router = useRouter();
  
  // Steps: 1 = Paste Text, 2 = Review/Edit
  const [step, setStep] = useState<1 | 2>(1);
  
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  // Quiz State (for Review/Edit)
  const [title, setTitle] = useState('Đề Thi JLPT Mới');
  const [timeLimit, setTimeLimit] = useState<number>(30);
  const [questions, setQuestions] = useState<any[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);

  const handleParse = async () => {
    if (!rawText.trim()) return;
    
    setIsParsing(true);
    setParseError('');

    try {
      const res = await fetch('/api/quiz/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse');
      }

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setStep(2);
      } else {
        setParseError('AI không tìm thấy câu hỏi trắc nghiệm nào trong đoạn text này. Vui lòng kiểm tra lại format.');
      }
    } catch (err: any) {
      setParseError(err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    if (questions.length === 0) return;
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, timeLimit, questions })
      });

      if (res.ok) {
        router.push('/quiz');
      } else {
        const err = await res.json();
        alert('Lỗi lưu đề thi: ' + err.error);
      }
    } catch (err: any) {
      alert('Lỗi kết nối: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    const newOptions = [...updated[qIndex].options];
    newOptions[optIndex] = value;
    updated[qIndex].options = newOptions;
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-0">
      
      {step === 1 && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">
              Import Đề Thi
            </h1>
            <p className="text-slate-500">
              Copy và dán bộ câu hỏi của bạn vào đây. AI sẽ tự động phân tích và chuyển đổi thành đề thi trắc nghiệm hoàn chỉnh.
            </p>
          </div>

          <textarea
            className="w-full h-96 p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 transition-all outline-none resize-none font-mono text-sm"
            placeholder="Ví dụ:&#10;Câu 1: Thủ đô của Nhật Bản là gì?&#10;A. Kyoto&#10;B. Tokyo&#10;C. Osaka&#10;D. Hokkaido&#10;Đáp án: B"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />

          {parseError && (
            <div className="mt-4 p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 text-sm font-medium">
              {parseError}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleParse} 
              disabled={isParsing || !rawText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-12 text-lg font-semibold shadow-lg shadow-indigo-200"
            >
              {isParsing ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang phân tích...</>
              ) : (
                <><BrainCircuit className="w-5 h-5 mr-2" /> Trích xuất bằng AI</>
              )}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div className="space-y-4 flex-1 w-full">
              <div>
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1 block">Tên Bộ Đề</label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-bold border-0 border-b-2 border-slate-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-indigo-500 shadow-none h-auto py-2"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1 block">Thời gian (Phút)</label>
                <Input 
                  type="number" 
                  value={timeLimit} 
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  className="w-32 border-2 border-slate-200 rounded-xl"
                />
              </div>
            </div>
            
            <Button 
              onClick={handleSave} 
              disabled={isSaving || questions.length === 0}
              className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-8 h-12 text-lg font-semibold shadow-lg shadow-emerald-200"
            >
              {isSaving ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang lưu...</>
              ) : (
                <><Save className="w-5 h-5 mr-2" /> Lưu Bộ Đề ({questions.length} câu)</>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative group">
                <button 
                  onClick={() => removeQuestion(qIndex)}
                  className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                <div className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-lg">
                    {qIndex + 1}
                  </div>
                  <div className="flex-1 space-y-4">
                    <Input 
                      value={q.content} 
                      onChange={(e) => updateQuestion(qIndex, 'content', e.target.value)}
                      className="font-medium text-slate-800 bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-indigo-400"
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt: string, optIndex: number) => (
                        <div 
                          key={optIndex} 
                          className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-colors ${
                            q.correctAnswer === optIndex 
                              ? 'border-emerald-500 bg-emerald-50/50' 
                              : 'border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name={`correct-${qIndex}`} 
                            checked={q.correctAnswer === optIndex}
                            onChange={() => updateQuestion(qIndex, 'correctAnswer', optIndex)}
                            className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                          />
                          <Input 
                            value={opt}
                            onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                            className="h-8 border-0 bg-transparent shadow-none focus-visible:ring-0 px-1 font-medium"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button 
            variant="outline"
            onClick={() => setQuestions([...questions, { content: 'Câu hỏi mới', options: ['A', 'B', 'C', 'D'], correctAnswer: 0 }])}
            className="w-full h-14 border-2 border-dashed border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 rounded-3xl font-semibold text-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Thêm Câu Hỏi
          </Button>

        </div>
      )}

    </div>
  );
}
