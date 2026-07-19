'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, Target, AlertCircle, Sparkles, Loader2, XCircle, CheckCircle2 } from 'lucide-react';

export default function QuizResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [result, setResult] = useState<any>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExpl, setLoadingExpl] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`quiz_result_${id}`);
    if (stored) {
      setResult(JSON.parse(stored));
    }
  }, [id]);

  if (!result) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
        <p className="text-slate-500">Đang tải kết quả...</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}p ${s}s`;
  };

  const percent = Math.round((result.score / result.total) * 100) || 0;

  const handleExplain = async (q: any) => {
    if (explanations[q.id]) return; // already loaded
    
    setLoadingExpl(q.id);
    try {
      const res = await fetch('/api/quiz/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionContent: q.content,
          options: q.options,
          wrongAnswerIndex: result.answers[q.id] ?? -1,
          correctAnswerIndex: q.correctAnswer
        })
      });
      const data = await res.json();
      setExplanations(prev => ({ ...prev, [q.id]: data.explanation }));
    } catch (err) {
      alert('Không thể tải giải thích từ AI');
    } finally {
      setLoadingExpl(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-0 pb-20">
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-indigo-100/20 text-center mb-10">
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <Trophy className="w-12 h-12 text-indigo-500" />
          <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
            {percent >= 80 ? 'Xuất sắc' : percent >= 50 ? 'Khá' : 'Cần cố gắng'}
          </div>
        </div>
        
        <h1 className="text-3xl font-black text-slate-800 mb-2">Hoàn thành bài thi!</h1>
        <p className="text-slate-500 font-medium mb-8">{result.title}</p>

        <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mb-8">
          <div className="bg-slate-50 rounded-2xl p-4">
            <Target className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <div className="text-3xl font-black text-slate-700">{result.score}/{result.total}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide font-bold mt-1">Điểm số</div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4">
            <div className="text-3xl font-black text-indigo-500 mb-2">{percent}%</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide font-bold mt-1">Tỷ lệ đúng</div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4">
            <Clock className="w-6 h-6 text-cyan-500 mx-auto mb-2" />
            <div className="text-xl font-black text-slate-700 mt-2">{formatTime(result.timeSpent)}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide font-bold mt-1">Thời gian</div>
          </div>
        </div>

        <Link href="/quiz">
          <Button variant="outline" className="rounded-xl font-bold">Về trang chủ Quiz</Button>
        </Link>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-black text-slate-800 mb-4 flex items-center">
          <AlertCircle className="w-6 h-6 text-rose-500 mr-2" />
          Review Lỗi Sai ({result.questions.filter((q: any) => result.answers[q.id] !== q.correctAnswer).length})
        </h2>
        
        {result.questions.map((q: any, idx: number) => {
          const userAnswerIdx = result.answers[q.id] ?? -1;
          const isCorrect = userAnswerIdx === q.correctAnswer;
          
          if (isCorrect) return null; // Chỉ hiện câu sai

          return (
            <div key={q.id} className="bg-white rounded-3xl p-6 md:p-8 border-2 border-rose-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-rose-400" />
              
              <div className="flex items-start justify-between gap-4 mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex-1">
                  <span className="text-rose-500 mr-2">Câu {idx + 1}:</span>
                  {q.content}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {q.options.map((opt: string, oIdx: number) => {
                  let style = "border-slate-100 text-slate-500 opacity-50";
                  let Icon = null;
                  
                  if (oIdx === q.correctAnswer) {
                    style = "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold opacity-100";
                    Icon = CheckCircle2;
                  } else if (oIdx === userAnswerIdx) {
                    style = "border-rose-400 bg-rose-50 text-rose-700 font-bold opacity-100 line-through decoration-rose-400";
                    Icon = XCircle;
                  }

                  return (
                    <div key={oIdx} className={`p-4 rounded-xl border-2 flex items-center ${style}`}>
                      <span className="mr-3">{String.fromCharCode(65 + oIdx)}.</span>
                      <span className="flex-1">{opt}</span>
                      {Icon && <Icon className="w-5 h-5 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {!explanations[q.id] ? (
                <Button 
                  onClick={() => handleExplain(q)}
                  disabled={loadingExpl === q.id}
                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold rounded-xl shadow-none"
                >
                  {loadingExpl === q.id ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang nghĩ...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2 text-amber-500" /> Hỏi AI tại sao sai?</>
                  )}
                </Button>
              ) : (
                <div className="bg-gradient-to-br from-indigo-50 to-cyan-50 rounded-2xl p-5 border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2 text-indigo-700 font-bold">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    AI Giải thích:
                  </div>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {explanations[q.id]}
                  </p>
                </div>
              )}
            </div>
          );
        })}
        
        {result.score === result.total && (
          <div className="bg-emerald-50 p-8 rounded-3xl text-center border border-emerald-100">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-emerald-700">Tuyệt vời! Bạn không sai câu nào!</h3>
          </div>
        )}
      </div>
    </div>
  );
}
