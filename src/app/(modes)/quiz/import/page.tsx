'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Loader2, Save, Trash2, Plus, Edit3, ChevronDown, ChevronUp, Copy, ArrowUp, ArrowDown, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function QuizImportPage() {
  const router = useRouter();
  
  // Steps: 1 = Paste Text, 2 = Review/Edit
  const [step, setStep] = useState<1 | 2>(1);
  
  const [rawText, setRawText] = useState('');
  const [isParsingText, setIsParsingText] = useState(false);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [parseError, setParseError] = useState('');

  // Quiz State (for Review/Edit)
  const [title, setTitle] = useState('New Language Quiz');
  const [timeLimit, setTimeLimit] = useState<number>(30);
  const [questions, setQuestions] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(0);
  
  const [isSaving, setIsSaving] = useState(false);

  const handleParseText = async () => {
    if (!rawText.trim()) return;
    
    const apiKey = localStorage.getItem('user_gemini_api_key');
    if (!apiKey) {
      setParseError('Please configure your Gemini API Key in the Dashboard first.');
      return;
    }

    setIsParsingText(true);
    setParseError('');

    try {
      const res = await fetch('/api/quiz/parse', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ text: rawText })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse');
      }

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setStep(2);
        setExpandedId(0);
      } else {
        setParseError('AI could not find any quiz questions in this text. Please check the format.');
      }
    } catch (err: any) {
      setParseError(err.message);
    } finally {
      setIsParsingText(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setParseError('Please select a PDF file.');
      return;
    }

    const apiKey = localStorage.getItem('user_gemini_api_key');
    if (!apiKey) {
      setParseError('Please configure your Gemini API Key in the Dashboard first.');
      return;
    }

    setIsParsingPdf(true);
    setParseError('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Url = event.target?.result as string;
        // base64Url looks like data:application/pdf;base64,....
        const base64Data = base64Url.split(',')[1];

        try {
          const res = await fetch('/api/quiz/parse-pdf', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            },
            body: JSON.stringify({ pdfBase64: base64Data })
          });

          const data = await res.json();
          
          if (!res.ok) {
            throw new Error(data.error || 'Failed to parse PDF');
          }

          if (data.questions && data.questions.length > 0) {
            setQuestions(data.questions);
            setTitle(file.name.replace('.pdf', ''));
            setStep(2);
            setExpandedId(0);
          } else {
            setParseError('AI could not find any quiz questions in this PDF file.');
          }
        } catch (err: any) {
          setParseError(err.message);
        } finally {
          setIsParsingPdf(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (err: any) {
      setParseError('Failed to read file: ' + err.message);
      setIsParsingPdf(false);
    }
    
    // reset input
    e.target.value = '';
  };

  const handleSave = async () => {
    if (questions.length === 0) return;
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, timeLimit, questions })
      });

      if (res.ok) {
        router.push('/quiz');
      } else {
        const err = await res.json();
        alert('Error saving quiz: ' + err.error);
      }
    } catch (err: any) {
      alert('Connection error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    const newOptions = [...updated[qIndex].options];
    newOptions[optIndex] = value;
    updated[qIndex].options = newOptions;
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    if (expandedId === index) setExpandedId(null);
  };

  const duplicateQuestion = (index: number) => {
    const newQuestions = [...questions];
    const qToDuplicate = { ...newQuestions[index] };
    newQuestions.splice(index + 1, 0, qToDuplicate);
    setQuestions(newQuestions);
    setExpandedId(index + 1);
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const newQuestions = [...questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[newIndex];
    newQuestions[newIndex] = temp;
    
    setQuestions(newQuestions);
    if (expandedId === index) setExpandedId(newIndex);
    else if (expandedId === newIndex) setExpandedId(index);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-0">
      
      {step === 1 && (
        <>
          <Link href="/quiz">
            <Button variant="ghost" className="mb-2 text-slate-500 font-semibold px-0 hover:bg-transparent hover:text-slate-800">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Quizzes
            </Button>
          </Link>
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">
                Import Quiz
              </h1>
              <p className="text-slate-500">
                Copy and paste your question set here. AI will automatically parse and convert it into a complete multiple-choice quiz.
              </p>
            </div>

            <textarea
              className="w-full h-96 p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 transition-all outline-none resize-none font-mono text-sm"
              placeholder="Example:&#10;Question 1: What is the capital of France?&#10;A. London&#10;B. Paris&#10;C. Berlin&#10;D. Madrid&#10;Answer: B"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />

            {parseError && (
              <div className="mt-4 p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 text-sm font-medium">
                {parseError}
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 justify-end">
              <div className="relative">
                <input 
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  disabled={isParsingPdf || isParsingText}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <Button 
                  variant="outline"
                  disabled={isParsingPdf || isParsingText}
                  className="w-full sm:w-auto rounded-xl px-8 h-12 text-lg font-semibold border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50"
                >
                  {isParsingPdf ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Reading PDF...</>
                  ) : (
                    <><BrainCircuit className="w-5 h-5 mr-2" /> Upload PDF</>
                  )}
                </Button>
              </div>

              <Button 
                onClick={handleParseText} 
                disabled={isParsingText || isParsingPdf || !rawText.trim()}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-12 text-lg font-semibold shadow-lg shadow-indigo-200"
              >
                {isParsingText ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Parsing text...</>
                ) : (
                  <><BrainCircuit className="w-5 h-5 mr-2" /> Extract Text</>
                )}
              </Button>
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <div className="space-y-6 pb-24">
          
          {/* Sticky Header */}
          <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl rounded-b-3xl -mx-4 px-4 md:-mx-8 md:px-8 py-4 border-b border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center transition-all">
            <div className="flex gap-4 items-center w-full md:w-auto flex-1">
              <div className="flex-1">
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl md:text-2xl font-bold border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:border-indigo-500 shadow-none h-auto py-1"
                  placeholder="Quiz Title"
                />
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg shrink-0">
                <span className="text-sm font-semibold text-slate-500">Mins:</span>
                <input 
                  type="number" 
                  value={timeLimit} 
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  className="w-12 bg-transparent border-0 font-bold text-slate-700 text-center focus:ring-0 p-0"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button 
                variant="outline"
                onClick={() => setExpandedId(expandedId === null ? 0 : null)}
                className="w-full md:w-auto bg-white rounded-xl font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                {expandedId === null ? 'Expand 1st' : 'Collapse All'}
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving || questions.length === 0}
                className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-6 h-10 font-semibold shadow-md shadow-emerald-200"
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Save Quiz ({questions.length})</>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((q, qIndex) => {
              const isExpanded = expandedId === qIndex;
              return (
                <div key={qIndex} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
                  {/* Collapsed Header */}
                  <div 
                    className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : qIndex)}
                  >
                    <div className="w-8 h-8 shrink-0 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-bold">
                      {qIndex + 1}
                    </div>
                    <div className="flex-1 truncate font-medium text-slate-700">
                      {q.content || "Empty question..."}
                    </div>
                    <div className="shrink-0 flex items-center gap-1 text-slate-400">
                      <span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded-md">Ans: {['A','B','C','D'][q.correctAnswer]}</span>
                      {isExpanded ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-4 pt-0 md:p-6 md:pt-0 border-t border-slate-100 bg-slate-50/50">
                      
                      <div className="flex justify-end gap-2 mb-4 mt-4">
                        <button onClick={() => moveQuestion(qIndex, 'up')} disabled={qIndex === 0} className="p-1.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30 hover:bg-indigo-50 rounded-md transition-colors"><ArrowUp className="w-4 h-4" /></button>
                        <button onClick={() => moveQuestion(qIndex, 'down')} disabled={qIndex === questions.length - 1} className="p-1.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30 hover:bg-indigo-50 rounded-md transition-colors"><ArrowDown className="w-4 h-4" /></button>
                        <div className="w-px h-6 bg-slate-200 mx-1"></div>
                        <button onClick={() => duplicateQuestion(qIndex)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Duplicate"><Copy className="w-4 h-4" /></button>
                        <button onClick={() => removeQuestion(qIndex)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>

                      <div className="space-y-4">
                        <textarea 
                          value={q.content} 
                          onChange={(e) => updateQuestion(qIndex, 'content', e.target.value)}
                          className="w-full min-h-[80px] p-3 rounded-xl font-medium text-slate-800 bg-white border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 transition-all outline-none resize-y text-sm md:text-base"
                          placeholder="Enter question content..."
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.options.map((opt: string, optIndex: number) => (
                            <div 
                              key={optIndex} 
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors bg-white ${
                                q.correctAnswer === optIndex 
                                  ? 'border-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.1)]' 
                                  : 'border-slate-100 hover:border-slate-200'
                              }`}
                            >
                              <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                                {['A','B','C','D'][optIndex]}
                              </div>
                              <input 
                                type="radio" 
                                name={`correct-${qIndex}`} 
                                checked={q.correctAnswer === optIndex}
                                onChange={() => updateQuestion(qIndex, 'correctAnswer', optIndex)}
                                className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 cursor-pointer shrink-0"
                              />
                              <Input 
                                value={opt}
                                onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                                className="h-auto py-1 border-0 bg-transparent shadow-none focus-visible:ring-0 px-1 font-medium text-slate-700"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Button 
            variant="outline"
            onClick={() => {
              setQuestions([...questions, { content: 'New Question', options: ['A', 'B', 'C', 'D'], correctAnswer: 0 }]);
              setExpandedId(questions.length); // expand the newly added question
            }}
            className="w-full h-14 border-2 border-dashed border-indigo-200 text-indigo-500 hover:text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-2xl font-semibold text-lg transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Question
          </Button>

        </div>
      )}

    </div>
  );
}
