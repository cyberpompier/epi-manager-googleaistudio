import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { MicIcon } from './Icons';
import { base64ToBytes, createPcmBlob, decodeAudioData } from '../utils/audioStreamer';

export const LiveTab: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  
  // Refs for Audio Context and Session management
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop all playing sources
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();

    // Stop input processing
    if (processorRef.current && inputContextRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Close session
    if (sessionRef.current) {
       // Try close if method exists, usually via session interaction ending
       sessionRef.current.close(); 
       sessionRef.current = null;
    }

    // Close contexts
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    nextStartTimeRef.current = 0;
    setIsConnected(false);
    setStatus('idle');
  }, []);

  // Effect to clean up on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSession = async () => {
    setStatus('connecting');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Initialize Audio Contexts
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      audioContextRef.current = outputCtx;
      inputContextRef.current = inputCtx;
      
      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);

      // Get Mic Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Connect to Live API
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('connected');
            setIsConnected(true);
            console.log("Live session opened");

            // Setup Input Streaming
            const source = inputCtx.createMediaStreamSource(stream);
            sourceNodeRef.current = source;
            
            // Use ScriptProcessor for raw PCM access (Worklet is better but more complex for this snippet)
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination); // Mute locally
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            
            if (base64Audio && outputCtx) {
              const now = outputCtx.currentTime;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);

              const audioBuffer = await decodeAudioData(
                base64ToBytes(base64Audio),
                outputCtx,
                24000,
                1
              );

              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              
              source.onended = () => {
                sourcesRef.current.delete(source);
              };

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            console.log("Live session closed");
            cleanup();
          },
          onerror: (err) => {
            console.error("Live session error", err);
            setStatus('error');
            cleanup();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: "You are a helpful, friendly assistant. Speak concisely.",
        },
      });
      
      // Store session wrapper/promise logic if needed, but primarily we rely on the promise
      sessionRef.current = await sessionPromise;

    } catch (e) {
      console.error("Failed to start session", e);
      setStatus('error');
      cleanup();
    }
  };

  return (
    <div className="flex flex-col h-full w-full items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Live Conversation</h2>
          <p className="text-slate-400">Speak naturally with Gemini in real-time.</p>
        </div>

        <div className="relative group">
          <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 ${
            status === 'connected' ? 'bg-brand-500/40 scale-125 animate-pulse-slow' : 
            status === 'connecting' ? 'bg-yellow-500/30 scale-110' : 'bg-transparent'
          }`} />
          
          <button
            onClick={isConnected ? cleanup : startSession}
            disabled={status === 'connecting'}
            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 border-4 ${
              status === 'connected' 
                ? 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20' 
                : status === 'connecting'
                ? 'bg-slate-800 border-yellow-500 text-yellow-500'
                : 'bg-slate-800 border-brand-500 text-brand-400 hover:bg-brand-500/10 hover:scale-105 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
            }`}
          >
            {status === 'connecting' ? (
              <div className="w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <MicIcon className="w-12 h-12" />
            )}
          </button>
        </div>

        <div className="h-8 flex items-center justify-center">
          {status === 'connected' && (
            <div className="flex items-end gap-1 h-full">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1.5 bg-brand-500 rounded-full animate-bounce" 
                  style={{ 
                    height: '100%', 
                    animationDelay: `${i * 100}ms`,
                    animationDuration: '1s'
                  }} 
                />
              ))}
            </div>
          )}
          {status === 'error' && <span className="text-red-400">Connection failed. Try again.</span>}
          {status === 'idle' && <span className="text-slate-600">Ready to connect</span>}
        </div>
      </div>
    </div>
  );
};