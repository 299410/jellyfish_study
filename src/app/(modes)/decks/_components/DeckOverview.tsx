"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteDeck } from "@/app/actions/deck";
import { useState, useTransition } from "react";
import DeckEditorDialog from "./DeckEditorDialog";

type DeckStats = {
  newStudiedToday: number;
  maxNewCardsPerDay: number;
  remainingNew: number;
  learningCount: number;
  reviewsStudiedToday: number;
  maxReviewsPerDay: number;
  remainingReviews: number;
  totalCards: number;
};

type Deck = {
  id: string;
  name: string;
  description: string | null;
  maxNewCardsPerDay?: number;
  maxReviewsPerDay?: number;
};

export default function DeckOverview({ deck, stats }: { deck: Deck, stats: DeckStats }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleDelete = () => {
    if (confirm(`Are you sure you want to permanently delete the deck "${deck.name}" and all its cards?`)) {
      startTransition(async () => {
        await deleteDeck(deck.id);
        router.push("/decks");
      });
    }
  };

  return (
    <div className="relative overflow-hidden bg-white/60 backdrop-blur-3xl border border-slate-100/80 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-8 py-12 flex flex-col items-center">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-full -z-10 pointer-events-none"></div>

      <h1 className="text-4xl font-black mb-4 text-center px-4 text-slate-900 tracking-tight">{deck.name}</h1>
      
      {deck.description && (
        <p className="text-slate-500 font-medium mb-12 max-w-lg text-center">{deck.description}</p>
      )}

      <div className="grid grid-cols-3 gap-8 md:gap-16 text-lg font-medium mb-12 w-full max-w-xl">
        <div className="flex flex-col items-center">
          <span className="text-slate-500 font-bold text-sm tracking-widest uppercase mb-3">New</span>
          <span className="text-cyan-500 font-black text-4xl drop-shadow-sm">{stats.remainingNew}</span>
          <span className="text-xs text-slate-400 font-semibold mt-1.5">Studied: {stats.newStudiedToday}/{stats.maxNewCardsPerDay}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-slate-500 font-bold text-sm tracking-widest uppercase mb-3">Learning</span>
          <span className="text-rose-500 font-black text-4xl drop-shadow-sm">{stats.learningCount}</span>
          <span className="text-xs text-slate-400 font-semibold mt-1.5">Active steps</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-slate-500 font-bold text-sm tracking-widest uppercase mb-3">Due</span>
          <span className="text-emerald-500 font-black text-4xl drop-shadow-sm">{stats.remainingReviews}</span>
          <span className="text-xs text-slate-400 font-semibold mt-1.5">Reviewed: {stats.reviewsStudiedToday}/{stats.maxReviewsPerDay}</span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <Button 
          variant="outline" 
          className="rounded-full px-6 h-12 text-slate-600 border-slate-200 hover:bg-slate-50 font-bold"
          onClick={() => setIsEditOpen(true)}
          disabled={isPending}
        >
          Edit Deck
        </Button>
        <Button 
          className="rounded-full px-10 h-12 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold text-base hover:shadow-[0_10px_30px_rgba(99,102,241,0.4)] hover:-translate-y-1 transition-all duration-300"
          onClick={() => router.push(`/decks/${deck.id}/study`)}
        >
          Study Now
        </Button>
        <Button 
          variant="outline" 
          className="rounded-full px-6 h-12 text-rose-500 border-rose-200 hover:bg-rose-50 font-bold"
          onClick={handleDelete}
          disabled={isPending}
        >
          Delete
        </Button>
      </div>

      <DeckEditorDialog 
        deck={deck} 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
      />
    </div>
  );
}
