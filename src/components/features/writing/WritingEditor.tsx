'use client';

import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PenTool, CheckCircle2, FileText, ChevronDown, Sparkles, MessageSquare } from 'lucide-react';
import { QuestionSet, Question } from '@/components/features/interview/QuestionSetList';
import { cn } from '@/lib/utils';

interface WritingEditorProps {
  onEvaluate: (topic: string, text: string) => void;
  isEvaluating: boolean;
  questionSets?: QuestionSet[];
}

type Mode = 'free' | 'interview';

export function WritingEditor({ onEvaluate, isEvaluating, questionSets = [] }: WritingEditorProps) {
  const [mode, setMode] = useState<Mode>('interview');
  const [topic, setTopic] = useState('');
  const [text, setText] = useState('');

  const [selectedSetId, setSelectedSetId] = useState<string>('');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(true);

  const selectedSet = questionSets.find(s => s.id === selectedSetId);
  const questions = selectedSet ? selectedSet.questions : [];

  // Initialize first set by default
  useEffect(() => {
    if (questionSets.length > 0 && !selectedSetId) {
      setSelectedSetId(questionSets[0].id);
    }
  }, [questionSets, selectedSetId]);

  useEffect(() => {
    if (mode === 'interview' && selectedQuestion) {
      setTopic(`Interview Question: ${selectedQuestion.content}`);
    } else if (mode === 'free' && selectedQuestion) {
      // Clear topic if switching to free mode, but maybe keep it? Let's just keep whatever is in 'topic' state
    }
  }, [selectedQuestion, mode]);

  const charCount = text.trim().length;
  const isSubmitDisabled = charCount < 10 || isEvaluating;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Mode Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100/80 rounded-2xl w-fit self-center or self-start shadow-inner">
        <button
          onClick={() => setMode('interview')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
            mode === 'interview' 
              ? "bg-white text-indigo-700 shadow-sm" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          )}
        >
          <MessageSquare className="w-4 h-4" /> Luyện Phỏng Vấn
        </button>
        <button
          onClick={() => setMode('free')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
            mode === 'free' 
              ? "bg-white text-emerald-700 shadow-sm" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          )}
        >
          <Sparkles className="w-4 h-4" /> Viết Tự Do
        </button>
      </div>

      {/* Dynamic Header based on Mode */}
      {mode === 'interview' && (
        <div className="flex flex-col gap-4">
          {/* Question Set Pills (Horizontal Scroll) */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {questionSets.map(set => (
              <button
                key={set.id}
                onClick={() => {
                  setSelectedSetId(set.id);
                  setSelectedQuestion(null);
                  setIsSelectorOpen(true);
                }}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all border",
                  selectedSetId === set.id 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {set.name}
              </button>
            ))}
          </div>

          {/* Questions Grid/List */}
          {selectedSetId && isSelectorOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-300">
              {questions.map(q => (
                <button
                  key={q.id}
                  onClick={() => {
                    setSelectedQuestion(q);
                    setIsSelectorOpen(false); // Auto collapse after choosing
                  }}
                  className={cn(
                    "text-left p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.02]",
                    selectedQuestion?.id === q.id 
                      ? "bg-gradient-to-br from-indigo-500 to-indigo-600 border-transparent text-white shadow-md"
                      : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:shadow-sm"
                  )}
                >
                  <p className="text-sm font-medium line-clamp-2">{q.content}</p>
                </button>
              ))}
            </div>
          )}

          {/* Selected Question Pinned (Glassmorphism) */}
          {selectedQuestion && !isSelectorOpen && (
            <div className="relative group cursor-pointer" onClick={() => setIsSelectorOpen(true)}>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-purple-100 opacity-50 rounded-2xl blur"></div>
              <div className="relative flex items-center justify-between p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-white shadow-sm hover:bg-white/80 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">{selectedQuestion.content}</p>
                </div>
                <ChevronDown className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'free' && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
            Topic / Grammar Pattern (Optional)
          </label>
          <Textarea 
            placeholder="Example: Write about your weekend using past tense..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="resize-none border-slate-200 bg-white/60 focus-visible:ring-emerald-400 rounded-xl p-3 text-sm shadow-sm"
            rows={2}
            disabled={isEvaluating}
          />
        </div>
      )}

      {/* Main Writing Input */}
      <div className="flex flex-col gap-2">
        <label className={cn(
          "text-sm font-bold flex items-center gap-2 px-1",
          mode === 'interview' ? "text-indigo-700" : "text-emerald-700"
        )}>
          <PenTool className="w-5 h-5" /> 
          {mode === 'interview' ? "Your Answer Script" : "Your Writing"}
        </label>
        <div className="relative group">
          <Textarea 
            placeholder={
              mode === 'interview' 
                ? (selectedQuestion ? "Gõ câu trả lời của bạn vào đây..." : "Hãy chọn 1 câu hỏi phỏng vấn ở trên trước...") 
                : "Gõ đoạn văn của bạn vào đây..."
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={cn(
              "resize-none bg-white/80 rounded-2xl p-5 pb-8 text-base shadow-inner min-h-[200px] transition-all duration-300",
              mode === 'interview' ? "border-indigo-100 focus-visible:ring-indigo-500" : "border-emerald-100 focus-visible:ring-emerald-500"
            )}
            disabled={isEvaluating || (mode === 'interview' && !selectedQuestion)}
          />
          <div className="absolute bottom-3 right-4 text-xs font-medium text-slate-400 bg-white/80 px-2 py-1 rounded-md">
            {charCount} characters
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-2">
        <Button 
          onClick={() => onEvaluate(mode === 'free' ? topic : (selectedQuestion ? `Interview Question: ${selectedQuestion.content}` : ''), text)} 
          disabled={isSubmitDisabled || (mode === 'interview' && !selectedQuestion)}
          className={cn(
            "text-white rounded-2xl px-8 py-6 shadow-lg transition-all hover:scale-105 font-bold text-base gap-2",
            mode === 'interview' 
              ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20" 
              : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
          )}
        >
          {isEvaluating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Evaluating...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" /> 
              {mode === 'interview' ? "Evaluate Script" : "Evaluate"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
