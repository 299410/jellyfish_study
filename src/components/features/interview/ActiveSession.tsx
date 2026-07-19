'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AudioRecorder } from '@/components/AudioRecorder';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, ArrowRight, Eye, EyeOff, Volume2, Mic, Loader2, Sparkles, CheckCircle, LogOut, GraduationCap, XCircle, Lightbulb, Check } from 'lucide-react';
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
  const [jpVoices, setJpVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');

  useEffect(() => {
    initSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load available Japanese voices for speech synthesis
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const jp = allVoices.filter(v => v.lang === 'ja-JP' || v.lang === 'ja_JP' || v.lang.startsWith('ja'));
      setJpVoices(jp);

      if (jp.length > 0) {
        const savedVoice = localStorage.getItem('selected_jp_voice');
        const defaultVoice = jp.find(v => v.name === savedVoice) || jp[0];
        setSelectedVoiceName(defaultVoice.name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoiceName(voiceName);
    localStorage.setItem('selected_jp_voice', voiceName);
    
    // Stop any ongoing speech when switching voice
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

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

      // Select active voice with synchronous fallback if state is not ready yet
      let activeVoice = jpVoices.find(v => v.name === selectedVoiceName) || jpVoices[0];
      if (!activeVoice) {
        const allVoices = window.speechSynthesis.getVoices();
        const jp = allVoices.filter(v => v.lang === 'ja-JP' || v.lang === 'ja_JP' || v.lang.startsWith('ja'));
        activeVoice = jp.find(v => v.name === selectedVoiceName) || jp[0];
      }
      
      if (activeVoice) utterance.voice = activeVoice;
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
      
      // Select active voice with synchronous fallback
      let activeVoice = jpVoices.find(v => v.name === selectedVoiceName) || jpVoices[0];
      if (!activeVoice) {
        const allVoices = window.speechSynthesis.getVoices();
        const jp = allVoices.filter(v => v.lang === 'ja-JP' || v.lang === 'ja_JP' || v.lang.startsWith('ja'));
        activeVoice = jp.find(v => v.name === selectedVoiceName) || jp[0];
      }
      
      if (activeVoice) activeUtterance.voice = activeVoice;
      window.speechSynthesis.speak(activeUtterance);
    }
  };

  const handleAudioComplete = async (blob: Blob) => {
    if (!currentSessionId || questions.length === 0) return;
    setIsProcessing(true);
    setSessionStatus('processing');

    try {
      const apiKey = localStorage.getItem('user_gemini_api_key');
      if (!apiKey) {
        alert("Please configure your Gemini API Key in the Dashboard first.");
        setSessionStatus('listening');
        setIsProcessing(false);
        return;
      }

      const formData = new FormData();
      formData.append('audio', blob, 'audio.webm');
      const sttRes = await fetch('/api/stt', { 
        method: 'POST', 
        headers: { 'x-api-key': apiKey },
        body: formData 
      });
      const sttData = await sttRes.json();
      const userText = sttData.transcript;

      const currentQ = questions[currentQuestionIndex];

      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
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
          <div className="flex flex-col items-center space-y-2 p-4 bg-blue-50/40 border border-blue-100/30 rounded-2xl animate-pulse">
            <Volume2 className="w-8 h-8 text-blue-500" />
            <p className="text-blue-700 font-extrabold text-[10px] uppercase tracking-wider">Speaker: Active</p>
          </div>
        );
      case 'listening':
        return (
          <div className="flex flex-col items-center space-y-2 p-4 bg-emerald-50/40 border border-emerald-100/30 rounded-2xl">
            <Mic className="w-8 h-8 text-emerald-500 animate-bounce" />
            <p className="text-emerald-700 font-extrabold text-[10px] uppercase tracking-wider">Listening to you...</p>
          </div>
        );
      case 'processing':
        return (
          <div className="flex flex-col items-center space-y-2 p-4 bg-amber-50/40 border border-amber-100/30 rounded-2xl">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-amber-700 font-extrabold text-[10px] uppercase tracking-wider">Analyzing response...</p>
          </div>
        );
      case 'feedback':
        return (
          <div className="flex flex-col items-center space-y-2 p-4 bg-indigo-50/40 border border-indigo-100/30 rounded-2xl">
            <Sparkles className="w-8 h-8 text-indigo-500" />
            <p className="text-indigo-700 font-extrabold text-[10px] uppercase tracking-wider">Evaluation Ready</p>
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
        <div className="whitespace-pre-wrap text-slate-700 text-sm leading-relaxed font-semibold">
          {feedback}
        </div>
      );
    }

    const errorDetails = parseErrorDetails(parsed.errorCorrection);
    const sampleDetails = parseSampleDetails(parsed.sampleAnswer);

    return (
      <div className="space-y-6 text-left pb-4">
        
        {/* Section 1: General Review (Border accent style) */}
        {parsed.generalReview && (
          <div className="border-l-4 border-indigo-500 pl-4 py-0.5 space-y-1">
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">General Review</p>
            <p className="text-slate-600 font-bold text-sm leading-relaxed">{parsed.generalReview}</p>
          </div>
        )}

        {/* Section 2: Error Correction */}
        {parsed.errorCorrection && (
          <div className="border-l-4 border-rose-400 pl-4 py-0.5 space-y-2">
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Correction</p>
            {errorDetails.sai || errorDetails.dung ? (
              <div className="space-y-2.5">
                <div className="flex items-center flex-wrap gap-2 text-sm">
                  {errorDetails.sai && (
                    <span className="text-slate-400 line-through font-semibold bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                      {errorDetails.sai}
                    </span>
                  )}
                  {errorDetails.sai && errorDetails.dung && <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />}
                  {errorDetails.dung && (
                    <span className="text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {errorDetails.dung}
                    </span>
                  )}
                </div>
                {errorDetails.lyDo && (
                  <p className="text-xs text-slate-500 font-medium italic leading-relaxed">
                    {errorDetails.lyDo}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-slate-600 text-sm font-semibold leading-relaxed whitespace-pre-wrap">
                {parsed.errorCorrection}
              </p>
            )}
          </div>
        )}

        {/* Section 3: Sample Answer & TTS */}
        {parsed.sampleAnswer && (
          <div className="border-l-4 border-emerald-400 pl-4 py-0.5 space-y-2">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Suggested Japanese</p>
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                {sampleDetails.mau && (
                  <p className="font-black text-indigo-950 text-base font-mono tracking-wide leading-relaxed">
                    {sampleDetails.mau}
                  </p>
                )}
                {sampleDetails.dich && (
                  <p className="text-xs text-slate-400 font-bold italic">
                    {sampleDetails.dich}
                  </p>
                )}
              </div>
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
          </div>
        )}

        {/* Section 4: Teacher's Tip */}
        {parsed.mentorTip && (
          <div className="bg-amber-50/40 border border-amber-200/30 rounded-2xl p-4 flex gap-3 items-start relative overflow-hidden">
            <Lightbulb className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500/80">Teacher's Tip</p>
              <p className="text-slate-600 font-medium text-xs leading-relaxed">{parsed.mentorTip}</p>
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
      <div className="py-6 w-full flex-1 flex flex-col justify-center">
        
        {sessionStatus === 'feedback' && feedback ? (
          // Two-column Split Layout in feedback mode
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full max-w-5xl mx-auto animate-in fade-in duration-500">
            
            {/* Left Side: Question Display, Controls, Next Question Button */}
            <div className="lg:col-span-4 space-y-6 flex flex-col justify-between min-h-[350px]">
              <div className="space-y-5">
                <div className="bg-white/80 backdrop-blur-md border border-slate-100 shadow-lg shadow-slate-100/50 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Current Question</span>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 leading-normal tracking-wide text-center py-4">
                      {currentQuestion.content}
                    </h2>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-md border border-slate-100 shadow-lg shadow-slate-100/50 rounded-3xl p-5 space-y-4">
                  <Button 
                    variant="outline" 
                    onClick={() => speak(currentQuestion.content)} 
                    className="w-full bg-slate-50 hover:bg-indigo-50 border border-indigo-100/30 text-indigo-600 rounded-2xl h-12 font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4.5 h-4.5 fill-current" /> Replay Question
                  </Button>
                  
                  <div className="flex items-center gap-3 w-full justify-between px-2" title="Speech rate">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Speech Rate</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 w-10 text-center">{speechRate}x</span>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="1.5" 
                        step="0.1" 
                        value={speechRate}
                        onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                        className="w-24 accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 w-full pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-1">Voice Accent</span>
                    <select
                      value={selectedVoiceName}
                      onChange={(e) => handleVoiceChange(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 cursor-pointer"
                    >
                      {jpVoices.length === 0 ? (
                        <option value="">Default System Voice</option>
                      ) : (
                        jpVoices.map((voice) => (
                          <option key={voice.name} value={voice.name}>
                            {voice.name.replace(/Microsoft |Google /g, '')} {voice.localService ? '(Local)' : ''}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <Button 
                onClick={nextQuestion} 
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-3xl h-14 font-extrabold text-base transition-all hover:scale-[1.01] shadow-lg shadow-indigo-600/10 cursor-pointer mt-4"
              >
                {currentQuestionIndex + 1 === questions.length ? 'Finish Session' : 'Next Question'} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Right Side: Scrollable Feedback Cards container */}
            <div className="lg:col-span-8 bg-white/95 border border-slate-100 shadow-2xl shadow-indigo-950/5 rounded-3xl p-6 flex flex-col h-[560px] overflow-hidden">
              <h4 className="text-base font-black text-slate-800 flex items-center gap-3 pb-3 border-b border-slate-50 mb-5 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4.5 h-4.5 text-white" />
                </div>
                Teacher's Feedback
              </h4>
              
              <ScrollArea className="flex-1 pr-1">
                {renderParsedFeedback()}
              </ScrollArea>
            </div>

          </div>
        ) : (
          // Standard Single Column centered layout for Active Speaking / Recording state
          <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-2xl mx-auto">
            
            <div className="w-full max-w-md">
              {renderRecruiterState()}
            </div>

            <div className="bg-white/60 backdrop-blur-md border border-white/60 p-8 rounded-3xl w-full shadow-sm relative group min-h-[140px] flex items-center justify-center">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed text-center px-4">
                {showQuestionText ? (
                  currentQuestion.content
                ) : (
                  <span className="text-slate-400 font-medium italic">
                    [ Japanese question is hidden. Listen carefully! ]
                  </span>
                )}
              </h2>

              <button
                onClick={() => setShowQuestionText(!showQuestionText)}
                className="absolute top-4 right-4 text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-slate-100/50 cursor-pointer"
                title={showQuestionText ? "Hide question" : "Reveal question"}
              >
                {showQuestionText ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-center pt-2 w-full max-w-xl">
              <Button 
                variant="outline" 
                size="lg" 
                disabled={sessionStatus === 'processing'}
                onClick={() => speak(currentQuestion.content)} 
                className="rounded-full h-12 px-6 border-indigo-200/50 hover:bg-indigo-50/50 hover:text-indigo-900 transition-all text-indigo-600 bg-white/40 backdrop-blur-sm disabled:opacity-50 cursor-pointer text-sm font-bold shrink-0"
              >
                <Play className="w-4 h-4 mr-2.5 fill-current" /> Replay
              </Button>
              
              <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/60 shadow-sm justify-between animate-in fade-in" title="Speech rate">
                <span className="text-xs font-bold text-slate-500 w-8 text-center">{speechRate}x</span>
                <input 
                  type="range" 
                  min="0.5" 
                  max="1.5" 
                  step="0.1" 
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-20 md:w-24 accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="bg-white/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/60 shadow-sm flex items-center justify-between min-w-[150px] max-w-[220px]" title="Japanese voice selector">
                <select
                  value={selectedVoiceName}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full cursor-pointer pr-1"
                >
                  {jpVoices.length === 0 ? (
                    <option value="">Default Voice</option>
                  ) : (
                    jpVoices.map((voice) => (
                      <option key={voice.name} value={voice.name} className="bg-white text-slate-700 text-xs">
                        {voice.name.replace(/Microsoft |Google /g, '')}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="pt-6 scale-125">
              <AudioRecorder 
                onRecordingComplete={handleAudioComplete} 
                isProcessing={isProcessing || sessionStatus === 'speaking'} 
              />
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
