'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AudioRecorder } from '@/components/AudioRecorder';
import { Play, CheckCircle, ArrowRight } from 'lucide-react';
import { QuestionSet } from './QuestionSetList';

interface Props {
  selectedSet: QuestionSet;
  onFinish: () => void;
}

export function ActiveSession({ selectedSet, onFinish }: Props) {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [speechRate, setSpeechRate] = useState(0.8);

  useEffect(() => {
    initSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initSession = async () => {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionSetId: selectedSet.id, questionSetName: selectedSet.name })
    });
    const data = await res.json();
    setCurrentSessionId(data.id);
    if (selectedSet.questions.length > 0) {
      speak(selectedSet.questions[0].content);
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = speechRate;
      const voices = window.speechSynthesis.getVoices();
      const jpVoice = voices.find(v => v.lang === 'ja-JP' || v.lang === 'ja_JP');
      if (jpVoice) utterance.voice = jpVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAudioComplete = async (blob: Blob) => {
    if (!currentSessionId) return;
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('audio', blob, 'audio.webm');
      const sttRes = await fetch('/api/stt', { method: 'POST', body: formData });
      const sttData = await sttRes.json();
      const userText = sttData.transcript;

      const currentQ = selectedSet.questions[currentQuestionIndex];

      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `The question is: "${currentQ.content}". The user answers: "${userText}". Please review the grammar, vocabulary, and attitude. Praise them if they did well.`,
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
    } finally {
      setIsProcessing(false);
    }
  };

  const nextQuestion = () => {
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx < selectedSet.questions.length) {
      setCurrentQuestionIndex(nextIdx);
      setFeedback('');
      speak(selectedSet.questions[nextIdx].content);
    } else {
      alert('Great! You have completed the interview!');
      onFinish();
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-12 animate-in fade-in duration-700 py-10 relative z-10">
      <div className="text-center space-y-8 max-w-4xl w-full px-4">
        <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-700 font-bold text-xs uppercase tracking-wider shadow-sm">
          Question {currentQuestionIndex + 1} / {selectedSet.questions.length}
        </div>
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tight">
          {selectedSet.questions[currentQuestionIndex].content}
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-center pt-4">
          <Button variant="outline" size="lg" onClick={() => speak(selectedSet.questions[currentQuestionIndex].content)} className="rounded-full h-12 px-6 border-indigo-200/50 hover:bg-indigo-50/50 hover:text-indigo-900 transition-all text-indigo-600 bg-white/40 backdrop-blur-sm">
            <Play className="w-5 h-5 mr-3 fill-current" /> Replay
          </Button>
          <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/60 shadow-sm" title="Speech Rate">
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
      </div>

      {feedback ? (
        <div className="w-full max-w-3xl bg-white/40 backdrop-blur-2xl border border-white/60 p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(79,70,229,0.06)] space-y-8 animate-in slide-in-from-bottom-8 duration-700">
          <h4 className="text-2xl font-black text-slate-900 flex items-center gap-3 pb-6 border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-green-50 border border-green-100/20 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            AI Feedback
          </h4>
          <div className="whitespace-pre-wrap text-slate-600 text-base md:text-lg leading-relaxed font-semibold">{feedback}</div>
          <Button onClick={nextQuestion} size="lg" className="w-full mt-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-3xl text-lg h-16 font-semibold transition-all hover:scale-[1.02] shadow-lg hover:shadow-indigo-500/25">
            {currentQuestionIndex + 1 === selectedSet.questions.length ? 'Complete Interview' : 'Next Question'} <ArrowRight className="w-6 h-6 ml-2" />
          </Button>
        </div>
      ) : (
        <div className="mt-12 scale-125">
          <AudioRecorder onRecordingComplete={handleAudioComplete} isProcessing={isProcessing} />
        </div>
      )}
    </div>
  );
}
