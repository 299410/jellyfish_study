'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClipboardList, Plus, Clock, FileQuestion, ChevronRight, BrainCircuit, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function QuizDashboardPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/quiz')
      .then(res => res.json())
      .then(data => {
        setQuizzes(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-br from-indigo-900 to-slate-800 bg-clip-text text-transparent mb-3">
            Language Quizzes
          </h1>
          <p className="text-slate-500 text-lg flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-400" />
            AI-powered language quizzes
          </p>
        </div>
        
        <Link href="/quiz/import">
          <Button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-200 gap-2 font-semibold">
            <Plus className="w-5 h-5" />
            Create New Quiz
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-3xl p-6 h-48 border border-slate-100 shadow-sm animate-pulse" />
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
            <ClipboardList className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No quizzes found</h3>
          <p className="text-slate-500 mb-6 max-w-md">
            You can create a new quiz by copying any set of questions and letting AI automatically parse it into a test.
          </p>
          <Link href="/quiz/import">
            <Button variant="outline" className="rounded-2xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-semibold">
              Create your first quiz
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map(quiz => (
            <div 
              key={quiz.id} 
              onClick={() => router.push(`/quiz/${quiz.id}/setup`)}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 hover:border-indigo-200 transition-all duration-300 group cursor-pointer h-full flex flex-col relative"
            >
              
              <Link 
                href={`/quiz/${quiz.id}/edit`} 
                onClick={(e) => e.stopPropagation()}
                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 z-10"
              >
                <Edit2 className="w-5 h-5" />
              </Link>

              <div className="flex-1 pr-8">
                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {quiz.title}
                </h3>
                
                <div className="flex flex-wrap gap-3 mt-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                    <FileQuestion className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{quiz._count.questions} questions</span>
                  </div>
                  {quiz.timeLimit && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">{quiz.timeLimit} min</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  {quiz._count.sessions} plays
                </span>
                <div className="flex items-center text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform">
                  Take Test <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
