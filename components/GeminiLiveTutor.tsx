
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import React, { useState, useRef, useCallback } from 'react';
import { decode, decodeAudioData, createPcmBlob } from '../services/audioUtils.ts';

const GeminiLiveTutor: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const stopSession = useCallback(() => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (inputAudioCtxRef.current) inputAudioCtxRef.current.close();
    if (outputAudioCtxRef.current) outputAudioCtxRef.current.close();
    setIsActive(false);
    setStatus('idle');
  }, []);

  const startSession = async () => {
    setError(null);
    setStatus('connecting');
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API_KEY no encontrada en Vercel. Asegúrate de llamarla exactamente API_KEY.");

      const ai = new GoogleGenAI({ apiKey });
      inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      await inputAudioCtxRef.current.resume();
      await outputAudioCtxRef.current.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setStatus('listening');
            const source = inputAudioCtxRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioCtxRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (status === 'speaking') return;
              sessionPromise.then(s => s.sendRealtimeInput({ media: createPcmBlob(e.inputBuffer.getChannelData(0)) }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioCtxRef.current!.destination);
          },
          onmessage: async (m: LiveServerMessage) => {
            const audio = m.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio && outputAudioCtxRef.current) {
              setStatus('speaking');
              const buffer = await decodeAudioData(decode(audio), outputAudioCtxRef.current, 24000, 1);
              const source = outputAudioCtxRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioCtxRef.current.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('listening');
              };
              source.start();
              sourcesRef.current.add(source);
            }
          },
          onerror: (e) => { 
            console.error("Live Error:", e);
            setError("Error de conexión. Revisa tu clave API."); 
            stopSession(); 
          },
          onclose: () => stopSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'You are James, a friendly English teacher. Keep it simple.',
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
        }
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al iniciar sesión.");
      setStatus('idle');
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
      <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
        <div><h2 className="text-2xl font-bold">Tutor James</h2><p className="text-indigo-100">Voz en tiempo real</p></div>
        {isActive ? (
          <button onClick={stopSession} className="bg-red-500 px-6 py-2 rounded-full font-bold shadow-lg">Detener</button>
        ) : (
          <button onClick={startSession} disabled={status === 'connecting'} className="bg-white text-indigo-600 px-8 py-3 rounded-full font-bold shadow-lg disabled:opacity-50">
            {status === 'connecting' ? 'Conectando...' : 'Comenzar'}
          </button>
        )}
      </div>
      <div className="h-64 p-6 bg-slate-50 flex flex-col justify-center items-center">
        {error && <p className="text-red-500 font-bold text-center bg-red-50 p-4 rounded-xl border border-red-200">{error}</p>}
        {!isActive && !error && <p className="text-slate-400 italic">Pulsa comenzar para practicar inglés con James.</p>}
        {isActive && (
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl animate-bounce mx-auto mb-4">
              <i className={status === 'speaking' ? "fas fa-volume-up" : "fas fa-microphone"}></i>
            </div>
            <p className="font-bold text-indigo-600 uppercase tracking-widest text-xs">{status === 'speaking' ? 'James hablando' : 'Te escucho...'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeminiLiveTutor;
