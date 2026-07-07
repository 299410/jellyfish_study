'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, Pencil, Trash2, X, Save, Briefcase } from 'lucide-react';

export interface Question {
  id: string;
  content: string;
  order: number;
}

export interface QuestionSet {
  id: string;
  name: string;
  questions: Question[];
}

interface Props {
  onStartSession: (set: QuestionSet) => void;
}

export function QuestionSetList({ onStartSession }: Props) {
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [newSetName, setNewSetName] = useState('');
  const [newSetQuestions, setNewSetQuestions] = useState('');
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editSetName, setEditSetName] = useState('');
  const [editSetQuestions, setEditSetQuestions] = useState('');

  useEffect(() => { fetchSets(); }, []);

  const fetchSets = async () => {
    const res = await fetch('/api/questionsets');
    const data = await res.json();
    setSets(data);
  };

  const createSet = async () => {
    if (!newSetName || !newSetQuestions) return;
    const questions = newSetQuestions.split('\n').filter(q => q.trim());
    await fetch('/api/questionsets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSetName, questions })
    });
    setNewSetName(''); setNewSetQuestions('');
    fetchSets();
  };

  const deleteSet = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this set?')) return;
    await fetch(`/api/questionsets/${id}`, { method: 'DELETE' });
    fetchSets();
  };

  const startEditSet = (set: QuestionSet, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSetId(set.id);
    setEditSetName(set.name);
    setEditSetQuestions(set.questions.map(q => q.content).join('\n'));
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSetId(null);
  };

  const saveEditSet = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editSetName || !editSetQuestions) return;
    const questions = editSetQuestions.split('\n').filter(q => q.trim());
    await fetch(`/api/questionsets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editSetName, questions })
    });
    setEditingSetId(null);
    fetchSets();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full animate-in fade-in duration-500 relative z-10">
      {/* Create Set */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-xl font-black text-slate-900">
          <Plus className="w-5 h-5 text-indigo-500" /> Create New Set
        </div>
        <Card className="p-6 border border-white/60 shadow-[0_20px_50px_-15px_rgba(79,70,229,0.04)] bg-white/40 backdrop-blur-xl rounded-3xl">
          <div className="space-y-5">
            <Input 
              placeholder="Set Name (e.g. IT Interview - Junior)" 
              value={newSetName} 
              onChange={e => setNewSetName(e.target.value)}
              className="bg-white/50 border-slate-200 focus-visible:ring-indigo-400 h-12" 
            />
            <textarea 
              className="w-full border border-slate-200 rounded-3xl p-5 h-48 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none bg-white/50 resize-none transition-all shadow-inner" 
              placeholder="Enter questions (1 per line)...&#10;For example:&#10;Introduce yourself.&#10;Why do you want to work here?" 
              value={newSetQuestions} 
              onChange={e => setNewSetQuestions(e.target.value)}
            />
            <Button onClick={createSet} className="w-full bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl h-14 font-bold shadow-md hover:shadow-indigo-500/25 transition-all">Create Set</Button>
          </div>
        </Card>
      </div>
      
      {/* Select Set */}
      <div className="space-y-6 flex flex-col min-h-[400px] h-full md:h-[calc(100vh-200px)] lg:h-[600px]">
        <div className="flex items-center gap-2 text-xl font-black text-slate-900">
          <MessageSquare className="w-5 h-5 text-cyan-500" /> Select Set
        </div>
        <ScrollArea className="flex-1 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(79,70,229,0.04)] p-5">
          <div className="space-y-3">
            {sets.length === 0 && (
              <div className="text-center p-10 text-slate-400 flex flex-col items-center">
                <Briefcase className="w-12 h-12 mb-4 opacity-20" />
                <p>No sets available. Create a new one!</p>
              </div>
            )}
            {sets.map(set => (
              <div key={set.id} className={`group flex flex-col p-6 rounded-3xl transition-all duration-500 ${editingSetId === set.id ? 'bg-white/60 border border-slate-200 shadow-inner' : 'bg-white/50 border border-slate-100/80 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 hover:-translate-y-1 cursor-pointer'}`} onClick={(e) => { if(!editingSetId) onStartSession(set) }}>
                {editingSetId === set.id ? (
                  // Edit Mode UI
                  <div className="space-y-4 w-full" onClick={e => e.stopPropagation()}>
                    <Input 
                      value={editSetName} 
                      onChange={e => setEditSetName(e.target.value)}
                      className="bg-white h-11" 
                    />
                    <textarea 
                      className="w-full border rounded-2xl p-4 h-32 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none bg-white resize-none text-sm shadow-inner" 
                      value={editSetQuestions} 
                      onChange={e => setEditSetQuestions(e.target.value)}
                    />
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={cancelEdit} className="rounded-2xl h-10 px-6">
                        <X className="w-4 h-4 mr-2" /> Cancel
                      </Button>
                      <Button className="bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl h-10 px-6 shadow-md" onClick={(e) => saveEditSet(set.id, e)}>
                        <Save className="w-4 h-4 mr-2" /> Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode UI
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <p className="font-medium text-slate-900 text-lg group-hover:text-black">{set.name}</p>
                      <p className="text-sm text-slate-500 mt-1">{set.questions.length} questions</p>
                    </div>
                    <div className="flex items-center gap-2 transition-all">
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-full cursor-pointer" onClick={(e) => startEditSet(set, e)} title="Sửa bộ câu hỏi">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-full cursor-pointer" onClick={(e) => deleteSet(set.id, e)} title="Xóa bộ câu hỏi">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button className="bg-slate-900 hover:bg-indigo-600 text-white rounded-full px-6 ml-2 font-semibold shadow-md hover:scale-105 transition-transform cursor-pointer">Bắt đầu</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
