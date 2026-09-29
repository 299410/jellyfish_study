"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Cat } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginModal() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-md p-4"
      >
        <Card className="w-full p-8 bg-white/10 backdrop-blur-2xl border-white/20 text-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] rounded-3xl">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-5 shadow-inner border border-white/10 backdrop-blur-md transition-transform hover:scale-110 hover:rotate-12 cursor-pointer">
              <Cat className="w-8 h-8 text-white drop-shadow-md" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">Focus Station</h1>
            <p className="text-white/70 text-sm mt-2 text-center font-medium">
              Enter your nickname and PIN to continue.
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase tracking-widest mb-2 drop-shadow-sm">Nickname</label>
              <Input 
                name="name" 
                placeholder="e.g., coder" 
                required 
                maxLength={20}
                className="bg-black/20 border-white/10 text-white placeholder:text-white/40 h-12 rounded-xl focus-visible:ring-white/50 backdrop-blur-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase tracking-widest mb-2 drop-shadow-sm">PIN Code</label>
              <Input 
                name="pin" 
                type="password" 
                placeholder="••••" 
                required 
                pattern="\d{4}"
                maxLength={4}
                title="PIN must be exactly 4 digits"
                className="bg-black/20 border-white/10 text-white placeholder:text-white/40 h-12 rounded-xl focus-visible:ring-white/50 text-center tracking-[0.5em] text-lg font-bold backdrop-blur-sm"
              />
              <p className="text-xs text-white/50 mt-3 text-center leading-relaxed font-medium">
                *First time? We'll create a new account automatically.
              </p>
            </div>

            {state?.error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm font-medium text-center backdrop-blur-md">
                {state.error}
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isPending}
              className="w-full h-12 mt-2 bg-white/20 hover:bg-white/30 border border-white/20 text-white font-bold rounded-xl shadow-lg backdrop-blur-md transition-all active:scale-95"
            >
              {isPending ? "Entering..." : "Start Focusing"}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
