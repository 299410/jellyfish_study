'use client';

import React, { useState, useRef, useEffect } from 'react';
import { QuestionSetList, QuestionSet } from '@/components/features/interview/QuestionSetList';
import { ActiveSession } from '@/components/features/interview/ActiveSession';
import { Briefcase } from 'lucide-react';
import { logActivity } from '@/app/actions/activity';
import { useUserId } from '@/components/UserOnboarding';

export default function InterviewMode() {
  const userId = useUserId();
  const startTimeRef = useRef(Date.now());
  const [selectedSet, setSelectedSet] = useState<QuestionSet | null>(null);

  // Track active study time in Interview Room
  useEffect(() => {
    startTimeRef.current = Date.now();
    return () => {
      const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (userId && durationSeconds >= 2) {
        logActivity(userId, "INTERVIEW", durationSeconds);
      }
    };
  }, [userId]);

  return (
    <div className="min-h-screen bg-[#FAFAFC] p-6 md:p-10 lg:p-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-gradient-to-br from-indigo-200/40 to-transparent rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tl from-cyan-200/40 to-transparent rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto h-full flex flex-col">
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 flex items-center gap-4 tracking-tight">
            <div className="p-3 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm border border-white/60 text-slate-700">
              <Briefcase className="w-6 h-6" />
            </div>
            <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">Virtual Interview Room</span>
          </h1>
          <p className="text-slate-500 mt-3 text-lg font-medium max-w-2xl">
            Practice answering interview questions with AI. Improve pronunciation, grammar, and confidence.
          </p>
        </header>
        
        <main className="flex-1">
          {!selectedSet ? (
            <QuestionSetList onStartSession={(set) => setSelectedSet(set)} />
          ) : (
            <ActiveSession selectedSet={selectedSet} onFinish={() => setSelectedSet(null)} />
          )}
        </main>
      </div>
    </div>
  );
}
