'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Clock, FileQuestion, Play, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function QuizSetupPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/quiz/${id}`)
      .then(res => res.json())
      .then(data => {
        setQuiz(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!quiz || quiz.error) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-2xl font-bold text-slate-800">Không tìm thấy bộ đề</h2>
        <Link href="/quiz">
          <Button variant="outline" className="rounded-xl">Quay lại Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-0">
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-indigo-100/20 text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-10 h-10 text-indigo-500" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-800 mb-2">{quiz.title}</h1>
        <p className="text-slate-500 mb-8">Bạn đã sẵn sàng để thử sức chưa?</p>

        <div className="flex items-center justify-center gap-6 mb-10">
          <div className="bg-slate-50 rounded-2xl p-4 w-32">
            <FileQuestion className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-700">{quiz.questions.length}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide font-bold mt-1">Câu hỏi</div>
          </div>
          
          <div className="bg-slate-50 rounded-2xl p-4 w-32">
            <Clock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-700">{quiz.timeLimit || '--'}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide font-bold mt-1">Phút</div>
          </div>
        </div>

        <div className="bg-indigo-50/50 rounded-2xl p-6 text-left mb-10 border border-indigo-100/50">
          <h3 className="font-bold text-indigo-900 mb-2">Lưu ý trước khi làm bài:</h3>
          <ul className="text-sm text-indigo-700 space-y-2">
            <li>• Hệ thống sẽ tự động nộp bài khi hết giờ.</li>
            <li>• Bạn không thể dừng đồng hồ giữa chừng.</li>
            <li>• Đừng thoát trang web trong lúc làm bài.</li>
          </ul>
        </div>

        <Link href={`/quiz/${quiz.id}/take`}>
          <Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-lg font-bold shadow-lg shadow-indigo-200 group">
            Bắt đầu làm bài
            <Play className="w-5 h-5 ml-2 group-hover:scale-125 transition-transform" />
          </Button>
        </Link>
        
        <div className="mt-4">
          <Link href="/quiz">
            <Button variant="ghost" className="text-slate-500 hover:text-slate-700">
              Quay lại
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
