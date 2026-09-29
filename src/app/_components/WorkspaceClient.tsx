"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Plus, Bomb, CheckCircle2, Circle, Palette, GripHorizontal, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import MusicPlayerWidget from "./MusicPlayerWidget";

const BACKGROUNDS = [
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=2074&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?q=80&w=2071&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1558486012-817176f84c6d?q=80&w=2070&auto=format&fit=crop",
];

const MIXKIT_SOUNDS = {
  click: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
  check: "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3", 
  trash: "https://assets.mixkit.co/active_storage/sfx/2384/2384-preview.mp3", 
  alarm: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"  
};

export default function WorkspaceClient({ initialNotes, initialTasks, userId }: any) {
  const [mounted, setMounted] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [showMusicWidget, setShowMusicWidget] = useState(true);

  // Pomodoro config states
  const [studyDuration, setStudyDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [isConfiguring, setIsConfiguring] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'study' | 'break'>('study');
  
  const [tasks, setTasks] = useState(initialTasks || []);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const playSFX = (type: 'click' | 'check' | 'trash' | 'alarm') => {
    try {
      const audio = new Audio(MIXKIT_SOUNDS[type]);
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Trình duyệt block autoplay:", e));
    } catch (error) {
      console.log("Audio error", error);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    document.body.style.backgroundImage = `url('${BACKGROUNDS[bgIndex]}')`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundAttachment = "fixed";
    return () => { document.body.style.backgroundImage = ''; };
  }, [bgIndex, mounted]);

  useEffect(() => {
    let timer: any;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      playSFX('alarm');
      
      if (mode === 'study') {
        setMode('break');
        setTimeLeft(breakDuration * 60);
      } else {
        setMode('study');
        setTimeLeft(studyDuration * 60);
      }
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode, studyDuration, breakDuration]);

  const toggleTimer = () => {
    playSFX('click');
    setIsRunning(!isRunning);
  };
  
  const resetTimer = () => {
    playSFX('click');
    setIsRunning(false);
    setTimeLeft(mode === 'study' ? studyDuration * 60 : breakDuration * 60);
  };

  const saveConfig = () => {
    playSFX('click');
    setIsConfiguring(false);
    setIsRunning(false);
    setTimeLeft(mode === 'study' ? studyDuration * 60 : breakDuration * 60);
  };

  const changeBg = () => {
    playSFX('click');
    setBgIndex((prev) => (prev + 1) % BACKGROUNDS.length);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!mounted) return null;

  return (
    <div className="relative w-full h-[calc(100vh-100px)]">
      
      {/* Background Switcher */}
      <div className="absolute bottom-6 right-6 z-50">
        <Button 
          onClick={changeBg}
          className="rounded-full bg-white/10 backdrop-blur-lg hover:bg-white/20 border border-white/30 text-white shadow-xl h-12 px-6 transition-all font-medium"
        >
          <Palette className="w-5 h-5 mr-2" />
          Change Vibe
        </Button>
      </div>

      {/* 1. Pomodoro Widget */}
      <motion.div 
        drag 
        dragMomentum={false}
        initial={{ x: 50, y: 50 }}
        className="absolute z-10 w-[320px] cursor-move"
      >
        <Card className="p-6 bg-white/10 backdrop-blur-xl border-white/20 flex flex-col items-center justify-center text-center shadow-2xl rounded-3xl hover:border-white/40 transition-all group relative overflow-hidden">
          <div className="opacity-0 group-hover:opacity-100 absolute top-2 text-white/50 transition-opacity">
            <GripHorizontal className="w-5 h-5" />
          </div>

          <div className="flex gap-2 mb-4 mt-2 bg-black/20 p-1 rounded-full border border-white/10 relative z-10">
            <Button 
              variant="ghost" 
              size="sm" 
              className={mode === 'study' ? "bg-white/20 text-white rounded-full shadow-sm" : "text-white/60 hover:text-white rounded-full"}
              onClick={() => { playSFX('click'); setMode('study'); setTimeLeft(studyDuration*60); setIsRunning(false); setIsConfiguring(false); }}
            >
              Focus 🔥
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              className={mode === 'break' ? "bg-white/20 text-white rounded-full shadow-sm" : "text-white/60 hover:text-white rounded-full"}
              onClick={() => { playSFX('click'); setMode('break'); setTimeLeft(breakDuration*60); setIsRunning(false); setIsConfiguring(false); }}
            >
              Chill ☕
            </Button>
          </div>
          
          {isConfiguring ? (
            <div className="relative w-48 h-48 flex flex-col items-center justify-center mb-6 bg-black/20 rounded-full border border-white/10 shadow-inner">
              <label className="text-[10px] text-white/60 mb-1 uppercase tracking-widest font-bold">Focus (Min)</label>
              <Input 
                type="number" 
                value={studyDuration} 
                onChange={e => setStudyDuration(Math.max(1, Number(e.target.value)))}
                className="w-20 text-center bg-white/10 border-white/20 text-white h-8 rounded-lg mb-2 font-bold focus-visible:ring-cyan-500"
              />
              <label className="text-[10px] text-white/60 mb-1 uppercase tracking-widest font-bold mt-1">Break (Min)</label>
              <Input 
                type="number" 
                value={breakDuration} 
                onChange={e => setBreakDuration(Math.max(1, Number(e.target.value)))}
                className="w-20 text-center bg-white/10 border-white/20 text-white h-8 rounded-lg font-bold focus-visible:ring-indigo-500"
              />
            </div>
          ) : (
            <div className="relative w-48 h-48 rounded-full border-[3px] flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-colors duration-500 bg-black/10"
                 style={{ borderColor: isRunning ? (mode === 'study' ? '#67e8f9' : '#a5b4fc') : 'rgba(255,255,255,0.2)' }}>
              <div className="text-5xl font-black tracking-tighter font-mono text-white drop-shadow-lg">
                {formatTime(timeLeft)}
              </div>
            </div>
          )}

          <div className="flex gap-2 relative z-10 items-center justify-center">
            {isConfiguring ? (
              <Button onClick={saveConfig} size="lg" className="px-8 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white shadow-xl shadow-cyan-500/20 font-bold transition-all h-12">
                Save Timer
              </Button>
            ) : (
              <>
                <Button onClick={toggleTimer} size="lg" className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 shadow-xl transition-all">
                  {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 translate-x-0.5" />}
                </Button>
                <Button onClick={resetTimer} size="lg" variant="ghost" className="w-12 h-12 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/20">
                  <RotateCcw className="w-5 h-5" />
                </Button>
                <Button onClick={() => { playSFX('click'); setIsConfiguring(true); setIsRunning(false); }} size="lg" variant="ghost" className="w-12 h-12 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/20">
                  <Settings2 className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        </Card>
      </motion.div>

      {/* 2. To-do List Widget */}
      <motion.div 
        drag 
        dragMomentum={false}
        initial={{ x: typeof window !== 'undefined' && window.innerWidth > 768 ? window.innerWidth - 400 : 50, y: 50 }}
        className="absolute z-20 w-[350px] cursor-move"
      >
        <Card className="p-5 bg-white/10 backdrop-blur-xl border-white/20 rounded-3xl shadow-2xl flex flex-col max-h-[400px] overflow-hidden group hover:border-white/40 transition-all">
          <div className="opacity-0 group-hover:opacity-100 absolute top-2 right-1/2 translate-x-1/2 text-white/50 transition-opacity">
            <GripHorizontal className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold mb-4 text-white mt-2 drop-shadow-md">Epic Quests ⚔️</h2>
          <div className="flex gap-2 mb-4">
            <Input 
              value={newTask} 
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="What's your next mission?" 
              className="bg-black/20 border-white/20 text-white placeholder:text-white/60 focus-visible:ring-white/50 rounded-xl backdrop-blur-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTask) {
                  playSFX('click');
                  setTasks([...tasks, { id: Date.now().toString(), title: newTask, isCompleted: false }]);
                  setNewTask('');
                }
              }}
            />
            <Button 
              className="bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-xl shadow-lg backdrop-blur-sm transition-all"
              onClick={() => {
                if (newTask) {
                  playSFX('click');
                  setTasks([...tasks, { id: Date.now().toString(), title: newTask, isCompleted: false }]);
                  setNewTask('');
                }
              }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {tasks.length === 0 ? (
              <p className="text-white/60 text-sm text-center py-6 font-medium">You have defeated all monsters! 🐉</p>
            ) : (
              tasks.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/10 hover:border-white/30 hover:bg-black/30 transition-all backdrop-blur-sm">
                  <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => {
                    playSFX('check');
                    setTasks(tasks.map((t: any) => t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t));
                  }}>
                    {task.isCompleted ? <CheckCircle2 className="text-cyan-300 w-5 h-5 drop-shadow-md" /> : <Circle className="text-white/50 w-5 h-5" />}
                    <span className={task.isCompleted ? 'line-through text-white/50 text-sm' : 'text-white text-sm font-medium drop-shadow-sm'}>{task.title}</span>
                  </div>
                  <button onClick={() => {
                    playSFX('trash');
                    setTasks(tasks.filter((t: any) => t.id !== task.id));
                  }} className="text-white/40 hover:text-amber-400 p-1 rounded-md hover:bg-white/10 transition-colors">
                    <Bomb className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      </motion.div>

      {/* 3. Music Player Widget */}
      {showMusicWidget && (
        <motion.div 
          drag 
          dragMomentum={false}
          initial={{ x: 50, y: 450 }}
          className="absolute z-10 w-[320px] cursor-move"
        >
          <Card className="p-4 bg-white/10 backdrop-blur-xl border-white/20 rounded-3xl shadow-2xl group hover:border-white/40 transition-all relative">
            <div className="opacity-0 group-hover:opacity-100 absolute top-2 right-1/2 translate-x-1/2 text-white/50 transition-opacity z-50 drop-shadow-lg">
              <GripHorizontal className="w-5 h-5" />
            </div>
            <MusicPlayerWidget playSFX={playSFX} onClose={() => setShowMusicWidget(false)} />
          </Card>
        </motion.div>
      )}

      {/* 4. Sticky Note Widget */}
      <motion.div 
        drag 
        dragMomentum={false}
        initial={{ x: typeof window !== 'undefined' && window.innerWidth > 768 ? window.innerWidth - 350 : 500, y: 500 }}
        className="absolute z-30 w-[280px] cursor-move"
      >
        <Card className="p-5 bg-amber-200/20 backdrop-blur-xl border border-amber-200/30 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] flex flex-col h-[220px] group hover:border-amber-200/50 transition-all">
           <div className="opacity-0 group-hover:opacity-100 absolute top-2 right-1/2 translate-x-1/2 text-amber-100/50 transition-opacity">
            <GripHorizontal className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold mb-2 text-amber-50 tracking-tight mt-1 drop-shadow-md">Scribbles 🖍️</h2>
          <textarea 
            className="flex-1 bg-transparent border-none focus:ring-0 outline-none resize-none text-white placeholder:text-amber-100/50 font-medium text-base leading-relaxed custom-scrollbar drop-shadow-sm"
            placeholder="Write something cool here..."
            defaultValue={initialNotes?.[0]?.content || ""}
            onFocus={() => playSFX('click')}
          ></textarea>
        </Card>
      </motion.div>

    </div>
  );
}
