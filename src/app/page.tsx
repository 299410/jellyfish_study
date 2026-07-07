import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, Mic, ArrowRight, Sparkles, BookOpen, LineChart, BrainCircuit, Waves } from 'lucide-react';
import { Card } from '@/components/ui/card';
import LandingCTA from '@/app/_components/LandingCTA';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#FAFAFC] overflow-hidden font-sans selection:bg-cyan-200 relative pb-20">
      
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-gradient-to-br from-indigo-200/40 to-transparent rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tl from-cyan-200/40 to-transparent rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-12 md:pt-20 relative z-10">
        
        {/* Header / Brand */}
        <header className="flex justify-between items-center mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex items-center gap-3">
            <Image src="/logo-clean-v2.png" alt="JellyFish Logo" width={40} height={40} className="drop-shadow-md" priority />
            <span className="font-black text-2xl tracking-tight text-slate-800">JellyFish</span>
          </div>
          <LandingCTA variant="header" />
        </header>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
          <div className="space-y-8 animate-in slide-in-from-left-8 fade-in duration-1000 delay-150">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-700 font-semibold text-sm mb-8 shadow-sm">
              <Sparkles className="w-4 h-4" /> Global AI Language Learning V.1
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Master Any<br />
              <span className="bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">Language</span><br />
              Happily &<br />
              Naturally
            </h1>
            
            <p className="text-lg md:text-xl text-slate-500 font-medium max-w-lg leading-relaxed">
              Achieve native-like fluency with your personalized AI tutor. Get instant feedback, practice without fear, and learn anywhere, anytime.
            </p>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <LandingCTA variant="hero" />
              <Link href="#features">
                <button className="w-full sm:w-auto h-14 px-8 rounded-full bg-white text-slate-700 font-bold text-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300">
                  Explore Curriculum
                </button>
              </Link>
            </div>
          </div>
          
          {/* Right Side: Dynamic App Mockup */}
          <div className="relative w-full max-w-xl xl:max-w-2xl mx-auto lg:mx-0 animate-in slide-in-from-right-8 fade-in duration-1000 delay-300 mt-10 lg:mt-0 xl:translate-x-8">
            
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/30 to-indigo-500/30 blur-[80px] rounded-full animate-pulse"></div>
            
            {/* Main App Mockup Card */}
            <div className="relative w-full rounded-[2rem] border border-white/60 bg-white/40 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(79,70,229,0.3)] overflow-hidden">
              {/* Card Header (Mac style) */}
              <div className="h-14 border-b border-white/40 bg-white/40 flex items-center px-6 gap-2">
                <div className="flex gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-rose-400 border border-rose-500/20"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-500/20"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 border border-emerald-500/20"></div>
                </div>
                <div className="mx-auto bg-white/60 px-5 py-1.5 rounded-full text-xs font-bold text-slate-600 tracking-wide shadow-sm">Live Practice Session</div>
              </div>

              {/* Chat Content */}
              <div className="p-6 md:p-8 space-y-6">
                {/* User Message */}
                <div className="flex justify-end animate-in slide-in-from-right-4 fade-in duration-700 delay-[600ms] fill-mode-both">
                  <div className="bg-gradient-to-r from-indigo-600 to-cyan-500 text-white px-6 py-4 rounded-3xl rounded-tr-sm shadow-lg shadow-indigo-200/50 max-w-[85%]">
                    <p className="font-medium text-[15px] leading-relaxed">How do I order coffee in Tokyo? ☕</p>
                  </div>
                </div>

                {/* AI Message */}
                <div className="flex gap-4 animate-in slide-in-from-left-4 fade-in duration-700 delay-[900ms] fill-mode-both">
                  <div className="w-14 h-14 rounded-full bg-white p-0.5 flex-shrink-0 shadow-md border border-indigo-50 relative">
                    <Image src="/logo-clean-v2.png" alt="AI" layout="fill" objectFit="contain" className="p-0.5" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="bg-white border border-slate-100 text-slate-700 px-6 py-5 rounded-3xl rounded-tl-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] max-w-[85%]">
                    <p className="font-medium mb-3 text-[15px]">You can say this politely:</p>
                    <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50 mb-2">
                      <p className="text-2xl font-black text-indigo-700 mb-1 tracking-tight">コーヒーをお願いします</p>
                      <p className="text-sm text-indigo-400/80 font-bold uppercase tracking-widest">Kōhī o onegaishimasu</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Mascot */}
            <div className="absolute -top-24 -right-16 md:-right-24 w-56 h-56 md:w-64 md:h-64 animate-float drop-shadow-[0_20px_30px_rgba(99,102,241,0.4)] hidden md:block z-20 hover:scale-110 transition-transform duration-500 cursor-pointer">
              <Image src="/logo-clean-v2.png" alt="Mascot" layout="fill" objectFit="contain" />
            </div>

            {/* Floating Badges */}
            <div className="absolute -bottom-8 -left-12 bg-white/90 backdrop-blur-xl p-5 rounded-3xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] border border-white animate-float z-20 hidden md:flex items-center gap-5 hover:-translate-y-2 transition-transform duration-300 cursor-pointer" style={{ animationDelay: '1s' }}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-inner shadow-white/20">
                <Mic className="w-7 h-7" />
              </div>
              <div className="pr-2">
                <p className="text-base font-black text-slate-900 tracking-tight">Voice Analysis</p>
                <p className="text-sm font-semibold text-emerald-600">Perfect accent</p>
              </div>
            </div>
            
          </div>
        </div>

        {/* Bento Grid Features */}
        <div id="features" className="space-y-6 animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-500 pt-10">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Feature Ecosystem</h2>
            <p className="text-slate-500 font-medium">Designed to optimize your skills</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 - span 2 */}
            <Link href="/free-chat" className="group md:col-span-2">
              <Card className="h-full min-h-[300px] p-6 md:p-10 border border-slate-100/80 bg-white/60 backdrop-blur-3xl rounded-[2rem] md:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-700"></div>
                <div className="space-y-5 z-10">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Free Conversation</h3>
                  <p className="text-slate-500 font-medium leading-relaxed max-w-md text-base md:text-lg">
                    Practice communication with unlimited topics. AI will monitor, analyze, and correct grammar as well as pronunciation instantly.
                  </p>
                </div>
                <div className="mt-8 flex items-center text-indigo-600 font-bold text-lg group-hover:gap-3 transition-all">
                  Start Conversation <ArrowRight className="w-6 h-6 ml-2" />
                </div>
              </Card>
            </Link>

            {/* Feature 2 - span 1 */}
            <Link href="/interview" className="group md:col-span-1">
              <Card className="h-full min-h-[300px] p-6 md:p-10 border border-slate-100/80 bg-white/60 backdrop-blur-3xl rounded-[2rem] md:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-cyan-100/50 to-transparent rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="space-y-5 z-10">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <Mic className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">AI Interview</h3>
                  <p className="text-slate-500 font-medium leading-relaxed text-base md:text-lg">
                    Experience real pressure with virtual recruiters. Get ready for tough questions.
                  </p>
                </div>
                <div className="mt-8 flex items-center text-cyan-600 font-bold text-lg group-hover:gap-3 transition-all">
                  Start Assessment <ArrowRight className="w-6 h-6 ml-2" />
                </div>
              </Card>
            </Link>

            {/* Feature 3 (Future) - span 1 */}
            <div className="group md:col-span-1 opacity-70">
              <Card className="h-full min-h-[250px] p-8 border border-dashed border-slate-300 bg-slate-50/40 rounded-[2.5rem] flex flex-col justify-center items-center text-center gap-4 hover:bg-slate-100/50 transition-colors cursor-not-allowed">
                <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">Vocabulary Builder</h3>
                  <span className="text-xs font-black tracking-widest uppercase px-4 py-1.5 bg-slate-200 text-slate-500 rounded-full">Coming Soon</span>
                </div>
              </Card>
            </div>

            {/* Feature 4 (Future) - span 2 */}
            <div className="group md:col-span-2 opacity-70">
              <Card className="h-full min-h-[250px] p-8 border border-dashed border-slate-300 bg-slate-50/40 rounded-[2.5rem] flex flex-col justify-center items-center text-center gap-4 hover:bg-slate-100/50 transition-colors cursor-not-allowed relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                  <LineChart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">Progress & Evaluation</h3>
                  <span className="text-xs font-black tracking-widest uppercase px-4 py-1.5 bg-slate-200 text-slate-500 rounded-full">Coming Soon</span>
                </div>
              </Card>
            </div>

          </div>
        </div>

        {/* Value Proposition */}
        <div className="mt-32 mb-16 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="flex flex-col items-center text-center gap-4 px-4">
            <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-indigo-500 mb-2">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Instant AI Correction</h4>
            <p className="text-slate-500 font-medium leading-relaxed">Detect and correct grammar mistakes as soon as you finish speaking.</p>
          </div>
          <div className="flex flex-col items-center text-center gap-4 px-4">
            <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-cyan-500 mb-2">
              <Waves className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Fearless Practice</h4>
            <p className="text-slate-500 font-medium leading-relaxed">Practice privately with AI, removing the psychological barrier of communication.</p>
          </div>
          <div className="flex flex-col items-center text-center gap-4 px-4">
            <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-purple-500 mb-2">
              <Mic className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Native Pronunciation</h4>
            <p className="text-slate-500 font-medium leading-relaxed">Analyze voice frequency to score and train natural intonation.</p>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="w-full px-6 md:px-12 xl:px-24 2xl:px-40 mt-32 pt-8 border-t border-slate-200/60 text-center text-slate-400 font-medium text-sm pb-8 relative z-10">
        <p>© 2026 GlobeLingua. Developed with 💙 by JellyFish.</p>
      </footer>

    </main>
  );
}