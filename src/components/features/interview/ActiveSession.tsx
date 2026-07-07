'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AudioRecorder } from '@/components/AudioRecorder';
import { Play, ArrowRight, Eye, EyeOff, Volume2, Mic, Loader2, Sparkles, CheckCircle, LogOut } from 'lucide-react';
import { QuestionSet, Question } from './QuestionSetList';

interface Props {
  selectedSet: QuestionSet;
  onFinish: () => void;
}

export function ActiveSession({ selectedSet, onFinish }: Props) {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [speechRate, setSpeechRate] = useState(0.8);
  const [showQuestionText, setShowQuestionText] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'initializing' | 'speaking' | 'listening' | 'processing' | 'feedback'>('initializing');

  useEffect(() => {
    initSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shuffleArray = (array: Question[]) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const initSession = async () => {
    const shuffled = shuffleArray(selectedSet.questions);
    setQuestions(shuffled);

    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionSetId: selectedSet.id, questionSetName: selectedSet.name })
    });
    const data = await res.json();
    setCurrentSessionId(data.id);
    if (shuffled.length > 0) {
      speak(shuffled[0].content);
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      setSessionStatus('speaking');
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = speechRate;

      utterance.onend = () => {
        setSessionStatus('listening');
      };

      utterance.onerror = () => {
        setSessionStatus('listening');
      };

      const voices = window.speechSynthesis.getVoices();
      const jpVoice = voices.find(v => v.lang === 'ja-JP' || v.lang === 'ja_JP');
      if (jpVoice) utterance.voice = jpVoice;
      window.speechSynthesis.speak(utterance);
    } else {
      setSessionStatus('listening');
    }
  };

  const handleAudioComplete = async (blob: Blob) => {
    if (!currentSessionId || questions.length === 0) return;
    setIsProcessing(true);
    setSessionStatus('processing');

    try {
      const formData = new FormData();
      formData.append('audio', blob, 'audio.webm');
      const sttRes = await fetch('/api/stt', { method: 'POST', body: formData });
      const sttData = await sttRes.json();
      const userText = sttData.transcript;

      const currentQ = questions[currentQuestionIndex];

      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Question: "${currentQ.content}"\nUser Answer: "${userText}"`,
          mode: 'interview',
          history: [] 
        })
      });

      const reader = chatRes.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          aiResponse += decoder.decode(value);
          setFeedback(aiResponse);
        }
      }

      setSessionStatus('feedback');

      await fetch(`/api/sessions/${currentSessionId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.content,
          userAnswer: userText,
          feedback: aiResponse
        })
      });

    } catch (error) {
      console.error(error);
      alert('Processing error!');
      setSessionStatus('listening');
    } finally {
      setIsProcessing(false);
    }
  };

  const nextQuestion = () => {
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx < questions.length) {
      setCurrentQuestionIndex(nextIdx);
      setFeedback('');
      setShowQuestionText(false);
      speak(questions[nextIdx].content);
    } else {
      alert('Great! You have completed the interview!');
      onFinish();
    }
  };

  const handleExit = () => {
    if (confirm('Bạn có chắc chắn muốn thoát khỏi phiên phỏng vấn này? Tiến trình chưa hoàn thành sẽ không được lưu.')) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      onFinish();
    }
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Đang khởi tạo phòng phỏng vấn...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const renderRecruiterState = () => {
    switch (sessionStatus) {
      case 'speaking':
        return (
          <div className="flex flex-col items-center space-y-3 p-6 bg-blue-50/50 border border-blue-100/50 rounded-2xl animate-pulse">
            <Volume2 className="w-10 h-10 text-blue-500" />
            <p className="text-blue-700 font-bold text-sm tracking-wide">🔈 NGƯỜI PHỎNG VẤN ĐANG ĐẶT CÂU HỎI...</p>
          </div>
        );
      case 'listening':
        return (
          <div className="flex flex-col items-center space-y-3 p-6 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl">
            <Mic className="w-10 h-10 text-emerald-500 animate-bounce" />
            <p className="text-emerald-700 font-bold text-sm tracking-wide">👂 ĐANG LẮNG NGHE CÂU TRẢ LỜI CỦA BẠN...</p>
          </div>
        );
      case 'processing':
        return (
          <div className="flex flex-col items-center space-y-3 p-6 bg-amber-50/50 border border-amber-100/50 rounded-2xl">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            <p className="text-amber-700 font-bold text-sm tracking-wide">🤖 MENTOR ĐANG CHẤM ĐIỂM & PHÂN TÍCH...</p>
          </div>
        );
      case 'feedback':
        return (
          <div className="flex flex-col items-center space-y-3 p-6 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl">
            <Sparkles className="w-10 h-10 text-indigo-500" />
            <p className="text-indigo-700 font-bold text-sm tracking-wide">📄 KẾT QUẢ ĐÁNH GIÁ TỪ MENTOR</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-700 relative z-10">
      
      {/* Top Header Bar */}
      <div className="flex justify-between items-center w-full pb-6 border-b border-slate-100">
        <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider shadow-sm">
          Câu hỏi {currentQuestionIndex + 1} / {questions.length}
        </div>
        
        <Button 
          variant="ghost" 
          onClick={handleExit}
          className="rounded-full text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" /> Rời phòng phỏng vấn
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col items-center justify-center space-y-10 py-10 w-full">
        
        <div className="w-full max-w-md">
          {renderRecruiterState()}
        </div>

        <div className="bg-white/60 backdrop-blur-md border border-white/60 p-8 rounded-3xl w-full max-w-2xl shadow-sm relative group min-h-[120px] flex items-center justify-center">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed text-center px-4">
            {showQuestionText || sessionStatus === 'feedback' ? (
              currentQuestion.content
            ) : (
              <span className="text-slate-400 font-medium italic">
                [ Câu hỏi tiếng Nhật đang ẩn. Hãy nghe kỹ! ]
              </span>
            )}
          </h2>

          {sessionStatus !== 'feedback' && (
            <button
              onClick={() => setShowQuestionText(!showQuestionText)}
              className="absolute top-4 right-4 text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-slate-100/50 cursor-pointer"
              title={showQuestionText ? "Ẩn câu hỏi" : "Hiển thị câu hỏi (Cứu trợ)"}
            >
              {showQuestionText ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-center pt-2">
          <Button 
            variant="outline" 
            size="lg" 
            disabled={sessionStatus === 'processing'}
            onClick={() => speak(currentQuestion.content)} 
            className="rounded-full h-12 px-6 border-indigo-200/50 hover:bg-indigo-50/50 hover:text-indigo-900 transition-all text-indigo-600 bg-white/40 backdrop-blur-sm disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-5 h-5 mr-3 fill-current" /> Nghe lại (Replay)
          </Button>
          
          <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/60 shadow-sm" title="Tốc độ nói">
            <span className="text-sm font-bold text-slate-500 w-12 text-center">{speechRate}x</span>
            <input 
              type="range" 
              min="0.5" 
              max="1.5" 
              step="0.1" 
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-28 accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>

        {sessionStatus === 'feedback' && feedback ? (
          <div className="w-full max-w-3xl bg-white/40 backdrop-blur-2xl border border-white/60 p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(79,70,229,0.06)] space-y-6 animate-in slide-in-from-bottom-8 duration-700">
            <h4 className="text-2xl font-black text-slate-900 flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-indigo-600" />
              </div>
              Nhận xét từ Mentor
            </h4>
            <div className="whitespace-pre-wrap text-slate-700 text-base md:text-lg leading-relaxed font-semibold">
              {feedback}
            </div>
            <Button 
              onClick={nextQuestion} 
              size="lg" 
              className="w-full mt-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-3xl text-lg h-16 font-semibold transition-all hover:scale-[1.02] shadow-lg hover:shadow-indigo-500/25 cursor-pointer"
            >
              {currentQuestionIndex + 1 === questions.length ? 'Hoàn thành Phỏng vấn' : 'Câu hỏi tiếp theo'} <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
          </div>
        ) : (
          <div className="mt-6 scale-125">
            <AudioRecorder 
              onRecordingComplete={handleAudioComplete} 
              isProcessing={isProcessing || sessionStatus === 'speaking'} 
            />
          </div>
        )}

      </div>
    </div>
  );
}

