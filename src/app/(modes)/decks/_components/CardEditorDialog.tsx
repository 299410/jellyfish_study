"use client";

import { useState, useEffect, useTransition } from "react";
import { createCard, updateCard } from "@/app/actions/flashcard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 max-h-[90vh] flex flex-col">
        <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight flex-shrink-0">
          {editingCard ? "Edit Flashcard" : "Add New Flashcard"}
        </h2>
        
        <div className="space-y-6 mb-6 overflow-y-auto flex-1 pr-2 scrollbar-thin">
          <div>
            <Label className="font-bold text-slate-700 mb-2 block">Front (Question / Target)</Label>
            <textarea
              className="flex w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 min-h-[120px] resize-y"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              disabled={isPending}
              placeholder="e.g., How do you say 'Hello' in Japanese?"
            />
          </div>
          <div>
            <Label className="font-bold text-slate-700 mb-2 block">Back (Answer / Translation)</Label>
            <textarea
              className="flex w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 min-h-[120px] resize-y"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              disabled={isPending}
              placeholder="e.g., こんにちは (Konnichiwa)"
            />
          </div>
          <p className="text-xs text-slate-400 font-medium">Supports basic HTML (e.g., &lt;br&gt; for new line, &lt;b&gt; for bold).</p>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isPending}
            className="rounded-full px-6 font-bold text-slate-500 hover:text-slate-700"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isPending || !front.trim() || !back.trim()}
            className="rounded-full px-8 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold shadow-lg hover:shadow-xl transition-all"
          >
            {isPending ? "Saving..." : "Save Card"}
          </Button>
        </div>
      </div>
    </div>
  );
}
