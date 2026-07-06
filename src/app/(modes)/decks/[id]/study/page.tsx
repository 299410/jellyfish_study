import { getDueCards } from "@/app/actions/flashcard";
import { getDeck } from "@/app/actions/deck";
import FlashcardStudy from "../../_components/FlashcardStudy";
import { notFound } from "next/navigation";

export default async function StudyPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const deck = await getDeck(params.id);
  
  if (!deck) {
    notFound();
  }

  const dueCards = await getDueCards(params.id);

  return (
    <div className="min-h-screen bg-[#FAFAFC] pt-12 pb-24 px-6 relative">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-bl from-cyan-200/40 to-transparent rounded-full blur-[120px] pointer-events-none z-0"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{deck.name}</h1>
          <p className="text-slate-500 font-medium mt-2">Study Session • {dueCards.length} cards due</p>
        </div>
        
        <FlashcardStudy cards={dueCards} deckId={deck.id} />
      </div>
    </div>
  );
}
