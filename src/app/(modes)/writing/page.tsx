'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PenTool } from 'lucide-react';
import { WritingEditor } from '@/components/features/writing/WritingEditor';
import { EvaluationResult, EvaluationData } from '@/components/features/writing/EvaluationResult';

export default function WritingPage() {
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleEvaluate = async (topic: string, text: string) => {
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/writing/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, text }),
      });

      if (!res.ok) {
        throw new Error('Failed to evaluate writing');
      }

      const data: EvaluationData = await res.json();
      setEvaluation(data);
    } catch (error) {
      console.error(error);
      alert('Đã có lỗi xảy ra khi chấm bài. Vui lòng thử lại sau.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRetry = () => {
    setEvaluation(null);
  };

  return (
    <div className="min-h-screen p-4 md:p-10 relative overflow-hidden flex justify-center bg-[#FAFAFC] z-10 w-full">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-gradient-to-br from-indigo-200/40 to-transparent rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tl from-emerald-200/40 to-transparent rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <Card className="w-full max-w-4xl shadow-[0_20px_60px_-15px_rgba(79,70,229,0.06)] border border-white/60 overflow-hidden bg-white/40 backdrop-blur-2xl rounded-[2.5rem] relative z-10 self-start mt-8">
        <CardHeader className="border-b border-slate-100 bg-white/40 backdrop-blur-md p-6 md:p-8">
          <CardTitle className="text-2xl font-black flex items-center gap-3 text-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 border border-indigo-100/20 flex items-center justify-center shadow-sm">
              <PenTool className="w-6 h-6" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent block">
                Luyện Viết JLPT
              </span>
              <span className="text-sm font-medium text-slate-500 block mt-1">
                AI Chấm điểm ngữ pháp N5 - N3
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 md:p-8">
          {!evaluation ? (
            <WritingEditor 
              onEvaluate={handleEvaluate} 
              isEvaluating={isEvaluating} 
            />
          ) : (
            <EvaluationResult 
              data={evaluation} 
              onRetry={handleRetry} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
