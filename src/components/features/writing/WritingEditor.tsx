'use client';

import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PenTool, CheckCircle2 } from 'lucide-react';

interface WritingEditorProps {
  onEvaluate: (topic: string, text: string) => void;
  isEvaluating: boolean;
}

export function WritingEditor({ onEvaluate, isEvaluating }: WritingEditorProps) {
  const [topic, setTopic] = useState('');
  const [text, setText] = useState('');

  const charCount = text.trim().length;
  const isSubmitDisabled = charCount < 10 || isEvaluating;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Grammar / Topic Input */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
          Topic / Grammar Pattern (Optional)
        </label>
        <Textarea 
          placeholder="Example: Use ~たり~たりします to talk about your weekend..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="resize-none border-slate-200 bg-white/60 focus-visible:ring-indigo-400 rounded-xl p-3 text-sm shadow-sm"
          rows={2}
          disabled={isEvaluating}
        />
      </div>

      {/* Main Writing Input */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-indigo-700 flex items-center gap-2">
          <PenTool className="w-4 h-4" /> Your Writing
        </label>
        <div className="relative">
          <Textarea 
            placeholder="Enter your Japanese text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="resize-none border-indigo-100 bg-white/80 focus-visible:ring-indigo-500 rounded-2xl p-5 text-base shadow-inner min-h-[200px]"
            disabled={isEvaluating}
          />
          <div className="absolute bottom-3 right-4 text-xs font-medium text-slate-400">
            {charCount} characters
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-2">
        <Button 
          onClick={() => onEvaluate(topic, text)} 
          disabled={isSubmitDisabled}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-8 py-6 shadow-lg shadow-indigo-600/20 transition-all hover:scale-105"
        >
          {isEvaluating ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Evaluating...
            </span>
          ) : (
            <span className="flex items-center gap-2 text-base font-bold">
              <CheckCircle2 className="w-5 h-5" /> Evaluate
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
