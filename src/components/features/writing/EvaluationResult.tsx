'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Quote } from 'lucide-react';

export interface EvaluationError {
  original_sentence: string;
  error_phrase: string;
  correction: string;
  explanation: string;
}

export interface EvaluationData {
  score: number;
  overall_comment: string;
  errors: EvaluationError[];
  rewritten_text: string;
}

interface EvaluationResultProps {
  data: EvaluationData;
  onRetry: () => void;
}

export function EvaluationResult({ data, onRetry }: EvaluationResultProps) {
  
  // Helper to determine score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 border-emerald-100';
    if (score >= 50) return 'bg-amber-50 border-amber-100';
    return 'bg-rose-50 border-rose-100';
  };

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Header / Score Section */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 shadow-sm">
        
        {/* Score Circle */}
        <div className={`relative flex items-center justify-center w-28 h-28 rounded-full border-[6px] ${getScoreBg(data.score)}`}>
          <span className={`text-4xl font-black ${getScoreColor(data.score)}`}>{data.score}</span>
        </div>

        {/* Overall Comment */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <h3 className="text-lg font-bold text-slate-800">Overall Assessment</h3>
          <p className="text-slate-600 leading-relaxed text-base">
            {data.overall_comment}
          </p>
          
          <div className="pt-2">
            {data.errors.length === 0 ? (
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0 px-3 py-1">
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Excellent! No errors found
              </Badge>
            ) : (
              <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-0 px-3 py-1">
                <AlertTriangle className="w-4 h-4 mr-1.5" /> Found {data.errors.length} errors
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Errors List */}
      {data.errors.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-500" /> Error Details
          </h3>
          
          <div className="grid gap-4">
            {data.errors.map((err, idx) => (
              <Card key={idx} className="border border-slate-100 shadow-sm overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                  <div className="bg-rose-50/50 p-4 border-b border-rose-100/50">
                    <p className="text-sm font-medium text-slate-500 mb-1">Original:</p>
                    <p className="text-slate-800 font-medium">
                      {err.original_sentence.split(err.error_phrase).map((part, i, arr) => (
                        <React.Fragment key={i}>
                          {part}
                          {i !== arr.length - 1 && (
                            <span className="bg-rose-200 text-rose-800 px-1 py-0.5 rounded font-bold mx-0.5 decoration-wavy decoration-rose-400 underline underline-offset-4">
                              {err.error_phrase}
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-white space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 bg-emerald-100 text-emerald-700 rounded-md p-1">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Correction</p>
                        <p className="text-emerald-700 font-bold text-base bg-emerald-50 px-2 py-1 rounded inline-block">
                          {err.correction}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 bg-indigo-50 text-indigo-500 rounded-md p-1">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Explanation</p>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          {err.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Rewritten Text */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Quote className="w-5 h-5 text-indigo-500" /> Sample Answer (Reference)
        </h3>
        <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 p-6 rounded-2xl shadow-inner relative">
          <Quote className="absolute top-4 right-4 w-12 h-12 text-indigo-500/10" />
          <p className="text-slate-700 leading-loose text-lg font-medium whitespace-pre-wrap relative z-10">
            {data.rewritten_text}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center pt-6">
        <Button 
          variant="outline" 
          onClick={onRetry}
          className="rounded-2xl px-6 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all hover:scale-105"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Write another
        </Button>
      </div>

    </div>
  );
}
