"use client";

import { useState, useEffect } from "react";
import { getUser } from "@/app/actions/user";
import OnboardingModal from "./OnboardingModal";

export default function UserOnboarding({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const userId = localStorage.getItem("userId");
      if (userId) {
        const user = await getUser(userId);
        if (user) {
          setUserName(user.name);
          setIsReady(true);
          return;
        }
        // userId in localStorage but user not in DB — clear and show dialog
        localStorage.removeItem("userId");
      }
      setShowDialog(true);
    };
    checkUser();
  }, []);

  const handleSuccess = (userId: string) => {
    getUser(userId).then(user => {
      if (user) {
        setUserName(user.name);
        setShowDialog(false);
        setIsReady(true);
      }
    });
  };

  // Show onboarding dialog
  if (showDialog) {
    return (
      <OnboardingModal 
        isOpen={showDialog} 
        onClose={() => {}} // Can't close when gating access to internal pages
        onSuccess={handleSuccess} 
      />
    );
  }

  // Not ready yet (checking user)
  if (!isReady) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#FAFAFC]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // User is ready — render the app
  return <>{children}</>;
}

// Hook to get userId from localStorage
export function useUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
  }, []);
  return userId;
}

// Hook to get userName from localStorage cache
export function useUserName(): string {
  const [name, setName] = useState("");
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      getUser(userId).then(user => {
        if (user) setName(user.name);
      });
    }
  }, []);
  return name;
}
