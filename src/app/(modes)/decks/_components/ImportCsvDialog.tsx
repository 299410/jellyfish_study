"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { bulkAddCards, createDeck } from "@/app/actions/deck";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Deck = {
  id: string;
  name: string;
};

export default function ImportCsvDialog({ decks, userId, onImported }: { decks: Deck[], userId: string, onImported?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState(decks[0]?.id || "new");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();

  const handleImport = async () => {
    if (!file) return alert("Please select a CSV file.");
    
    setIsSubmitting(true);
    
    Papa.parse(file, {
      header: false, // Tắt header để đọc file txt của Anki (không có header)
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Anki export ra dạng TSV hoặc CSV không header.
          // Cột 0 thường là Front, Cột 1 là Back.
          // Nếu file có header thực sự (front, back ở dòng 1), ta sẽ bỏ qua dòng 1.
          
          let dataToProcess = results.data as any[][];
          
          // Kiểm tra xem dòng đầu tiên có phải là header không (chứa chữ front/back)
          const firstRow = dataToProcess[0];
          if (
            firstRow && 
            typeof firstRow[0] === "string" && 
            (firstRow[0].toLowerCase() === "front" || firstRow[1]?.toLowerCase() === "back")
          ) {
            dataToProcess.shift(); // Bỏ dòng header
          }

          const cards = dataToProcess.map((row) => ({
            front: row[0],
            back: row[1],
          })).filter(c => c.front && c.back);

          let targetDeckId = selectedDeckId;
          
          if (selectedDeckId === "new") {
            if (!newDeckName) throw new Error("Please enter a new deck name.");
            const newDeck = await createDeck(userId, newDeckName, "Imported from CSV");
            targetDeckId = newDeck.id;
          }

          if (!targetDeckId) throw new Error("Please select or create a deck.");
          
          await bulkAddCards(targetDeckId, cards);
          
          setIsOpen(false);
          onImported?.();
          router.refresh();
        } catch (error: any) {
          alert("Import failed: " + error.message);
        } finally {
          setIsSubmitting(false);
        }
      },
      error: (error) => {
        alert("File read error: " + error.message);
        setIsSubmitting(false);
      }
    });
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="rounded-full px-6 h-12 bg-slate-900 hover:bg-indigo-600 text-white font-bold shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
      >
        Import CSV / TXT
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-xl w-full border border-slate-100">
            <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Import Flashcards</h2>
            
            <div className="space-y-6 mb-8 text-left">
              <div>
                <Label className="font-bold text-slate-700 mb-2 block">1. Select Destination Deck</Label>
                <div className="flex items-center gap-3">
                  <select 
                    className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium text-slate-700"
                    value={selectedDeckId}
                    onChange={(e) => setSelectedDeckId(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="new">+ Create New Deck</option>
                    {decks.map(deck => (
                      <option key={deck.id} value={deck.id}>{deck.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedDeckId === "new" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="font-bold text-slate-700 mb-2 block">New Deck Name</Label>
                  <Input 
                    placeholder="e.g., Language Vocabulary"
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    disabled={isSubmitting}
                    className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500 font-medium"
                  />
                </div>
              )}

              <div>
                <Label className="font-bold text-slate-700 mb-2 block">2. Select CSV/TXT File</Label>
                <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors">
                  <Input 
                    type="file" 
                    accept=".csv,.txt"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    disabled={isSubmitting}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2 pointer-events-none">
                    <div className="mx-auto w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15l3-3 3 3"/></svg>
                    </div>
                    {file ? (
                      <p className="font-bold text-indigo-600">{file.name}</p>
                    ) : (
                      <p className="font-medium text-slate-500">Click or drag file here to upload</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2 font-medium">Format: 2 columns (Front, Back) separated by comma.</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)} 
                disabled={isSubmitting}
                className="rounded-full px-6 font-bold text-slate-500 hover:text-slate-700"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={isSubmitting || !file}
                className="rounded-full px-8 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold shadow-lg hover:shadow-xl transition-all"
              >
                {isSubmitting ? "Importing..." : "Start Import"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
