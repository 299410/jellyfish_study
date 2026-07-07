"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { createPortal } from "react-dom";
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
  const [successMessage, setSuccessMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const frontRef = useRef<HTMLTextAreaElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (editingCard) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFront(editingCard.front);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBack(editingCard.back);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFront("");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBack("");
    }
    setSuccessMessage("");
  }, [editingCard, isOpen]);

  const handleSave = (keepOpen: boolean = false) => {
    if (!front.trim() || !back.trim()) return;
    
    startTransition(async () => {
      if (editingCard) {
        await updateCard(editingCard.id, front, back);
      } else {
        await createCard(deckId, front, back);
      }
      
      if (keepOpen) {
        setFront("");
        setBack("");
        setSuccessMessage("Card added!");
        setTimeout(() => setSuccessMessage(""), 2000);
        frontRef.current?.focus();
      } else {
        onClose();
      }
    });
  };

  if (!isOpen) return null;
  if (!mounted) return null;

  return createPortal(
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
                ref={frontRef}
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

          {/* Live Preview Section */}
          <div className="border-t border-slate-100 pt-6 mt-4">
            <span className="font-extrabold text-xs text-slate-500 uppercase tracking-wider block mb-3">
              ✨ Live Card Preview
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Front Preview */}
              <div className="flex flex-col items-center justify-center min-h-[140px] p-6 bg-white border border-slate-100 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="absolute top-3 left-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest">Front Preview</div>
                <div 
                  className="text-xl font-black text-center text-slate-900 leading-normal w-full overflow-y-auto break-words max-h-[120px]"
                  dangerouslySetInnerHTML={{ __html: front || '<span class="text-slate-300 italic font-normal">Empty front side</span>' }}
                />
              </div>

              {/* Back Preview */}
              <div className="flex flex-col items-center justify-center min-h-[140px] p-6 bg-gradient-to-br from-indigo-50/80 to-cyan-50/80 border border-indigo-100/50 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="absolute top-3 left-3 text-[10px] font-black text-cyan-500 uppercase tracking-widest">Back Preview</div>
                <div 
                  className="text-lg font-bold text-center text-slate-800 leading-normal w-full overflow-y-auto break-words max-h-[120px]"
                  dangerouslySetInnerHTML={{ __html: back || '<span class="text-slate-400/60 italic font-normal">Empty back side</span>' }}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
            <p className="text-xs text-slate-400 font-semibold bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100/50 inline-block">
              💡 Supports basic HTML (e.g., <code className="text-indigo-600">&lt;br&gt;</code> for new line, <code className="text-indigo-600">&lt;b&gt;</code> for bold).
            </p>
            {successMessage && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                ✨ {successMessage}
              </span>
            )}
          </div>
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

          {!editingCard && (
            <Button 
              variant="secondary"
              onClick={() => handleSave(true)} 
              disabled={isPending || !front.trim() || !back.trim()}
              className="rounded-full px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isPending ? "Saving..." : "Save & Add Another"}
            </Button>
          )}

          <Button 
            onClick={() => handleSave(false)} 
            disabled={isPending || !front.trim() || !back.trim()}
            className="rounded-full px-8 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPending ? "Saving..." : editingCard ? "Save Card" : "Save & Close"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
