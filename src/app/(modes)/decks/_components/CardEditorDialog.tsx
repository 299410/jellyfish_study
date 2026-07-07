"use client";

import { useState, useEffect, useTransition } from "react";
import { createCard, updateCard } from "@/app/actions/flashcard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, HelpCircle, Languages, Sparkles } from "lucide-react";

type Flashcard = {
  id: string;
  front: string;
  back: string;
};

export default function CardEditorDialog({
  deckId,
  editingCard,
  isOpen,
  onClose
}: {
  deckId: string;
  editingCard?: Flashcard | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (editingCard) {
      setFront(editingCard.front);
      setBack(editingCard.back);
    } else {
      setFront("");
      setBack("");
    }
  }, [editingCard, isOpen]);

  const handleSave = () => {
    if (!front.trim() || !back.trim()) return;
    
    startTransition(async () => {
      if (editingCard) {
        await updateCard(editingCard.id, front, back);
      } else {
        await createCard(deckId, front, back);
      }
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ maxHeight: '80vh' }}
      >
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">
              {editingCard ? "Edit Flashcard" : "Add New Flashcard"}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
            disabled={isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Modal Body */}
        <div 
          className="p-6 overflow-y-auto flex-1 space-y-4"
          style={{ minHeight: 0 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Column: Front Card */}
            <div className="flex flex-col bg-slate-50/60 rounded-2xl p-4 border border-slate-100 hover:border-indigo-100 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <Label className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">
                  Front (Question / Target)
                </Label>
              </div>
              <textarea
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 min-h-[120px] md:min-h-[140px] resize-none shadow-inner transition-all duration-300"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                disabled={isPending}
                placeholder="e.g., How do you say 'Hello' in Japanese?"
              />
            </div>
            
            {/* Right Column: Back Card */}
            <div className="flex flex-col bg-slate-50/60 rounded-2xl p-4 border border-slate-100 hover:border-cyan-100 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
                  <Languages className="w-4 h-4" />
                </div>
                <Label className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">
                  Back (Answer / Translation)
                </Label>
              </div>
              <textarea
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 min-h-[120px] md:min-h-[140px] resize-none shadow-inner transition-all duration-300"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                disabled={isPending}
                placeholder="e.g., こんにちは (Konnichiwa)"
              />
            </div>
            
          </div>
          
          <p className="text-xs text-slate-400 font-semibold bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100/50 inline-block">
            💡 Supports basic HTML (e.g., <code className="text-indigo-600">&lt;br&gt;</code> for new line, <code className="text-indigo-600">&lt;b&gt;</code> for bold).
          </p>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isPending}
            className="rounded-full px-6 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100/80 transition-all duration-300"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isPending || !front.trim() || !back.trim()}
            className="rounded-full px-8 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPending ? "Saving..." : "Save Card"}
          </Button>
        </div>
      </div>
    </div>
  );
}
