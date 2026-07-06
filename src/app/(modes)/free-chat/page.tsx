'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AudioRecorder } from '@/components/AudioRecorder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/lib/ai/adapter';
import { Send, Edit2, Check, ArrowLeft, MessageSquare, Mic } from 'lucide-react';
import Link from 'next/link';
import { logActivity } from '@/app/actions/activity';
import { useUserId } from '@/components/UserOnboarding';

export default function Home() {
  const userId = useUserId();
  const startTimeRef = useRef(Date.now());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track activity duration
  useEffect(() => {
    startTimeRef.current = Date.now();
    return () => {
      const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (userId && durationSeconds >= 2) {
        logActivity(userId, "FREE_CHAT", durationSeconds);
      }
    };
  }, [userId]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentTranscript]);

  const handleAudioComplete = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'audio.webm');
      
      const res = await fetch('/api/stt', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setCurrentTranscript(data.transcript);
      setIsEditingTranscript(true); // Allow user to review/edit before sending
    } catch (error) {
      console.error(error);
      alert('Speech recognition error!');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendToAI = async () => {
    if (!currentTranscript.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', content: currentTranscript };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    setCurrentTranscript('');
    setIsEditingTranscript(false);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, history: messages }),
      });

      if (!res.ok) throw new Error('Failed to get response');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      let aiResponse = '';
      setMessages(prev => [...prev, { role: 'model', content: '' }]); // Placeholder

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunkText = decoder.decode(value);
          aiResponse += chunkText;
          
          setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1].content = aiResponse;
            return newMsgs;
          });
        }
      }
    } catch (error) {
      console.error(error);
      alert('Failed to get AI response');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-10 relative overflow-hidden flex justify-center bg-[#FAFAFC] z-10 w-full">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-gradient-to-br from-indigo-200/40 to-transparent rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tl from-cyan-200/40 to-transparent rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <Card className="w-full max-w-5xl h-[calc(100vh-5rem)] flex flex-col shadow-[0_20px_60px_-15px_rgba(79,70,229,0.06)] border border-white/60 overflow-hidden bg-white/40 backdrop-blur-2xl rounded-[2.5rem] relative z-10">
        <CardHeader className="border-b border-slate-100 bg-white/40 backdrop-blur-md p-4 md:p-6 sticky top-0 z-10">
          <CardTitle className="text-2xl font-black flex items-center gap-3 text-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 border border-blue-100/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">Free Chat Practice</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Chat History Area */}
          <ScrollArea className="flex-1 p-4 md:p-6">
            <div className="space-y-6">
              {messages.length === 0 && (
                <div className="text-center text-slate-400 mt-32 flex flex-col items-center">
                  <div className="w-20 h-20 bg-indigo-50/60 border border-indigo-100/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-indigo-100/50 shadow-inner">
                    <Mic className="w-8 h-8 text-indigo-400 animate-pulse" />
                  </div>
                  <p className="text-lg font-bold text-slate-700">Tap the microphone to start a conversation</p>
                  <p className="text-sm mt-2 text-slate-500 font-medium">Speak naturally, AI will correct and respond to you.</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2`}>
                  <div className={`max-w-[85%] rounded-3xl p-5 whitespace-pre-wrap leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-sm shadow-md' 
                      : 'bg-white/60 backdrop-blur-sm border border-slate-100/80 text-slate-700 rounded-bl-sm shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} className="h-4" />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="bg-white/60 backdrop-blur-xl border-t border-indigo-50 p-4 md:p-6 flex flex-col gap-4 z-10">
            {isEditingTranscript && (
              <div className="flex flex-col gap-4 animate-in fade-in">
                <div className="text-sm font-bold text-indigo-600 flex items-center gap-2">
                  <Edit2 className="w-4 h-4" /> You said: (Edit before sending)
                </div>
                <Textarea 
                  value={currentTranscript}
                  onChange={(e) => setCurrentTranscript(e.target.value)}
                  className="resize-none border-indigo-100 bg-white/80 focus-visible:ring-indigo-400 rounded-2xl p-4 text-base shadow-inner"
                  rows={3}
                />
                <div className="flex justify-end gap-3">
                  <Button variant="outline" className="rounded-2xl px-6 border-indigo-100 text-indigo-700 hover:bg-indigo-50" onClick={() => setIsEditingTranscript(false)}>Cancel</Button>
                  <Button onClick={handleSendToAI} className="bg-slate-900 hover:bg-indigo-600 rounded-2xl px-6 shadow-md transition-all hover:scale-105">
                    <Check className="w-4 h-4 mr-2" /> Send
                  </Button>
                </div>
              </div>
            )}

            {!isEditingTranscript && (
              <div className="flex items-center justify-center">
                <AudioRecorder 
                  onRecordingComplete={handleAudioComplete} 
                  isProcessing={isProcessing} 
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
