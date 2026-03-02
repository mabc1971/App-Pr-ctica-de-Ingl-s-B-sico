
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import React, { useState, useRef, useCallback } from 'react';
import { decode, decodeAudioData, createPcmBlob } from '../services/audioUtils.ts';
import { getGeminiApiKey } from '../services/apiConfig.ts';

const GeminiLiveTutor: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const statusRef = useRef(status);
  statusRef.current = status;
  
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;
  
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isClosingRef = useRef(false);

  const stopSession = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    
    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
      inputAudioCtxRef.current.close().catch(console.error);
    }
    if (outputAudioCtxRef.current && outputAudioCtxRef.current.state !== 'closed') {
      outputAudioCtxRef.current.close().catch(console.error);
    }
    
    inputAudioCtxRef.current = null;
    outputAudioCtxRef.current = null;
    setIsActive(false);
    setStatus('idle');
    isClosingRef.current = false;
  }, []);

  const handleKeySelection = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        setError(null);
      } catch (err) {
        console.error("Error opening key selector:", err);
      }
    }
  };

  const nextStartTimeRef = useRef<number>(0);

  const startSession = async () => {
    setError(null);
    setStatus('connecting');
    nextStartTimeRef.current = 0;
    try {
      let apiKey = getGeminiApiKey();
      
      if (!apiKey && window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await handleKeySelection();
          apiKey = getGeminiApiKey();
        } else {
          apiKey = getGeminiApiKey();
        }
      }

      if (!apiKey) {
        throw new Error("No se encontró una API Key. Por favor, asegúrate de configurar GEMINI_API_KEY en Vercel o usa el botón de configuración.");
      }
      
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
            if (!inputAudioCtxRef.current) return;
            
            const source = inputAudioCtxRef.current.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioCtxRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (statusRef.current === 'speaking' || !isActiveRef.current) return;
              sessionPromise.then(s => {
                if (statusRef.current !== 'speaking' && isActiveRef.current) {
                  s.sendRealtimeInput({ media: createPcmBlob(e.inputBuffer.getChannelData(0)) });
                }
              }).catch(() => {});
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioCtxRef.current.destination);
          },
          onmessage: async (m: LiveServerMessage) => {
            if (m.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setStatus('listening');
              return;
            }

            const audio = m.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio && outputAudioCtxRef.current) {
              setStatus('speaking');
              const buffer = await decodeAudioData(decode(audio), outputAudioCtxRef.current, 24000, 1);
              const source = outputAudioCtxRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioCtxRef.current.destination);
              
              const now = outputAudioCtxRef.current.currentTime;
              if (nextStartTimeRef.current < now) {
                nextStartTimeRef.current = now;
              }
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) {
                  setStatus('listening');
                  nextStartTimeRef.current = 0;
                }
              };
              sourcesRef.current.add(source);
            }
          },
          onerror: (e: any) => { 
            console.error("Live Error:", e);
            if (e?.message?.includes("unavailable")) {
              setError("El servicio de IA está temporalmente saturado o no disponible en tu región. Intenta de nuevo en unos momentos.");
            } else {
              setError("Error de conexión. Revisa tu conexión o API Key.");
            }
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
      setError("Error al iniciar sesión. Verifica tu API Key.");
      setStatus('idle');
      stopSession();
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
        {error && (
          <div className="text-center">
            <p className="text-red-500 font-bold bg-red-50 p-4 rounded-xl border border-red-200 mb-4">{error}</p>
            {window.aistudio && (
              <button 
                onClick={handleKeySelection}
                className="text-indigo-600 font-semibold hover:underline text-sm"
              >
                Configurar API Key
              </button>
            )}
          </div>
        )}
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
