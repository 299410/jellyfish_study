"use client";

import Image from "next/image";
import { useState } from "react";
import { createUser } from "@/app/actions/user";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userId: string) => void;
}

export default function OnboardingModal({ isOpen, onClose, onSuccess }: OnboardingModalProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const user = await createUser(name.trim());
      localStorage.setItem("userId", user.id);
      onSuccess(user.id);
    } catch (error) {
      console.error("Failed to create user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && name.trim()) {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm overflow-hidden p-4">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-gradient-to-br from-indigo-200/50 to-transparent rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-tl from-cyan-200/40 to-transparent rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative bg-white/70 backdrop-blur-3xl border border-slate-100/80 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(79,70,229,0.15)] p-8 md:p-12 max-w-md w-full mx-auto text-center">
        {/* Close button for optional cancel */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* Logo / Icon */}
        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center shrink-0">
          <div className="absolute inset-0 bg-cyan-400 blur-xl opacity-30 rounded-full animate-pulse" />
          <Image 
            src="/logo-clean-v2.png" 
            alt="JellyFish Logo" 
            width={72} 
            height={72} 
            className="relative z-10 drop-shadow-[0_4px_10px_rgba(34,211,238,0.4)]" 
          />
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">
          Welcome to JellyFish
        </h1>
        <p className="text-slate-500 font-medium mb-8 leading-relaxed text-sm md:text-base">
          Your personal language learning companion.<br />
          What should we call you?
        </p>

        <div className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            placeholder="Enter your name..."
            autoFocus
            className="w-full h-12 px-5 rounded-xl border border-slate-200 bg-white/80 text-base font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            className="w-full h-12 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isSubmitting ? "Setting up..." : "Start Learning 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}
