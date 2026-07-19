'use client';

import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PenTool, CheckCircle2, FileText, ChevronDown } from 'lucide-react';
import { QuestionSet, Question } from '@/components/features/interview/QuestionSetList';

interface WritingEditorProps {
  onEvaluate: (topic: string, text: string) => void;
  isEvaluating: boolean;
  questionSets?: QuestionSet[];
}

export function WritingEditor({ onEvaluate, isEvaluating, questionSets = [] }: WritingEditorProps) {
  const [topic, setTopic] = useState('');
  const [text, setText] = useState('');

  const [selectedSetId, setSelectedSetId] = useState<string>('');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');

  const selectedSet = questionSets.find(s => s.id === selectedSetId);
  const questions = selectedSet ? selectedSet.questions : [];

  useEffect(() => {
    if (selectedQuestionId && questions.length > 0) {
      const q = questions.find(q => q.id === selectedQuestionId);
      if (q) {
        setTopic(`Interview Question: ${q.content}`);
      }
    } else {
      setTopic('');
    }
  }, [selectedQuestionId, questions]);

  const charCount = text.trim().length;
  const isSubmitDisabled = charCount < 10 || isEvaluating;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Question Selector */}
      <div className="flex flex-col gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-500" />
          Choose an Interview Question to Practice
        </label>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <select 
              value={selectedSetId}
              onChange={(e) => {
                setSelectedSetId(e.target.value);
                setSelectedQuestionId('');
              }}
              disabled={isEvaluating || questionSets.length === 0}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
            >
              <option value="" disabled>1. Select a Topic...</option>
              {questionSets.map(set => (
                <option key={set.id} value={set.id}>{set.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>

          <div className="flex-1 relative">
            <select 
              value={selectedQuestionId}
              onChange={(e) => setSelectedQuestionId(e.target.value)}
              disabled={isEvaluating || questions.length === 0}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium disabled:opacity-50"
            >
              <option value="" disabled>2. Select a Question...</option>
              {questions.map(q => (
                <option key={q.id} value={q.id}>{q.content}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Custom Topic Fallback */}
        <div className="pt-2">
          <p className="text-xs text-slate-500 mb-2">Or write your own custom topic/grammar focus:</p>
          <Textarea 
            placeholder="Example: Write about your weekend using past tense..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="resize-none border-slate-200 bg-slate-50 focus-visible:ring-indigo-400 rounded-xl p-3 text-sm"
            rows={1}
            disabled={isEvaluating}
          />
        </div>
      </div>

      {/* Main Writing Input */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-indigo-700 flex items-center gap-2 px-1">
          <PenTool className="w-5 h-5" /> Your Answer Script
        </label>
        <div className="relative group">
          <Textarea 
            placeholder={selectedQuestionId ? "Type your Japanese answer here to prepare for the interview..." : "Enter your Japanese text here..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="resize-none border-indigo-100 bg-white focus-visible:ring-indigo-500 rounded-2xl p-5 pb-8 text-base shadow-inner min-h-[200px] transition-all"
            disabled={isEvaluating}
          />
          <div className="absolute bottom-3 right-4 text-xs font-medium text-slate-400 bg-white/80 px-2 py-1 rounded-md">
            {charCount} characters
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-2">
        <Button 
          onClick={() => onEvaluate(topic, text)} 
          disabled={isSubmitDisabled}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-8 py-6 shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 font-bold text-base gap-2"
        >
          {isEvaluating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Evaluating...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" /> Evaluate Script
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
