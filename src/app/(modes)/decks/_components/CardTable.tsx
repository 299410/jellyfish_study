"use client";

import { useState, useTransition, useEffect } from "react";
import { deleteCard } from "@/app/actions/flashcard";
import { Button } from "@/components/ui/button";
import CardEditorDialog from "./CardEditorDialog";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";

type Flashcard = {
  id: string;
  front: string;
  back: string;
  status: string;
  repetition: number;
  interval: number;
  nextReviewDate: Date;
};

export default function CardTable({ 
  deckId, 
  initialCards, 
  totalPages,
  currentPage,
  autoAddCard,
  initialSearch = "",
  initialStatus = "ALL",
  counts
}: { 
  deckId: string;
  initialCards: Flashcard[];
  totalPages: number;
  currentPage: number;
  autoAddCard?: boolean;
  initialSearch?: string;
  initialStatus?: string;
  counts: {
    all: number;
    new: number;
    learning: number;
    due: number;
  };
}) {
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const [hasAutoAdded, setHasAutoAdded] = useState(false);

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "NEW" | "LEARNING" | "DUE">(
    (initialStatus as "ALL" | "NEW" | "LEARNING" | "DUE") || "ALL"
  );

  // Sync state with URL parameter updates (e.g. forward/back browser navigation)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchQuery(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatusFilter((initialStatus as "ALL" | "NEW" | "LEARNING" | "DUE") || "ALL");
  }, [initialStatus]);

  // Debounced URL updates for search input
  useEffect(() => {
    if (searchQuery === initialSearch) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      // Reset to page 1 on new search
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, initialSearch, statusFilter, pathname, router]);

  const handleStatusFilterChange = (filter: "ALL" | "NEW" | "LEARNING" | "DUE") => {
    setStatusFilter(filter);
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (filter !== "ALL") params.set("status", filter);
    // Reset to page 1 on filter tab switch
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const getPageHref = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    params.set("page", String(pageNumber));
    return `${pathname}?${params.toString()}`;
  };

  const handleEdit = (card: Flashcard) => {
    setEditingCard(card);
    setIsEditorOpen(true);
  };

  const handleAddNew = () => {
    setEditingCard(null);
    setIsEditorOpen(true);
  };

  useEffect(() => {
    if (autoAddCard && !hasAutoAdded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleAddNew();
      setHasAutoAdded(true);
      
      // Clean up URL parameter using Next.js router to sync router state
      router.replace(pathname, { scroll: false });
    }
  }, [autoAddCard, hasAutoAdded, pathname, router]);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this card?")) {
      startTransition(async () => {
        await deleteCard(id);
      });
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Card List</h2>
        <Button 
          onClick={handleAddNew}
          className="rounded-full bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
        >
          + Add New Card
        </Button>
      </div>

      {/* Search and Filter Tabs */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 bg-slate-50/50 p-4 rounded-[1.5rem] border border-slate-100">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search vocabulary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-full border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 transition-all shadow-inner"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {(["ALL", "NEW", "LEARNING", "DUE"] as const).map((filter) => {
            const count = 
              filter === "ALL" ? counts.all :
              filter === "NEW" ? counts.new :
              filter === "LEARNING" ? counts.learning :
              counts.due;

            const isActive = statusFilter === filter;
            const activeClass = 
              filter === "NEW" ? "bg-cyan-500 text-white shadow-cyan-100/50" :
              filter === "LEARNING" ? "bg-rose-500 text-white shadow-rose-100/50" :
              filter === "DUE" ? "bg-emerald-500 text-white shadow-emerald-100/50" :
              "bg-slate-800 text-white shadow-slate-200/50";

            return (
              <button
                key={filter}
                onClick={() => handleStatusFilterChange(filter)}
                className={`px-4 py-2 rounded-full text-xs font-black tracking-wider uppercase transition-all duration-300 shadow-sm border cursor-pointer ${
                  isActive 
                    ? `${activeClass} border-transparent shadow-md scale-[1.02]` 
                    : "bg-white text-slate-500 border-slate-100 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                {filter} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="border border-slate-100/80 rounded-2xl overflow-hidden bg-white/60 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-widest text-xs font-black">
            <tr>
              <th className="px-6 py-4 border-b border-slate-100/80 w-1/3">Front</th>
              <th className="px-6 py-4 border-b border-slate-100/80 w-1/3">Back</th>
              <th className="px-6 py-4 border-b border-slate-100/80">Status</th>
              <th className="px-6 py-4 border-b border-slate-100/80 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialCards.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                  {searchQuery || statusFilter !== "ALL" 
                    ? "No cards match your search or filter criteria."
                    : "No cards found. Add a new card or import from CSV."}
                </td>
              </tr>
            ) : (
              initialCards.map(card => {
                let statusColor = "text-cyan-600 bg-cyan-50 border-cyan-100";
                let statusText = "New";
                
                const now = new Date();
                const isDue = new Date(card.nextReviewDate) <= now;

                if (card.status === "LEARNING" || card.status === "RELEARNING") {
                  statusColor = "text-rose-600 bg-rose-50 border-rose-100";
                  statusText = isDue ? "Learning - Due" : "Learning";
                } else if (card.status === "REVIEW") {
                  statusColor = isDue 
                    ? "text-emerald-600 bg-emerald-50 border-emerald-100" 
                    : "text-slate-600 bg-slate-50 border-slate-100";
                  statusText = isDue ? "Due" : "Review";
                }

                return (
                  <tr key={card.id} className="border-b border-slate-100/50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 align-top">
                      <div className="line-clamp-3 text-slate-700 font-medium" dangerouslySetInnerHTML={{ __html: card.front }} />
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="line-clamp-3 text-slate-600" dangerouslySetInnerHTML={{ __html: card.back }} />
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColor}`}>
                        {statusText}
                      </span>
                      <div className="text-xs text-slate-400 mt-2 font-medium">
                        Due: {new Date(card.nextReviewDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" className="font-bold text-slate-500 hover:text-slate-900" onClick={() => handleEdit(card)} disabled={isPending}>Edit</Button>
                      <Button variant="ghost" size="sm" className="font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleDelete(card.id)} disabled={isPending}>Delete</Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Link href={getPageHref(Math.max(1, currentPage - 1))}>
            <Button variant="outline" size="sm" disabled={currentPage === 1} className="rounded-full font-bold">Previous</Button>
          </Link>
          <span className="text-sm font-bold text-slate-500">Page {currentPage} of {totalPages}</span>
          <Link href={getPageHref(Math.min(totalPages, currentPage + 1))}>
            <Button variant="outline" size="sm" disabled={currentPage === totalPages} className="rounded-full font-bold">Next</Button>
          </Link>
        </div>
      )}

      <CardEditorDialog
        deckId={deckId}
        editingCard={editingCard}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
      />
    </div>
  );
}
