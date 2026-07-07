"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { reviewCard, getCardButtonHints } from "@/app/actions/flashcard";
import { logActivity } from "@/app/actions/activity";
import type { ReviewAction, ButtonHints } from "@/lib/srs";
import { Button } from "@/components/ui/button";
import { useUserId } from "@/components/UserOnboarding";

type Flashcard = {
  id: string;
  front: string;
  back: string;
  status: string;
  stepIndex: number;
  interval: number;
  repetition: number;
  easinessFactor: number;
  nextReviewDate: Date;
};

type WaitingCard = {
  card: Flashcard;
  dueAt: number; // timestamp
};

export default function FlashcardStudy({ 
  initialQueue, 
  initialWaitingPool, 
  deckId 
}: { 
  initialQueue: Flashcard[], 
  initialWaitingPool: WaitingCard[], 
  deckId: string 
}) {
  const userId = useUserId();
  const [queue, setQueue] = useState<Flashcard[]>(initialQueue);
  const [waitingPool, setWaitingPool] = useState<WaitingCard[]>(initialWaitingPool);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [hints, setHints] = useState<ButtonHints | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Session time-tracking
  // eslint-disable-next-line react-hooks/purity
  const sessionStartTime = useRef(Date.now());
  const hasLoggedOnComplete = useRef(false);

  // Session counters
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, remaining: initialQueue.length });

  const currentCard = queue[currentIndex];

  // Fetch button hints when card changes
  useEffect(() => {
    if (!currentCard) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHints(null);
    getCardButtonHints(currentCard.id).then(setHints);
  }, [currentCard?.id]);

  const checkWaitingPoolRef = useRef<() => void>(() => {});

  // Timer: check waiting pool for due cards
  const checkWaitingPool = useCallback(() => {
    const now = Date.now();
    const dueCards: Flashcard[] = [];
    const stillWaiting: WaitingCard[] = [];

    waitingPool.forEach(wc => {
      if (wc.dueAt <= now) {
        dueCards.push(wc.card);
      } else {
        stillWaiting.push(wc);
      }
    });

    if (dueCards.length > 0) {
      setWaitingPool(stillWaiting);
      setQueue(prev => [...prev, ...dueCards]);
    }

    // Schedule next check
    if (stillWaiting.length > 0) {
      const nextDue = Math.min(...stillWaiting.map(wc => wc.dueAt));
      const delay = Math.max(1000, nextDue - now);
      
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => checkWaitingPoolRef.current(), delay);
    }
  }, [waitingPool]);

  useEffect(() => {
    checkWaitingPoolRef.current = checkWaitingPool;
  }, [checkWaitingPool]);

  useEffect(() => {
    if (waitingPool.length > 0) {
      const now = Date.now();
      const nextDue = Math.min(...waitingPool.map(wc => wc.dueAt));
      const delay = Math.max(1000, nextDue - now);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(checkWaitingPool, delay);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [waitingPool, checkWaitingPool]);

  // Check if session is complete
  const isComplete = currentIndex >= queue.length && waitingPool.length === 0;
  const isWaitingForCards = currentIndex >= queue.length && waitingPool.length > 0;

  // Handle manual exit & log duration
  const handleExitStudy = useCallback(async () => {
    if (userId) {
      const durationSeconds = Math.round((Date.now() - sessionStartTime.current) / 1000);
      await logActivity(userId, "FLASHCARD", durationSeconds);
    }
    router.push("/decks");
  }, [userId, router]);

  // Auto-log when study session completes
  useEffect(() => {
    if (isComplete && !hasLoggedOnComplete.current && userId) {
      hasLoggedOnComplete.current = true;
      const durationSeconds = Math.round((Date.now() - sessionStartTime.current) / 1000);
      logActivity(userId, "FLASHCARD", durationSeconds);
    }
  }, [isComplete, userId]);

  const handleReview = useCallback(async (action: ReviewAction) => {
    if (!currentCard || isPending) return;
    setIsPending(true);

    try {
      const result = await reviewCard(currentCard.id, action);
      
      setSessionStats(prev => ({ ...prev, reviewed: prev.reviewed + 1 }));

      // If card comes back in minutes (LEARNING/RELEARNING), add to waiting pool
      if (result.isIntraDay && result.dueInMs > 0) {
        setWaitingPool(prev => [...prev, {
          card: { ...currentCard, ...result },
          dueAt: Date.now() + result.dueInMs,
        }]);
      }

      // Move to next card
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 150);
    } catch (error) {
      console.error("Error reviewing card:", error);
    } finally {
      setIsPending(false);
    }
  }, [currentCard, isPending]);

  // Keyboard Shortcuts (Space to flip / Good, 1-4 for answers)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when user is typing in inputs or textareas
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (isComplete || isWaitingForCards || isPending) return;

      if (e.code === "Space") {
        e.preventDefault();
        if (!isFlipped) {
          setIsFlipped(true);
        } else {
          handleReview("good");
        }
      } else if (isFlipped) {
        if (e.key === "1") {
          handleReview("again");
        } else if (e.key === "2") {
          handleReview("hard");
        } else if (e.key === "3") {
          handleReview("good");
        } else if (e.key === "4") {
          handleReview("easy");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFlipped, isComplete, isWaitingForCards, isPending, handleReview]);

  // ── Completed Screen ──
  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center mb-8 shadow-lg">
          <span className="text-5xl">🎉</span>
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Session Complete!</h2>
        <p className="text-slate-500 font-medium mb-2">You reviewed <span className="font-bold text-indigo-600">{sessionStats.reviewed}</span> cards.</p>
        <p className="text-slate-400 text-sm mb-10">Come back later to review cards that are due.</p>
        <Button 
          onClick={handleExitStudy}
          className="rounded-full px-10 h-12 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          Back to Decks
        </Button>
      </div>
    );
  }

  // ── Waiting Screen ──
  if (isWaitingForCards) {
    const nearestDue = Math.min(...waitingPool.map(wc => wc.dueAt));
    // eslint-disable-next-line react-hooks/purity
    const secondsLeft = Math.max(0, Math.ceil((nearestDue - Date.now()) / 1000));

    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center mb-8 shadow-lg animate-pulse">
          <span className="text-5xl">⏳</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Cards Coming Back Soon</h2>
        <p className="text-slate-500 font-medium mb-2">
          <span className="font-bold text-orange-600">{waitingPool.length}</span> card{waitingPool.length > 1 ? "s" : ""} returning in ~<CountdownTimer targetTime={nearestDue} onComplete={checkWaitingPool} />
        </p>
        <p className="text-slate-400 text-sm mb-10">You reviewed {sessionStats.reviewed} cards so far. Hang tight!</p>
        <Button 
          variant="outline"
          onClick={handleExitStudy}
          className="rounded-full px-8 font-bold text-slate-500 hover:text-slate-900 border-slate-200"
        >
          Exit Session
        </Button>
      </div>
    );
  }

  // ── Study Card ──
  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6 px-4">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-500 bg-white/60 px-4 py-2 rounded-full border border-slate-100 shadow-sm text-sm">
            Card {currentIndex + 1} of {queue.length}
            {waitingPool.length > 0 && (
              <span className="ml-2 text-amber-500">+{waitingPool.length} waiting</span>
            )}
          </span>
        </div>
        <Button 
          variant="outline" 
          onClick={handleExitStudy}
          className="rounded-full font-bold text-slate-500 hover:text-slate-900 border-slate-200"
        >
          Exit Session
        </Button>
      </div>
      
      {/* Status badge */}
      <div className="mb-4">
        <StatusBadge status={currentCard?.status || "NEW"} />
      </div>

      {/* Flashcard Area */}
      <div 
        className="w-full h-[460px] relative perspective-1000 cursor-pointer group mb-10"
        onClick={() => setIsFlipped(prev => !prev)}
      >
        <motion.div
          className="w-full h-full relative preserve-3d"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
        >
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden flex flex-col pt-12 pb-8 px-8 bg-white/80 backdrop-blur-3xl border border-slate-100 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.15)] rounded-[2.5rem] overflow-y-auto">
            <div className="flex-grow flex flex-col justify-center items-center">
              <h2 
                className="text-4xl md:text-5xl font-black text-center text-slate-900 tracking-tight leading-tight"
                dangerouslySetInnerHTML={{ __html: currentCard.front }}
              />
            </div>
            {!isFlipped && (
              <p className="text-center text-sm font-bold text-indigo-400 opacity-60 group-hover:opacity-100 transition-opacity tracking-widest uppercase mt-4">
                Tap to flip
              </p>
            )}
          </div>
          
          {/* Back */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col pt-12 pb-8 px-8 bg-gradient-to-br from-indigo-50/90 to-cyan-50/90 backdrop-blur-3xl border border-indigo-100 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.15)] rounded-[2.5rem] overflow-y-auto">
            <div className="flex-grow flex flex-col justify-center items-center">
              <h2 
                className="text-3xl md:text-4xl font-bold text-center text-slate-800 whitespace-pre-wrap leading-relaxed"
                dangerouslySetInnerHTML={{ __html: currentCard.back }}
              />
            </div>
            {isFlipped && (
              <p className="text-center text-sm font-bold text-indigo-400 opacity-60 group-hover:opacity-100 transition-opacity tracking-widest uppercase mt-4">
                Tap to flip back
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="w-full px-4">
        {isFlipped ? (
          <div className="grid grid-cols-4 gap-2 md:gap-3 w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button 
              className="h-16 rounded-2xl bg-rose-500 text-white font-bold shadow-lg hover:bg-rose-600 hover:scale-[1.02] transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-0.5"
              disabled={isPending}
              onClick={(e) => { e.stopPropagation(); handleReview("again"); }}
            >
              <span className="text-sm font-black">Again</span>
              <span className="text-xs font-medium opacity-80">{hints?.again || "..."}</span>
            </button>
            <button 
              className="h-16 rounded-2xl bg-orange-400 text-white font-bold shadow-lg hover:bg-orange-500 hover:scale-[1.02] transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-0.5"
              disabled={isPending}
              onClick={(e) => { e.stopPropagation(); handleReview("hard"); }}
            >
              <span className="text-sm font-black">Hard</span>
              <span className="text-xs font-medium opacity-80">{hints?.hard || "..."}</span>
            </button>
            <button 
              className="h-16 rounded-2xl bg-emerald-500 text-white font-bold shadow-lg hover:bg-emerald-600 hover:scale-[1.02] transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-0.5"
              disabled={isPending}
              onClick={(e) => { e.stopPropagation(); handleReview("good"); }}
            >
              <span className="text-sm font-black">Good</span>
              <span className="text-xs font-medium opacity-80">{hints?.good || "..."}</span>
            </button>
            <button 
              className="h-16 rounded-2xl bg-cyan-500 text-white font-bold shadow-lg hover:bg-cyan-600 hover:scale-[1.02] transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-0.5"
              disabled={isPending}
              onClick={(e) => { e.stopPropagation(); handleReview("easy"); }}
            >
              <span className="text-sm font-black">Easy</span>
              <span className="text-xs font-medium opacity-80">{hints?.easy || "..."}</span>
            </button>
          </div>
        ) : (
          <Button 
            className="w-full max-w-sm mx-auto h-14 text-lg font-bold rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-xl hover:-translate-y-1 transition-all duration-300 block" 
            onClick={() => setIsFlipped(true)}
          >
            Show Answer
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    NEW: { label: "New", color: "bg-cyan-100 text-cyan-700 ring-cyan-200" },
    LEARNING: { label: "Learning", color: "bg-amber-100 text-amber-700 ring-amber-200" },
    REVIEW: { label: "Review", color: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
    RELEARNING: { label: "Relearning", color: "bg-rose-100 text-rose-700 ring-rose-200" },
  };
  const c = config[status] || config.NEW;
  return (
    <span className={`px-4 py-1.5 rounded-full text-xs font-bold ring-1 ${c.color}`}>
      {c.label}
    </span>
  );
}

function CountdownTimer({ targetTime, onComplete }: { targetTime: number; onComplete: () => void }) {
  // eslint-disable-next-line react-hooks/purity
  const [secondsLeft, setSecondsLeft] = useState(Math.max(0, Math.ceil((targetTime - Date.now()) / 1000)));

  useEffect(() => {
    const interval = setInterval(() => {
      // eslint-disable-next-line react-hooks/purity
      const remaining = Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onComplete();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTime, onComplete]);

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <span className="font-black text-orange-600 tabular-nums">
      {minutes > 0 ? `${minutes}m ${secs.toString().padStart(2, "0")}s` : `${secs}s`}
    </span>
  );
}
