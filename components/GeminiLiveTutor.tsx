
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { decode, decodeAudioData, createPcmBlob } from '../services/audioUtils.ts';

const GeminiLiveTutor: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [transcripts, setTranscripts] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);

  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

  const stopSession = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') inputAudioCtxRef.current.close();
    if (outputAudioCtxRef.current && outputAudioCtxRef.current.state !== 'closed') outputAudioCtxRef.current.close();
    
    setIsActive(false);
    setStatus('idle');
  }, []);

  const startSession = async () => {
    setError(null);
    setStatus('connecting');
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("API Key no configurada. Por favor, asegúrate de que esté en el entorno.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      if (inputAudioCtxRef.current.state === 'suspended') await inputAudioCtxRef.current.resume();
      if (outputAudioCtxRef.current.state === 'suspended') await outputAudioCtxRef.current.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log('Live Connection Opened');
            setIsActive(true);
            setStatus('listening');
            
            const source = inputAudioCtxRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioCtxRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (status === 'speaking') return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioCtxRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscription.current += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
              currentInputTranscription.current += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              if (currentInputTranscription.current || currentOutputTranscription.current) {
                setTranscripts(prev => [
                  ...prev, 
                  { role: 'user', text: currentInputTranscription.current || '...' },
                  { role: 'model', text: currentOutputTranscription.current || '...' }
                ]);
              }
              currentInputTranscription.current = '';
              currentOutputTranscription.current = '';
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioCtxRef.current) {
              setStatus('speaking');
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioCtxRef.current.currentTime);
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                outputAudioCtxRef.current,
                24000,
                1
              );
              const source = outputAudioCtxRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioCtxRef.current.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('listening');
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setStatus('listening');
            }
          },
          onerror: (e) => {
            console.error('Live Error:', e);
            setError("La conexión se cerró inesperadamente.");
            stopSession();
          },
          onclose: () => {
            console.log("Connection closed");
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'You are James, a patient and friendly English teacher. Help the user practice basic conversation. Use simple words and keep answers short.',
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      });

    } catch (err: any) {
      console.error('Mic/Session Error:', err);
      setError(err.message || "Error al iniciar el micrófono o la sesión.");
      setStatus('idle');
      setIsActive(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
      <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <i className="fas fa-robot"></i> Tutor James (Voz)
          </h2>
          <p className="text-indigo-100 text-sm font-medium">Práctica interactiva en tiempo real</p>
        </div>
        <div>
          {isActive ? (
            <button onClick={stopSession} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-full text-sm font-bold shadow-lg transition-all">
              Terminar
            </button>
          ) : (
            <button 
              onClick={startSession}
              disabled={status === 'connecting'}
              className="bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-2 rounded-full text-sm font-bold shadow-lg disabled:opacity-50 transition-all"
            >
              {status === 'connecting' ? 'Conectando...' : 'Comenzar'}
            </button>
          )}
        </div>
      </div>

      <div className="h-80 overflow-y-auto p-6 bg-slate-50 flex flex-col gap-4">
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl text-xs font-bold border border-red-200">
            <i className="fas fa-exclamation-circle mr-2"></i> {error}
          </div>
        )}
        
        {transcripts.length === 0 && !isActive && !error && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
               <i className="fas fa-microphone-alt text-2xl text-indigo-300"></i>
            </div>
            <p className="text-sm italic text-center max-w-[200px]">Haz clic en 'Comenzar' para hablar con James. Necesita permiso de micrófono.</p>
          </div>
        )}
        
        {transcripts.map((t, i) => (
          <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
              t.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
            }`}>
              <p className="font-bold text-[10px] mb-1 uppercase opacity-70">{t.role === 'user' ? 'Tú' : 'James'}</p>
              {t.text}
            </div>
          </div>
        ))}
        
        {isActive && (
          <div className="mt-auto flex justify-center py-4">
            <div className="flex items-center gap-3 px-5 py-2 bg-indigo-100 text-indigo-700 rounded-full animate-pulse text-xs font-bold uppercase tracking-widest shadow-sm">
              <i className={`fas ${status === 'speaking' ? 'fa-volume-up' : 'fa-microphone'} text-indigo-500`}></i>
              {status === 'speaking' ? 'James está hablando' : 'James te escucha...'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeminiLiveTutor;
