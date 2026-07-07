import { getDeck } from "@/app/actions/deck";
import { getDeckStats, getDeckCards } from "@/app/actions/flashcard";
import { notFound } from "next/navigation";
import DeckOverview from "../_components/DeckOverview";
import CardTable from "../_components/CardTable";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function DeckBrowsePage(props: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ page?: string; addCard?: string }>
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const deck = await getDeck(params.id);
  if (!deck) notFound();

  const currentPage = Number(searchParams.page) || 1;
  const autoAddCard = searchParams.addCard === "true";

  // Fetch in parallel
  const [stats, { cards, totalPages }] = await Promise.all([
    getDeckStats(deck.id),
    getDeckCards(deck.id, currentPage, 100) // 100 cards per page
  ]);

  return (
    <div className="min-h-screen bg-[#FAFAFC] pt-12 pb-24 px-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-gradient-to-br from-indigo-200/40 to-transparent rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tl from-cyan-200/40 to-transparent rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="max-w-6xl mx-auto relative z-10 space-y-6">
        <Link 
          href="/decks"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors w-fit cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Decks
        </Link>
        
        <DeckOverview deck={deck} stats={stats} />
        <CardTable 
          deckId={deck.id} 
          initialCards={cards} 
          totalPages={totalPages} 
          currentPage={currentPage}
          autoAddCard={autoAddCard}
        />
      </div>
    </div>
  );
}
