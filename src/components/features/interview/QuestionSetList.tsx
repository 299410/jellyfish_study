'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Pencil, Trash2, X, Save, Briefcase, ListTodo, Clipboard, Play } from 'lucide-react';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  
  // Modal Form States
  const [setName, setSetName] = useState('');
  const [questionsList, setQuestionsList] = useState<string[]>([]);
  const [bulkText, setBulkText] = useState('');
  const [activeTab, setActiveTab] = useState<'structured' | 'bulk'>('structured');
  const [newQuestionInput, setNewQuestionInput] = useState('');

  useEffect(() => {
    fetchSets();
  }, []);

  const fetchSets = async () => {
    try {
      const res = await fetch('/api/questionsets');
      const data = await res.json();
      setSets(data);
    } catch (error) {
      console.error('Failed to fetch sets:', error);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedSetId(null);
    setSetName('');
    setQuestionsList([]);
    setBulkText('');
    setNewQuestionInput('');
    setActiveTab('structured');
    setIsModalOpen(true);
  };

  const openEditModal = (set: QuestionSet, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalMode('edit');
    setSelectedSetId(set.id);
    setSetName(set.name);
    const questions = set.questions.map(q => q.content);
    setQuestionsList(questions);
    setBulkText(questions.join('\n'));
    setNewQuestionInput('');
    setActiveTab('structured');
    setIsModalOpen(true);
  };

  const deleteSet = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this question set?')) return;
    try {
      await fetch(`/api/questionsets/${id}`, { method: 'DELETE' });
      fetchSets();
    } catch (error) {
      console.error('Failed to delete set:', error);
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestionInput.trim()) return;
    const updatedList = [...questionsList, newQuestionInput.trim()];
    setQuestionsList(updatedList);
    setBulkText(updatedList.join('\n'));
    setNewQuestionInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddQuestion();
    }
  };

  const handleRemoveQuestion = (index: number) => {
    const updatedList = questionsList.filter((_, idx) => idx !== index);
    setQuestionsList(updatedList);
    setBulkText(updatedList.join('\n'));
  };

  const handleEditQuestionInline = (index: number, newContent: string) => {
    const updatedList = [...questionsList];
    updatedList[index] = newContent;
    setQuestionsList(updatedList);
    setBulkText(updatedList.join('\n'));
  };

  const handleBulkTextChange = (text: string) => {
    setBulkText(text);
    const parsed = text.split('\n').filter(q => q.trim());
    setQuestionsList(parsed);
  };

  const handleSaveSet = async () => {
    if (!setName.trim()) {
      alert('Please enter a set name.');
      return;
    }

    const finalQuestions = activeTab === 'bulk' 
      ? bulkText.split('\n').filter(q => q.trim())
      : questionsList;

    if (finalQuestions.length === 0) {
      alert('Please add at least one question.');
      return;
    }

    try {
      if (modalMode === 'create') {
        await fetch('/api/questionsets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: setName.trim(), questions: finalQuestions })
        });
      } else if (modalMode === 'edit' && selectedSetId) {
        await fetch(`/api/questionsets/${selectedSetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: setName.trim(), questions: finalQuestions })
        });
      }
      setIsModalOpen(false);
      fetchSets();
    } catch (error) {
      console.error('Failed to save question set:', error);
      alert('An error occurred while saving the set.');
    }
  };

  return (
    <div className="w-full space-y-6 relative z-10 animate-in fade-in duration-500">
      
      {/* Header bar with total sets count and Create button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Select or Create a Question Set</h2>
          <p className="text-sm text-slate-500">Choose a set below to start practicing or create your own custom set.</p>
        </div>
        <Button 
          onClick={openCreateModal}
          className="bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl h-11 px-6 font-bold shadow-md hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Create New Set
        </Button>
      </div>

      {/* Sets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sets.map(set => (
          <Card 
            key={set.id}
            onClick={() => onStartSession(set)}
            className="group relative p-6 bg-white/50 border border-slate-100 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 transition-all duration-300 rounded-3xl flex flex-col justify-between min-h-[190px] cursor-pointer"
          >
            <div>
              <p className="font-extrabold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors leading-tight">
                {set.name}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/50 text-slate-600 text-xs font-bold mt-4">
                <ListTodo className="w-3.5 h-3.5" /> {set.questions.length} Questions
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 text-slate-400 hover:bg-slate-100 hover:text-slate-800 rounded-full cursor-pointer transition-colors"
                  onClick={(e) => openEditModal(set, e)}
                  title="Edit Set"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-full cursor-pointer transition-colors"
                  onClick={(e) => deleteSet(set.id, e)}
                  title="Delete Set"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <Button 
                className="bg-slate-900 hover:bg-indigo-600 text-white rounded-full px-5 py-2 text-xs font-bold shadow-sm hover:scale-105 transition-transform cursor-pointer flex items-center gap-1.5"
              >
                Start <Play className="w-3 h-3 fill-current" />
              </Button>
            </div>
          </Card>
        ))}

        {/* Empty placeholder card to Create New */}
        <div 
          onClick={openCreateModal}
          className="group p-6 border-2 border-dashed border-slate-200 bg-slate-50/20 hover:bg-slate-50/60 hover:border-indigo-300 hover:shadow-md transition-all duration-300 rounded-3xl flex flex-col items-center justify-center min-h-[190px] cursor-pointer text-center"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 flex items-center justify-center mb-3 transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <p className="font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">Add Custom Set</p>
          <p className="text-xs text-slate-400 mt-1">Create a new interview question set</p>
        </div>
      </div>

      {sets.length === 0 && (
        <div className="text-center py-20 bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl shadow-sm max-w-md mx-auto">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="font-bold text-slate-700">No question sets found</p>
          <p className="text-sm text-slate-500 mt-1">Click the button above to create your first set.</p>
        </div>
      )}

      {/* --- CREATE / EDIT DIALOG --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl p-6 md:p-8 max-w-2xl w-full max-h-[85vh] flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100/50 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-6">
              {modalMode === 'create' ? 'Create Question Set' : 'Edit Question Set'}
            </h3>

            {/* Set Name Input */}
            <div className="space-y-2 mb-6">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Set Name</label>
              <Input 
                placeholder="e.g. IT Job Interview - Advanced"
                value={setName}
                onChange={e => setSetName(e.target.value)}
                className="bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-400 h-12 rounded-xl"
              />
            </div>

            {/* Tab Headers */}
            <div className="flex border-b border-slate-100 mb-4">
              <button
                onClick={() => setActiveTab('structured')}
                className={`pb-3 px-4 font-bold text-sm tracking-wide border-b-2 cursor-pointer transition-all flex items-center gap-2 ${activeTab === 'structured' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <ListTodo className="w-4 h-4" /> Structured List
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={`pb-3 px-4 font-bold text-sm tracking-wide border-b-2 cursor-pointer transition-all flex items-center gap-2 ${activeTab === 'bulk' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <Clipboard className="w-4 h-4" /> Bulk Import
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-[250px]">
              
              {/* Tab 1: Structured Questions List */}
              {activeTab === 'structured' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <ScrollArea className="h-[320px] pr-2">
                    <div className="space-y-3 pb-4">
                      {questionsList.length === 0 && (
                        <div className="text-center py-10 text-slate-400 italic text-sm">
                          No questions added yet. Use the input below to add questions.
                        </div>
                      )}
                      {questionsList.map((q, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 p-3 rounded-2xl animate-in slide-in-from-bottom-2 duration-150">
                          <span className="w-6 text-center text-xs font-bold text-slate-400">{idx + 1}</span>
                          <input 
                            value={q}
                            onChange={e => handleEditQuestionInline(idx, e.target.value)}
                            className="flex-1 bg-transparent border-transparent focus:border-indigo-400 focus:outline-none text-slate-700 font-medium text-sm"
                          />
                          <button
                            onClick={() => handleRemoveQuestion(idx)}
                            className="text-slate-300 hover:text-rose-500 transition-colors p-1.5 hover:bg-rose-50 rounded-full cursor-pointer"
                            title="Remove Question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Add Question input bar */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100 bg-white">
                    <Input 
                      placeholder="Type a question and press Enter..."
                      value={newQuestionInput}
                      onChange={e => setNewQuestionInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-400 h-11 rounded-xl"
                    />
                    <Button 
                      onClick={handleAddQuestion}
                      className="bg-slate-900 hover:bg-indigo-600 text-white rounded-xl h-11 px-4 cursor-pointer font-bold shrink-0"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab 2: Bulk import Textarea */}
              {activeTab === 'bulk' && (
                <div className="flex-1 flex flex-col">
                  <textarea 
                    className="w-full flex-1 border border-slate-200 rounded-2xl p-4 h-full focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none bg-slate-50/30 resize-none text-sm shadow-inner leading-relaxed" 
                    placeholder="Enter questions (one per line)...&#10;For example:&#10;Introduce yourself.&#10;Why do you want to work here?" 
                    value={bulkText}
                    onChange={e => handleBulkTextChange(e.target.value)}
                  />
                  <p className="text-xs text-slate-400 mt-2 font-medium">Tip: Type or paste one question per line. The Structured List will sync automatically.</p>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)} 
                className="rounded-2xl h-12 px-6 font-bold cursor-pointer"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveSet}
                className="bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl h-12 px-8 font-bold shadow-md cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Changes
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
