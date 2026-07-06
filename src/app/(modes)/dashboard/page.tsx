"use client";

import { useState, useEffect, useMemo } from "react";
import { useUserId, useUserName } from "@/components/UserOnboarding";
import { getDashboardStats } from "@/app/actions/activity";
import { getDailyQuote, type Quote } from "@/lib/quotes";
import { Sparkles, Flame, Clock, Calendar, ArrowRight, MessageSquare, Mic, Layers, Activity } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface HeatmapDay {
  date: string;
  count: number;
}

export default function DashboardPage() {
  const userId = useUserId();
  const userName = useUserName();
  
  const [stats, setStats] = useState<{
    heatmap: HeatmapDay[];
    currentStreak: number;
    longestStreak: number;
    totalMinutes: number;
  } | null>(null);
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Daily target study minutes
  const DAILY_TARGET_MINUTES = 15;

  useEffect(() => {
    setQuote(getDailyQuote());
  }, []);

  useEffect(() => {
    if (!userId) return;
    
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const data = await getDashboardStats(userId);
        setStats(data);
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  const heatmapGrid = useMemo(() => {
    if (!stats) return [];
    
    const dataMap = new Map(stats.heatmap.map((d) => [d.date, d.count]));
    const grid: { date: string; minutes: number; dayOfWeek: number }[][] = [];
    
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 364);
    const startDayOffset = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDayOffset);

    let currentDay = new Date(startDate);
    
    for (let w = 0; w < 53; w++) {
      const week: { date: string; minutes: number; dayOfWeek: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = currentDay.toLocaleDateString("en-CA");
        const minutes = dataMap.get(dateStr) || 0;
        
        week.push({
          date: dateStr,
          minutes,
          dayOfWeek: currentDay.getDay(),
        });
        
        currentDay.setDate(currentDay.getDate() + 1);
      }
      grid.push(week);
    }
    
    return grid;
  }, [stats]);

  // Extract month labels for heatmap columns
  const monthLabels = useMemo(() => {
    if (heatmapGrid.length === 0) return [];
    
    const labels: { text: string; colIndex: number }[] = [];
    let prevMonth = -1;
    
    heatmapGrid.forEach((week, wIdx) => {
      if (week.length === 0) return;
      const dateObj = new Date(week[0].date);
      const currentMonth = dateObj.getMonth();
      
      if (currentMonth !== prevMonth) {
        labels.push({
          text: dateObj.toLocaleDateString("en-US", { month: "short" }),
          colIndex: wIdx,
        });
        prevMonth = currentMonth;
      }
    });
    
    // Deduplicate labels that are too close (e.g. within 2 columns) to avoid crowding
    const filteredLabels: typeof labels = [];
    labels.forEach((label) => {
      const lastLabel = filteredLabels[filteredLabels.length - 1];
      if (!lastLabel || label.colIndex - lastLabel.colIndex > 2) {
        filteredLabels.push(label);
      }
    });
    
    return filteredLabels;
  }, [heatmapGrid]);

  // Color mapping using clean, beautiful shades of violet/indigo matching the theme
  const getSquareColor = (minutes: number) => {
    if (minutes === 0) return "bg-slate-100 border-slate-200/40 hover:bg-slate-200/50";
    if (minutes <= 5) return "bg-indigo-50 border-indigo-100/30 text-indigo-700 hover:bg-indigo-100";
    if (minutes <= 15) return "bg-indigo-200 border-indigo-300/30 text-indigo-900 hover:bg-indigo-300";
    if (minutes <= 30) return "bg-indigo-400 border-indigo-500/30 text-white hover:bg-indigo-500";
    return "bg-indigo-600 border-indigo-700/30 text-white hover:bg-indigo-700";
  };

  const getSquareTooltip = (date: string, minutes: number) => {
    const formattedDate = new Date(date).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (minutes === 0) return `No learning time recorded on ${formattedDate}`;
    return `Learned for ${minutes} minutes on ${formattedDate}`;
  };

  // Calculate today's study minutes
  const todayMinutes = useMemo(() => {
    if (!stats) return 0;
    const todayStr = new Date().toLocaleDateString("en-CA");
    const todayData = stats.heatmap.find(d => d.date === todayStr);
    return todayData ? todayData.count : 0;
  }, [stats]);

  // Calculate circular progress percentages
  const progressPercent = Math.min(100, Math.round((todayMinutes / DAILY_TARGET_MINUTES) * 100));
  const strokeDashoffset = 220 - (220 * progressPercent) / 100;

  if (isLoading || !stats || !quote) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const hasStudiedToday = stats.heatmap.some(
    d => d.date === new Date().toLocaleDateString("en-CA") && d.count > 0
  );

  return (
    <div className="min-h-screen bg-[#FAFAFC] pt-10 pb-20 px-6 relative overflow-hidden font-sans">
      
      {/* Background Glowing Ambient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[65%] h-[65%] bg-gradient-to-br from-indigo-200/40 via-purple-100/10 to-transparent rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[65%] h-[65%] bg-gradient-to-tl from-cyan-200/40 via-teal-100/10 to-transparent rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        
        {/* Welcome Section with Official Logo Image */}
        <div className="flex items-center gap-4 relative">
          <div className="relative w-14 h-14 shrink-0 animate-float drop-shadow-[0_8px_16px_rgba(34,211,238,0.3)]">
            <Image src="/logo-clean-v2.png" alt="JellyFish Mascot" layout="fill" objectFit="contain" priority unoptimized />
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Welcome back, <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-500 bg-clip-text text-transparent">{userName || "Learner"}</span>!
            </h1>
            <p className="text-slate-500 font-bold mt-0.5 text-sm md:text-base tracking-wide uppercase">Command Center V.1</p>
          </div>
        </div>

        {/* Bento Grid Layout - Repositioned Modules to Left Column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT / MAIN COLUMN (span 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Motivational Quote Card - HUD Display Panel */}
            <div className="relative overflow-hidden border border-white/60 bg-white/70 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-[0_15px_35px_rgba(99,102,241,0.04)]">
              {/* Sci-Fi Corner Brackets */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-indigo-400/50 rounded-tl-sm pointer-events-none"></div>
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-indigo-400/50 rounded-tr-sm pointer-events-none"></div>
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-indigo-400/50 rounded-bl-sm pointer-events-none"></div>
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-indigo-400/50 rounded-br-sm pointer-events-none"></div>
              
              {/* Tech Mesh Overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.15] pointer-events-none"></div>
              
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-[10px] uppercase tracking-widest shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Daily Transmission
                </div>
                
                <div className="space-y-3">
                  <p 
                    className="text-3xl md:text-4xl font-black tracking-wide leading-relaxed text-slate-800 font-sans"
                    style={{ rubyPosition: "over" }}
                    dangerouslySetInnerHTML={{ __html: quote.text }}
                  />
                  <div className="space-y-0.5">
                    <p className="text-slate-500 font-semibold text-sm leading-relaxed">{quote.meaning}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Heatmap Grid - With Weekday and Month labels for readability */}
            <div className="relative overflow-hidden border border-white/60 bg-white/70 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-[0_15px_35px_rgba(99,102,241,0.04)] space-y-5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-100/30 to-transparent rounded-bl-full pointer-events-none"></div>
              
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Study Heatmap</h2>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="System Live Syncing" />
                  </div>
                  <p className="text-slate-500 text-xs font-semibold mt-0.5">Unified activity tracker across all modules</p>
                </div>
                
                {/* Color Key */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                  <span>Less</span>
                  <div className="w-3.5 h-3.5 rounded-[4px] bg-slate-100 border border-slate-200"></div>
                  <div className="w-3.5 h-3.5 rounded-[4px] bg-cyan-100"></div>
                  <div className="w-3.5 h-3.5 rounded-[4px] bg-cyan-300"></div>
                  <div className="w-3.5 h-3.5 rounded-[4px] bg-indigo-400"></div>
                  <div className="w-3.5 h-3.5 rounded-[4px] bg-indigo-600"></div>
                  <span>More</span>
                </div>
              </div>

              {/* Grid Render with month and weekday headers */}
              <div className="overflow-x-auto pb-2 relative z-10">
                <div className="min-w-[680px] flex flex-col space-y-1">
                  
                  {/* Month headers row */}
                  <div className="flex pl-8 h-5 relative text-[9px] font-bold text-slate-400">
                    {monthLabels.map((lbl, idx) => (
                      <span
                        key={idx}
                        className="absolute"
                        style={{ left: `${lbl.colIndex * 15 + 32}px` }}
                      >
                        {lbl.text}
                      </span>
                    ))}
                  </div>

                  {/* Grid columns containing cells, prefixed with weekday labels */}
                  <div className="flex gap-[4px] select-none">
                    
                    {/* Weekday labels column */}
                    <div className="flex flex-col justify-between text-[9px] font-bold text-slate-400 pr-2 w-8 h-[101px] pt-[2px]">
                      <span>Sun</span>
                      <span>Tue</span>
                      <span>Thu</span>
                      <span>Sat</span>
                    </div>

                    {/* Column columns */}
                    {heatmapGrid.map((week, wIdx) => (
                      <div key={wIdx} className="flex flex-col gap-[4px] h-[101px]">
                        {week.map((day, dIdx) => (
                          <div
                            key={dIdx}
                            title={getSquareTooltip(day.date, day.minutes)}
                            className={`w-[11px] h-[11px] rounded-[3px] border transition-all duration-300 ${getSquareColor(
                              day.minutes
                            )}`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Practice Actions - Shifted to left column, arranged in a balanced grid */}
            <div className="border border-white/60 bg-white/70 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-[0_15px_35px_rgba(99,102,241,0.04)] space-y-5">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">System Modules</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Decks action */}
                <Link href="/decks" className="flex flex-col justify-between p-5 rounded-2xl bg-white/60 border border-slate-100 hover:border-indigo-200/50 hover:bg-indigo-50/30 hover:shadow-[0_8px_20px_rgba(99,102,241,0.04)] transition-all duration-300 group h-36">
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                      <Layers className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-800">Flashcards</p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Anki SM-2 learning</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 mt-2">
                    Start study <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* Free Chat action */}
                <Link href="/free-chat" className="flex flex-col justify-between p-5 rounded-2xl bg-white/60 border border-slate-100 hover:border-blue-200/50 hover:bg-blue-50/30 hover:shadow-[0_8px_20px_rgba(59,130,246,0.04)] transition-all duration-300 group h-36">
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-800">Free Chat</p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Reflex practice with AI</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-500 mt-2">
                    Start practice <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* Interview action */}
                <Link href="/interview" className="flex flex-col justify-between p-5 rounded-2xl bg-white/60 border border-slate-100 hover:border-cyan-200/50 hover:bg-cyan-50/30 hover:shadow-[0_8px_20px_rgba(6,182,212,0.04)] transition-all duration-300 group h-36">
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-cyan-50 text-cyan-500 rounded-xl flex items-center justify-center shrink-0">
                      <Mic className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-800">AI Interview</p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Mock hiring simulation</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-500 mt-2">
                    Start interview <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

              </div>
            </div>

          </div>

          {/* RIGHT / SIDEBAR COLUMN (span 1) */}
          <div className="space-y-6">
            
            {/* HUD Status Gauge - Circular Progress Ring */}
            <div className="border border-white/60 bg-white/70 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_20px_50px_-15px_rgba(79,70,229,0.05)] flex flex-col items-center text-center space-y-4 relative">
              <div className="absolute top-3 right-3 text-slate-300">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Today target progress</p>
              
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    className="stroke-slate-100"
                    strokeWidth="5"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    className="stroke-indigo-600 transition-all duration-1000 ease-out"
                    strokeWidth="5.5"
                    fill="transparent"
                    strokeDasharray="220"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{
                      filter: "drop-shadow(0 0 6px rgba(79, 70, 229, 0.4))",
                    }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black text-slate-800 tracking-tighter">{todayMinutes}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MINS</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-700">
                  {progressPercent}% of daily goal
                </p>
                <p className="text-[10px] text-slate-500 font-semibold">
                  Goal: {DAILY_TARGET_MINUTES} mins / day
                </p>
              </div>
            </div>

            {/* Streak & Accumulated Stats List */}
            <div className="border border-white/60 bg-white/70 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_20px_50px_-15px_rgba(79,70,229,0.05)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Metrics</span>
                <span className="px-2 py-0.5 bg-orange-50 border border-orange-100/50 text-orange-500 rounded-full text-[9px] font-bold tracking-wide animate-pulse">ACTIVE</span>
              </div>
              
              <div className="space-y-4">
                {/* Streak */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 border border-orange-100/10">
                      <Flame className="w-5 h-5 fill-orange-500" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">Streak Count</p>
                      <p className="text-[10px] text-slate-500 font-semibold">Record: {stats.longestStreak} days</p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-slate-800">{stats.currentStreak} Days</span>
                </div>

                {/* Accumulated Minutes */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-100/10">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">Total Minutes</p>
                      <p className="text-[10px] text-slate-500 font-semibold">Yearly accumulated stats</p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-slate-800">{stats.totalMinutes} Mins</span>
                </div>
              </div>
            </div>

          </div>
          
        </div>

      </div>
    </div>
  );
}
