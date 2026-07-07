'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AudioRecorder } from '@/components/AudioRecorder';
import { Play, ArrowRight, Eye, EyeOff, Volume2, Mic, Loader2, Sparkles, CheckCircle, LogOut, GraduationCap, XCircle, AlertCircle, Lightbulb, Check } from 'lucide-react';
import { QuestionSet, Question } from './QuestionSetList';

interface Props {
  selectedSet: QuestionSet;
  onFinish: () => void;
}

interface ParsedFeedback {
  generalReview: string;
  errorCorrection: string;
  sampleAnswer: string;
  mentorTip: string;
}

function parseFeedback(text: string): ParsedFeedback {
  const sections = {
    generalReview: '',
    errorCorrection: '',
    sampleAnswer: '',
    mentorTip: '',
  };

  // Match headers with fallback for format variations
  const generalMatch = text.match(/(?:===|###)\s*ĐÁNH GIÁ CHUNG\s*(?:===|###)?([\s\S]*?)(?=(?:===|###)\s*(?:CÂU SỬA LỖI|CÁCH SỬA LỖI|CÂU TRẢ LỜI MẪU|MẸO CỦA THẦY CÔ)|$)/);
  const errorMatch = text.match(/(?:===|###)\s*(?:CÂU SỬA LỖI|CÁCH SỬA LỖI)\s*(?:===|###)?([\s\S]*?)(?=(?:===|###)\s*(?:CÂU TRẢ LỜI MẪU|MẸO CỦA THẦY CÔ)|$)/);
  const sampleMatch = text.match(/(?:===|###)\s*(?:CÂU TRẢ LỜI MẪU)\s*(?:===|###)?([\s\S]*?)(?=(?:===|###)\s*(?:MẸO CỦA THẦY CÔ)|$)/);
  const tipMatch = text.match(/(?:===|###)\s*(?:MẸO CỦA THẦY CÔ)\s*(?:===|###)?([\s\S]*?)$/);

  if (generalMatch) sections.generalReview = generalMatch[1].trim();
  if (errorMatch) sections.errorCorrection = errorMatch[1].trim();
  if (sampleMatch) sections.sampleAnswer = sampleMatch[1].trim();
  if (tipMatch) sections.mentorTip = tipMatch[1].trim();

  // Fallback if no sections were parsed
  if (!sections.generalReview && !sections.errorCorrection && !sections.sampleAnswer && !sections.mentorTip) {
    sections.generalReview = text;
  }

  return sections;
}

function parseErrorDetails(errorText: string) {
  const saiMatch = errorText.match(/Sai:\s*["“'‘]?(.*?)["”'’]?\s*(?:\r?\n|->|⇒|Đúng:|$)/i);
  const dungMatch = errorText.match(/Đúng:\s*["“'‘]?(.*?)["”'’]?\s*(?:\r?\n|Lý do:|$)/i);
  const lyDoMatch = errorText.match(/Lý do:\s*(.*)/i);

  return {
    sai: saiMatch ? saiMatch[1].trim() : null,
    dung: dungMatch ? dungMatch[1].trim() : null,
    lyDo: lyDoMatch ? lyDoMatch[1].trim() : null,
  };
}

function parseSampleDetails(sampleText: string) {
  const mauMatch = sampleText.match(/Câu mẫu:\s*["“'‘]?(.*?)["”'’]?\s*(?:\r?\n|Dịch nghĩa:|$)/i);
  const dichMatch = sampleText.match(/Dịch nghĩa:\s*["“'‘]?(.*?)["”'’]?\s*$/i);

  return {
    mau: mauMatch ? mauMatch[1].trim() : null,
    dich: dichMatch ? dichMatch[1].trim() : null,
  };
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

  const speakSample = (text: string) => {
    if ('speechSynthesis' in window) {
      const activeUtterance = new SpeechSynthesisUtterance(text);
      activeUtterance.lang = 'ja-JP';
      activeUtterance.rate = speechRate;
      const voices = window.speechSynthesis.getVoices();
      const jpVoice = voices.find(v => v.lang === 'ja-JP' || v.lang === 'ja_JP');
      if (jpVoice) activeUtterance.voice = jpVoice;
      window.speechSynthesis.speak(activeUtterance);
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
      alert('Great! You have completed the speaking session!');
      onFinish();
    }
  };

  const handleExit = () => {
    if (confirm('Are you sure you want to exit? Your progress in this session will not be saved.')) {
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
        <p className="text-slate-500 font-medium">Initializing room...</p>
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
            <p className="text-blue-700 font-bold text-sm tracking-wide uppercase">🔈 Teacher is speaking...</p>
          </div>
        );
      case 'listening':
        return (
          <div className="flex flex-col items-center space-y-3 p-6 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl">
            <Mic className="w-10 h-10 text-emerald-500 animate-bounce" />
            <p className="text-emerald-700 font-bold text-sm tracking-wide uppercase">👂 Listening to your response...</p>
          </div>
        );
      case 'processing':
        return (
          <div className="flex flex-col items-center space-y-3 p-6 bg-amber-50/50 border border-amber-100/50 rounded-2xl">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            <p className="text-amber-700 font-bold text-sm tracking-wide uppercase">🤖 Evaluating response...</p>
          </div>
        );
      case 'feedback':
        return (
          <div className="flex flex-col items-center space-y-3 p-6 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl">
            <Sparkles className="w-10 h-10 text-indigo-500" />
            <p className="text-indigo-700 font-bold text-sm tracking-wide uppercase">📄 Feedback Received</p>
          </div>
        );
      default:
        return null;
    }
  };

  const renderParsedFeedback = () => {
    const parsed = parseFeedback(feedback);
    
    // Check if it is a general fallback
    if (!parsed.errorCorrection && !parsed.sampleAnswer && !parsed.mentorTip) {
      return (
        <div className="whitespace-pre-wrap text-slate-700 text-base md:text-lg leading-relaxed font-semibold">
          {feedback}
        </div>
      );
    }

    const errorDetails = parseErrorDetails(parsed.errorCorrection);
    const sampleDetails = parseSampleDetails(parsed.sampleAnswer);

    return (
      <div className="space-y-6 text-left">
        
        {/* Card 1: General Review */}
        {parsed.generalReview && (
          <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-3xl p-5 flex gap-4 items-start shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">General Review</p>
              <p className="text-slate-700 font-bold text-base leading-relaxed">{parsed.generalReview}</p>
            </div>
          </div>
        )}

        {/* Card 2: Error Correction */}
        {parsed.errorCorrection && (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Correction</span>
            </div>
            {errorDetails.sai || errorDetails.dung ? (
              <div className="space-y-3">
                {errorDetails.sai && (
                  <div className="bg-rose-50/50 border border-rose-100/40 text-rose-800 px-4 py-3.5 rounded-2xl flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wider text-rose-400">Your Answer</p>
                      <p className="font-semibold text-sm mt-0.5">{errorDetails.sai}</p>
                    </div>
                  </div>
                )}
                {errorDetails.dung && (
                  <div className="bg-emerald-50/50 border border-emerald-100/40 text-emerald-800 px-4 py-3.5 rounded-2xl flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Suggested Correction</p>
                      <p className="font-bold text-sm mt-0.5">{errorDetails.dung}</p>
                    </div>
                  </div>
                )}
                {errorDetails.lyDo && (
                  <p className="text-sm text-slate-500 font-medium pl-3 border-l-2 border-slate-200 mt-2 italic">
                    {errorDetails.lyDo}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-slate-700 text-sm font-semibold leading-relaxed whitespace-pre-wrap">
                {parsed.errorCorrection}
              </p>
            )}
          </div>
        )}

        {/* Card 3: Sample Answer & TTS audio */}
        {parsed.sampleAnswer && (
          <div className="bg-gradient-to-br from-indigo-50/20 to-purple-50/20 border border-indigo-100/30 rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Sample Japanese</span>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => speakSample(sampleDetails.mau || parsed.sampleAnswer)}
                className="h-9 w-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full cursor-pointer flex shrink-0 hover:scale-105 transition-all shadow-md shadow-indigo-600/10"
                title="Listen to native voice"
              >
                <Volume2 className="w-4 h-4 fill-current" />
              </Button>
            </div>
            {sampleDetails.mau || sampleDetails.dich ? (
              <div className="space-y-2">
                {sampleDetails.mau && (
                  <p className="font-black text-indigo-950 text-xl font-mono tracking-wide leading-relaxed">
                    {sampleDetails.mau}
                  </p>
                )}
                {sampleDetails.dich && (
                  <p className="text-sm text-slate-500 font-bold italic">
                    {sampleDetails.dich}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-indigo-950 font-bold text-base leading-relaxed whitespace-pre-wrap">
                {parsed.sampleAnswer}
              </p>
            )}
          </div>
        )}

        {/* Card 4: Teacher's Tip */}
        {parsed.mentorTip && (
          <div className="bg-amber-50/40 border border-amber-200/40 rounded-3xl p-5 flex gap-4 items-start shadow-sm relative overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="w-5 h-5 text-amber-500" />
            </div>
            <div className="space-y-1 relative z-10">
              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-500/80">Teacher's Tip</p>
              <p className="text-slate-700 font-bold text-sm leading-relaxed">{parsed.mentorTip}</p>
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-700 relative z-10">
      
      {/* Top Header Bar */}
      <div className="flex justify-between items-center w-full pb-6 border-b border-slate-100">
        <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider shadow-sm">
          Question {currentQuestionIndex + 1} / {questions.length}
        </div>
        
        <Button 
          variant="ghost" 
          onClick={handleExit}
          className="rounded-full text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" /> Exit Room
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
                [ Japanese question is hidden. Listen carefully! ]
              </span>
            )}
          </h2>

          {sessionStatus !== 'feedback' && (
            <button
              onClick={() => setShowQuestionText(!showQuestionText)}
              className="absolute top-4 right-4 text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-slate-100/50 cursor-pointer"
              title={showQuestionText ? "Hide question" : "Reveal question"}
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
            <Play className="w-5 h-5 mr-3 fill-current" /> Replay Question
          </Button>
          
          <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/60 shadow-sm" title="Speech rate">
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
          <div className="w-full max-w-3xl bg-white/40 backdrop-blur-2xl border border-white/60 p-6 md:p-8 rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(79,70,229,0.06)] space-y-6 animate-in slide-in-from-bottom-8 duration-700">
            <h4 className="text-xl font-black text-slate-900 flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100/20 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
              </div>
              Teacher's Feedback 🌟
            </h4>
            
            {/* Parsed and Beautified Cards */}
            {renderParsedFeedback()}

            <Button 
              onClick={nextQuestion} 
              size="lg" 
              className="w-full mt-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-3xl text-lg h-16 font-semibold transition-all hover:scale-[1.02] shadow-lg hover:shadow-indigo-500/25 cursor-pointer"
            >
              {currentQuestionIndex + 1 === questions.length ? 'Finish Session' : 'Next Question'} <ArrowRight className="w-6 h-6 ml-2" />
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
