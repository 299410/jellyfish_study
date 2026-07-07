"use client";

import { useState, useEffect, useTransition } from "react";
import { updateDeck, createDeck } from "@/app/actions/deck";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Deck = {
  id: string;
  name: string;
  description: string | null;
  maxNewCardsPerDay?: number;
  maxReviewsPerDay?: number;
};

export default function DeckEditorDialog({ 
  deck, 
  userId,
  isOpen, 
  onClose 
}: { 
  deck?: Deck | null; 
  userId?: string;
  isOpen: boolean; 
  onClose: (newDeckId?: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxNew, setMaxNew] = useState(20);
  const [maxReviews, setMaxReviews] = useState(200);
  const [isPending, startTransition] = useTransition();

  // Sync state with open/close/deck changes
  useEffect(() => {
    if (isOpen) {
      setName(deck ? deck.name : "");
      setDescription(deck && deck.description ? deck.description : "");
      setMaxNew(deck && deck.maxNewCardsPerDay !== undefined ? deck.maxNewCardsPerDay : 20);
      setMaxReviews(deck && deck.maxReviewsPerDay !== undefined ? deck.maxReviewsPerDay : 200);
    }
  }, [deck, isOpen]);

  const handleSave = () => {
    if (!name.trim()) return;
    
    startTransition(async () => {
      if (deck) {
        await updateDeck(deck.id, name, description, maxNew, maxReviews);
        onClose();
      } else if (userId) {
        const newDeck = await createDeck(userId, name, description, maxNew, maxReviews);
        onClose(newDeck.id);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">
          {deck ? "Edit Deck" : "Create New Deck"}
        </h2>
        
        <div className="space-y-6 mb-8 text-left">
          <div>
            <Label className="font-bold text-slate-700 mb-2 block">Deck Name</Label>
            <Input 
              placeholder="e.g. Minna no Nihongo Lesson 1"
              value={name} 
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500 font-medium text-slate-700"
            />
          </div>
          
          <div>
            <Label className="font-bold text-slate-700 mb-2 block">Description</Label>
            <Input 
              placeholder="e.g. Vocabulary and grammar notes"
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500 font-medium text-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-bold text-slate-700 mb-2 block">New Cards / Day</Label>
              <Input 
                type="number"
                min={0}
                value={maxNew} 
                onChange={(e) => setMaxNew(Math.max(0, Number(e.target.value)))}
                disabled={isPending}
                className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500 font-medium text-slate-700"
              />
            </div>
            <div>
              <Label className="font-bold text-slate-700 mb-2 block">Reviews / Day</Label>
              <Input 
                type="number"
                min={0}
                value={maxReviews} 
                onChange={(e) => setMaxReviews(Math.max(0, Number(e.target.value)))}
                disabled={isPending}
                className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500 font-medium text-slate-700"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
          <Button 
            variant="outline" 
            onClick={() => onClose()} 
            disabled={isPending}
            className="rounded-full px-6 font-bold text-slate-500 hover:text-slate-700"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isPending || !name.trim()}
            className="rounded-full px-8 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold shadow-lg hover:shadow-xl transition-all"
          >
            {isPending ? "Saving..." : (deck ? "Save Changes" : "Create Deck")}
          </Button>
        </div>
      </div>
    </div>
  );
}
