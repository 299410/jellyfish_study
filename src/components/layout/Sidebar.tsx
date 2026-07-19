'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, Mic, Layers, LayoutDashboard, PenTool, ClipboardList } from 'lucide-react';

const menuItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Layers, label: 'Flashcards', href: '/decks' },
  { icon: PenTool, label: 'Writing', href: '/writing' },
  { icon: Mic, label: 'Interview', href: '/interview' },
  { icon: ClipboardList, label: 'Quiz', href: '/quiz' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-20 md:w-64 h-screen fixed top-0 left-0 bg-white/80 backdrop-blur-xl border-r border-slate-100 flex flex-col items-center md:items-start py-8 transition-all duration-300 z-50">
      <div className="w-full px-4 md:px-6 mb-10 flex justify-center md:justify-start items-center gap-3">
        <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center shrink-0">
          <div className="absolute inset-0 bg-cyan-400 blur-2xl opacity-40 rounded-full animate-pulse" />
          <Image src="/logo-clean-v2.png" alt="JellyFish Mascot" width={64} height={64} className="relative z-10 hover:scale-110 transition-transform duration-500 drop-shadow-[0_4px_10px_rgba(34,211,238,0.5)]" priority />
        </div>
        <span className="hidden md:block font-black text-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent tracking-tight">JellyFish</span>
      </div>

      <nav className="flex-1 w-full px-3 md:px-4 flex flex-col gap-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group
                ${isActive 
                  ? 'bg-gradient-to-r from-indigo-50 to-cyan-50 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-100/50' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }
              `}
              title={item.label}
            >
              <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="hidden md:block text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="w-full px-4 md:px-8 mt-auto hidden md:block">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium">GlobeLingua</p>
          <p className="text-[10px] text-slate-400 mt-1">v0.1.0 MVP</p>
        </div>
      </div>
    </aside>
  );
}
