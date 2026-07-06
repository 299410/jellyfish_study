"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import OnboardingModal from "@/components/OnboardingModal";

interface LandingCTAProps {
  variant: "header" | "hero";
}

export default function LandingCTA({ variant }: LandingCTAProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Read userId on component mount
    setUserId(localStorage.getItem("userId"));
  }, []);

  const handleClick = () => {
    if (userId) {
      router.push("/dashboard");
    } else {
      setIsOpen(true);
    }
  };

  const handleSuccess = (newUserId: string) => {
    setUserId(newUserId);
    setIsOpen(false);
    router.push("/dashboard");
  };

  if (variant === "header") {
    return (
      <>
        <button
          onClick={handleClick}
          className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 duration-300 cursor-pointer"
        >
          Get Started
        </button>
        <OnboardingModal isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={handleSuccess} />
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full sm:w-auto h-14 px-8 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold text-lg hover:shadow-[0_10px_30px_rgba(99,102,241,0.4)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
      >
        Get Started <ArrowRight className="w-5 h-5" />
      </button>
      <OnboardingModal isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={handleSuccess} />
    </>
  );
}
