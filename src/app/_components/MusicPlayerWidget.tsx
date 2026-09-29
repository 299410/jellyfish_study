"use client";

import { useState, useEffect } from "react";
import YouTube from "react-youtube";
import { Play, Pause, SkipBack, SkipForward, ListMusic, Music, X, Volume2, VolumeX, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MusicPlayerWidget({ playSFX, onClose }: { playSFX: (type: 'click' | 'check' | 'trash' | 'alarm') => void, onClose: () => void }) {
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [customLink, setCustomLink] = useState("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const currentStation = playlist.length > 0 ? playlist[currentIndex] : null;

  useEffect(() => {
    let interval: any;
    if (isPlaying && player && currentStation) {
      interval = setInterval(async () => {
        try {
          const time = await player.getCurrentTime();
          const dur = await player.getDuration();
          setCurrentTime(time || 0);
          setDuration(dur || 0);
        } catch (e) {}
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, player, currentStation]);

  const onReady = (event: any) => {
    setPlayer(event.target);
    event.target.setVolume(volume);
  };

  const togglePlay = () => {
    if (!currentStation) return;
    playSFX('click');
    if (!player) return;
    if (isPlaying) {
      player.pauseVideo();
      setIsPlaying(false);
    } else {
      player.playVideo();
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (playlist.length <= 1) return;
    playSFX('click');
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (playlist.length <= 1) return;
    playSFX('click');
    setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    setIsPlaying(true);
  };

  const handleVolumeChange = (e: any) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (player) {
      player.setVolume(val);
      if (isMuted && val > 0) {
        setIsMuted(false);
        player.unMute();
      }
    }
  };

  const toggleMute = () => {
    playSFX('click');
    if (!player) return;
    if (isMuted) {
      player.unMute();
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  };

  const extractVideoID = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleCustomLink = () => {
    const vidId = extractVideoID(customLink);
    if (vidId) {
      playSFX('check');
      setPlaylist([...playlist, { id: vidId, title: "Custom Station", artist: "YouTube" }]);
      if (playlist.length === 0) {
        setCurrentIndex(0);
        setIsPlaying(true);
      }
      setShowPlaylist(false);
    } else {
      playSFX('trash');
      alert("Invalid YouTube Link!");
    }
    setCustomLink("");
  };
  
  const removeTrack = (index: number) => {
    playSFX('trash');
    const newPlaylist = playlist.filter((_, i) => i !== index);
    setPlaylist(newPlaylist);
    if (currentIndex === index) {
        setCurrentIndex(0);
        setIsPlaying(false);
    } else if (currentIndex > index) {
        setCurrentIndex(currentIndex - 1);
    }
  }

  const formatTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col w-full text-slate-100 relative group/widget">
      
      {/* Hidden Player */}
      {currentStation && (
        <div className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden">
          <YouTube 
            videoId={currentStation.id} 
            opts={{ playerVars: { autoplay: 1, controls: 0, disablekb: 1 } }} 
            onReady={onReady}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-semibold text-white/80">Music</span>
        <button 
          onClick={() => { playSFX('trash'); onClose(); }} 
          className="opacity-0 group-hover/widget:opacity-100 transition-opacity cursor-pointer text-white/40 hover:text-white hover:bg-white/10 p-1 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Cover Art & Title Row */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-16 h-16 min-w-16 rounded-2xl overflow-hidden shadow-lg shadow-black/20 bg-black/20 relative flex items-center justify-center">
          {currentStation ? (
            <img 
              src={`https://img.youtube.com/vi/${currentStation.id}/mqdefault.jpg`} 
              alt="Cover" 
              className="w-full h-full object-cover scale-150"
              onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=2070&auto=format&fit=crop"; }}
            />
          ) : (
            <Music className="w-6 h-6 text-white/20" />
          )}
        </div>
        <div className="flex flex-col justify-center overflow-hidden">
          <h3 className="text-lg font-bold text-white truncate">
            {currentStation ? currentStation.title : "No Music"}
          </h3>
          <p className="text-sm text-white/60 truncate">
            {currentStation ? currentStation.artist : "Add a YouTube link"}
          </p>
        </div>
      </div>

      {/* Progress Bar (Or Volume if Livestream) */}
      <div className="mb-6 group/progress relative">
        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#00a8e8] transition-all duration-300"
            style={{ width: currentStation ? (duration > 0 ? `${progressPercent}%` : `${volume}%`) : '0%' }}
          ></div>
        </div>
        <div className="flex justify-between items-center mt-2 text-[11px] text-white/50 font-medium">
          {!currentStation ? (
             <span>Waiting for track...</span>
          ) : duration > 0 ? (
            <>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </>
          ) : (
            <>
              <span>Live Radio</span>
              <div className="flex items-center gap-2 opacity-0 group-hover/progress:opacity-100 transition-opacity absolute right-0 -top-2 bg-slate-800/90 rounded-md px-2 py-1">
                <Volume2 className="w-3 h-3" />
                <input 
                  type="range" min="0" max="100" 
                  value={volume} onChange={handleVolumeChange}
                  className="w-16 h-1 accent-[#00a8e8]"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between px-2">
        <button onClick={() => { playSFX('click'); setShowPlaylist(!showPlaylist); }} className="text-white/60 hover:text-white transition-colors">
          <ListMusic className="w-5 h-5" />
        </button>
        
        <button onClick={handlePrev} className="text-white/80 hover:text-white transition-colors opacity-80 hover:opacity-100">
          <SkipBack className="w-6 h-6 fill-current" />
        </button>
        
        <button 
          onClick={togglePlay} 
          className="w-14 h-14 rounded-full bg-[#00a8e8] hover:bg-[#0094cc] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(0,168,232,0.4)] transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          disabled={!currentStation}
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-0.5" />}
        </button>
        
        <button onClick={handleNext} className="text-white/80 hover:text-white transition-colors opacity-80 hover:opacity-100">
          <SkipForward className="w-6 h-6 fill-current" />
        </button>
        
        <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors">
          {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Playlist Selector (Expandable) */}
      {showPlaylist && (
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex gap-2">
            <Input 
              value={customLink} 
              onChange={e => setCustomLink(e.target.value)}
              placeholder="Paste YouTube Link..." 
              className="h-8 text-xs bg-black/20 border-white/10 text-white placeholder:text-white/40 rounded-lg px-2 flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleCustomLink()}
            />
            <Button onClick={handleCustomLink} size="sm" className="h-8 bg-[#00a8e8] text-white rounded-lg px-3 hover:bg-[#0094cc]">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-1 max-h-32 overflow-y-auto custom-scrollbar">
            {playlist.length === 0 ? (
                <div className="text-center text-white/40 text-xs py-4">No tracks added yet.</div>
            ) : (
                playlist.map((p, i) => (
                <div key={i} className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg transition-colors group/item ${currentIndex === i ? 'bg-white/20 text-white font-bold' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
                    <button 
                        onClick={() => { playSFX('click'); setCurrentIndex(i); setIsPlaying(true); }}
                        className="flex-1 text-left truncate pr-2"
                    >
                    {p.title}
                    </button>
                    <button onClick={() => removeTrack(i)} className="text-white/40 hover:text-rose-400 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
