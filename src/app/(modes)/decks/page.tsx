"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDecks } from "@/app/actions/deck";
import ImportCsvDialog from "./_components/ImportCsvDialog";
import { useUserId } from "@/components/UserOnboarding";

type DeckWithCount = {
  id: string;
  name: string;
  description: string | null;
  dueCount: number;
  _count: { cards: number };
};

export default function DecksPage() {
  const userId = useUserId();
  const [decks, setDecks] = useState<DeckWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchDecks = async () => {
      setIsLoading(true);
      const data = await getDecks(userId);
      setDecks(data);
      setIsLoading(false);
    };
    fetchDecks();
  }, [userId]);

  const refreshDecks = async () => {
    if (!userId) return;
    const data = await getDecks(userId);
    setDecks(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC] pt-12 pb-24 px-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-gradient-to-br from-indigo-200/40 to-transparent rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tl from-cyan-200/40 to-transparent rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Flashcard Decks</h1>
            <p className="text-slate-500 font-medium mt-2">Manage and study your vocabulary collections</p>
          </div>
          <div className="flex gap-4">
            <ImportCsvDialog decks={decks} userId={userId!} onImported={refreshDecks} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <div key={deck.id} className="relative group border border-slate-100/80 bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col cursor-pointer">
              {/* Card Link Overlay */}
              <Link href={`/decks/${deck.id}`} className="absolute inset-0 z-10" />
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50/50 to-transparent rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-700"></div>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight relative z-20">{deck.name}</h2>
              <p className="text-slate-500 font-medium h-12 overflow-hidden text-sm mb-6 relative z-20">
                {deck.description || "No description provided."}
              </p>
              
              <div className="flex justify-between items-center mt-auto pt-6 border-t border-slate-100/80 relative z-20">
                <div className="text-sm">
                  <span className="font-bold text-slate-700">{deck._count.cards}</span> <span className="text-slate-500">cards</span>
                  {deck.dueCount > 0 && (
                    <span className="ml-3 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold ring-1 ring-emerald-100">
                      {deck.dueCount} Due
                    </span>
                  )}
                </div>
                <div className="flex gap-3 relative z-30">
                  <Link 
                    href={`/decks/${deck.id}/study`}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-full hover:shadow-[0_10px_20px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 text-sm font-bold transition-all duration-300"
                  >
                    Study
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {decks.length === 0 && (
            <div className="col-span-full text-center py-20 text-slate-500 bg-white/40 rounded-[2rem] border border-dashed border-slate-300">
              No decks available. Create one or import a CSV to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
