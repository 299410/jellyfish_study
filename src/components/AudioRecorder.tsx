'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  isProcessing?: boolean;
}

export function AudioRecorder({ onRecordingComplete, isProcessing = false }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Chrome/Edge usually support audio/webm
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(blob);
        // Clean up tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Cannot access microphone. Please check browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      {isRecording ? (
        <Button
          variant="destructive"
          size="lg"
          onClick={stopRecording}
          className="rounded-full w-16 h-16 animate-pulse shadow-lg"
          disabled={isProcessing}
        >
          <Square className="w-6 h-6" />
        </Button>
      ) : (
        <Button
          variant="default"
          size="lg"
          onClick={startRecording}
          className="rounded-full w-16 h-16 shadow-lg bg-blue-600 hover:bg-blue-700 text-white transition-all"
          disabled={isProcessing}
        >
          {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Mic className="w-6 h-6" />}
        </Button>
      )}
    </div>
  );
}
