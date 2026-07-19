'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Clock, ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';

export default function QuizTakePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/quiz/${id}`)
      .then(res => res.json())
      .then(data => {
        setQuiz(data);
        if (data.timeLimit) {
          setTimeLeft(data.timeLimit * 60);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  // Timer countdown
  useEffect(() => {
    if (!quiz || !quiz.timeLimit || timeLeft <= 0 || isSubmitting) return;

    const timerId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerId);
          handleSubmit(); // auto submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [quiz, timeLeft, isSubmitting]);

  const handleSelectOption = (qId: string, optIndex: number) => {
    setAnswers(prev => ({ ...prev, [qId]: optIndex }));
  };

  const handleSubmit = useCallback(async () => {
    if (!quiz) return;
    setIsSubmitting(true);

    let score = 0;
    quiz.questions.forEach((q: any) => {
      if (answers[q.id] === q.correctAnswer) {
        score += 1;
      }
    });

    const timeSpent = quiz.timeLimit ? (quiz.timeLimit * 60 - timeLeft) : 0;

    // Save session to DB
    try {
      await fetch(`/api/quiz/${quiz.id}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, total: quiz.questions.length, timeSpent })
      });
    } catch (e) {
      console.error('Failed to save session', e);
    }

    // Save result to local storage for the Result page
    const resultData = {
      quizId: quiz.id,
      title: quiz.title,
      score,
      total: quiz.questions.length,
      timeSpent,
      answers,
      questions: quiz.questions
    };
    
    localStorage.setItem(`quiz_result_${quiz.id}`, JSON.stringify(resultData));

    router.push(`/quiz/${quiz.id}/result`);
  }, [quiz, answers, timeLeft, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!quiz) return null;

  const currentQ = quiz.questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const isFinished = answeredCount === quiz.questions.length;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col fixed inset-0 z-50 overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm">
        <div className="font-bold text-lg text-slate-800 line-clamp-1">{quiz.title}</div>
        
        {quiz.timeLimit && (
          <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-1.5 rounded-xl border-2 ${
            timeLeft < 60 ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
        )}
        
        <Button 
          onClick={() => {
            if (confirm('Bạn có chắc chắn muốn nộp bài sớm?')) handleSubmit();
          }}
          disabled={isSubmitting}
          className={`${isFinished ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-800 hover:bg-slate-900'} text-white rounded-xl`}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          Nộp Bài
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Question Area */}
        <div className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-400">Câu {currentIdx + 1} / {quiz.questions.length}</h2>
            </div>
            
            <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-100 mb-8">
              <p className="text-xl md:text-2xl font-medium text-slate-800 leading-relaxed">
                {currentQ.content}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQ.options.map((opt: string, idx: number) => {
                const isSelected = answers[currentQ.id] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(currentQ.id, idx)}
                    className={`text-left p-6 rounded-2xl border-2 transition-all duration-200 text-lg ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-md shadow-indigo-100' 
                        : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="font-bold mr-3 text-slate-400">{String.fromCharCode(65 + idx)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="max-w-3xl mx-auto w-full mt-8 flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="rounded-xl h-12 px-6 border-2 border-slate-200 text-slate-600 font-semibold"
            >
              <ChevronLeft className="w-5 h-5 mr-1" /> Trước
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setCurrentIdx(prev => Math.min(quiz.questions.length - 1, prev + 1))}
              disabled={currentIdx === quiz.questions.length - 1}
              className="rounded-xl h-12 px-6 border-2 border-slate-200 text-slate-600 font-semibold"
            >
              Sau <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>

        {/* Right: Grid Area (hidden on mobile, can be a drawer but keeping it simple for now) */}
        <div className="w-72 bg-white border-l border-slate-200 p-6 hidden lg:flex flex-col shrink-0 overflow-y-auto">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center justify-between">
            Bảng câu hỏi
            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">{answeredCount}/{quiz.questions.length}</span>
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {quiz.questions.map((q: any, idx: number) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = currentIdx === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all border-2 ${
                    isCurrent ? 'border-indigo-600 bg-indigo-50 text-indigo-700' :
                    isAnswered ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
