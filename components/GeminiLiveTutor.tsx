
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { decode, decodeAudioData, createPcmBlob } from '../services/audioUtils';

const GeminiLiveTutor: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [transcripts, setTranscripts] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      // Logic to close session if SDK provides it, otherwise we just stop streams
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (inputAudioCtxRef.current) inputAudioCtxRef.current.close();
    if (outputAudioCtxRef.current) outputAudioCtxRef.current.close();
    
    setIsActive(false);
    setStatus('idle');
  }, []);

  const startSession = async () => {
    try {
      setStatus('connecting');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Connection Opened');
            setIsActive(true);
            setStatus('listening');
            
            const source = inputAudioCtxRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioCtxRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
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
            // Handle Transcription
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscription.current += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
              currentInputTranscription.current += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              const userText = currentInputTranscription.current;
              const modelText = currentOutputTranscription.current;
              if (userText || modelText) {
                setTranscripts(prev => [
                  ...prev, 
                  { role: 'user', text: userText || '(Hablando...)' },
                  { role: 'model', text: modelText || '(Respondiendo...)' }
                ]);
              }
              currentInputTranscription.current = '';
              currentOutputTranscription.current = '';
            }

            // Handle Audio
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
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('listening');
              });
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
            console.error('Gemini Live Error:', e);
            stopSession();
          },
          onclose: () => {
            console.log('Gemini Live Closed');
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'Eres un profesor de inglés nativo y paciente llamado James. Tu objetivo es ayudar al usuario a practicar su inglés básico de forma conversacional. Corrige sus errores de forma amable y mantén la conversación simple pero fluida.',
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to start session', err);
      setStatus('idle');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
      <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <i className="fas fa-robot"></i> Tutor de Voz IA
          </h2>
          <p className="text-indigo-100 text-sm">Practica Speaking en tiempo real con James</p>
        </div>
        <div className="flex items-center gap-3">
          {isActive ? (
            <button 
              onClick={stopSession}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-2"
            >
              <i className="fas fa-stop"></i> Finalizar
            </button>
          ) : (
            <button 
              onClick={startSession}
              disabled={status === 'connecting'}
              className="bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-2 rounded-full font-bold shadow-lg transition-all transform active:scale-95 disabled:opacity-50"
            >
              {status === 'connecting' ? 'Conectando...' : 'Comenzar Práctica'}
            </button>
          )}
        </div>
      </div>

      <div className="h-96 overflow-y-auto p-6 bg-slate-50 flex flex-col gap-4">
        {transcripts.length === 0 && !isActive && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <i className="fas fa-microphone-lines text-5xl mb-4"></i>
            <p className="text-center italic">Presiona "Comenzar" para hablar con tu tutor.</p>
          </div>
        )}
        
        {transcripts.map((t, i) => (
          <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl ${
              t.role === 'user' 
                ? 'bg-indigo-100 text-indigo-900 rounded-tr-none' 
                : 'bg-white shadow-sm border border-slate-200 text-slate-700 rounded-tl-none'
            }`}>
              <p className="text-sm">{t.text}</p>
            </div>
          </div>
        ))}

        {isActive && (
          <div className="flex justify-center mt-auto">
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full animate-pulse border border-indigo-200">
              <i className={`fas ${status === 'speaking' ? 'fa-volume-high' : 'fa-microphone'}`}></i>
              <span className="text-xs font-bold uppercase tracking-wider">
                {status === 'speaking' ? 'James está hablando...' : 'Escuchándote...'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-100 border-t border-slate-200 text-xs text-slate-500 text-center">
        Powered by Gemini 2.5 Native Audio
      </div>
    </div>
  );
};

export default GeminiLiveTutor;
