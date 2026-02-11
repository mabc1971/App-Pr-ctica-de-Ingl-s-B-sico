
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { decode, decodeAudioData } from '../services/audioUtils.ts';

const ListeningModule: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [shadowingText, setShadowingText] = useState<string>('English is easy to learn with practice.');
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [loadingNewPhrase, setLoadingNewPhrase] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const fetchNewPhrase = async () => {
    setLoadingNewPhrase(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Provide a very short English sentence for beginners. Max 6 words. No quotes.',
      });
      setShadowingText(response.text?.trim() || shadowingText);
    } catch (e) {
      console.error(e);
      setError("Error al obtener frase.");
    } finally {
      setLoadingNewPhrase(false);
    }
  };

  const playTTS = async () => {
    if (isPlaying || loadingAudio) return;
    setLoadingAudio(true);
    setError(null);
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: shadowingText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio && audioContextRef.current) {
        const buffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
          setIsPlaying(false);
          fetchNewPhrase();
        };
        setIsPlaying(true);
        source.start(0);
      } else {
        throw new Error("No audio data");
      }
    } catch (err: any) {
      console.error(err);
      setError("Error de audio. Revisa tu API_KEY en Vercel.");
      setIsPlaying(false);
    } finally {
      setLoadingAudio(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">Escucha y Repite</h3>
          <button onClick={fetchNewPhrase} className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest px-3 py-1 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
            {loadingNewPhrase ? '...' : 'Nueva Frase'}
          </button>
        </div>
        
        <div className="bg-slate-50 py-12 px-6 rounded-2xl border-2 border-dashed border-slate-200 text-center mb-8">
           <p className="text-2xl font-serif text-slate-700 italic">"{shadowingText}"</p>
        </div>

        {error && <p className="text-red-500 text-xs text-center mb-4 font-bold">{error}</p>}

        <div className="flex justify-center">
          <button 
            onClick={playTTS}
            disabled={loadingAudio || loadingNewPhrase}
            className={`w-24 h-24 rounded-full shadow-2xl flex items-center justify-center text-3xl transition-all ${
              isPlaying ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-600 text-white hover:scale-105 active:scale-95'
            } disabled:opacity-50`}
          >
            {loadingAudio ? <i className="fas fa-spinner animate-spin"></i> : <i className={`fas ${isPlaying ? 'fa-stop' : 'fa-play'}`}></i>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListeningModule;
