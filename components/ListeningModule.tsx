
import { GoogleGenAI, Modality } from "@google/genai";
import React, { useState, useRef } from 'react';
import { decode, decodeAudioData } from '../services/audioUtils.ts';

const ListeningModule: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [shadowingText, setShadowingText] = useState<string>('Welcome! Let\'s practice your listening skills.');
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [loadingNew, setLoadingNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const fetchNewPhrase = async () => {
    setLoadingNew(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Give me one very simple English sentence for a beginner. Max 6 words. No quotes.',
      });
      setShadowingText(response.text?.trim() || shadowingText);
    } catch (e) {
      setError("Error al obtener nueva frase. Revisa tu API_KEY.");
    } finally {
      setLoadingNew(false);
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

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: shadowingText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
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
      }
    } catch (err: any) {
      console.error(err);
      setError("Error en la reproducción. Verifica que API_KEY esté bien configurada.");
      setIsPlaying(false);
    } finally {
      setLoadingAudio(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold text-slate-800">Práctica de Escucha Directa</h3>
          <button onClick={fetchNewPhrase} disabled={loadingNew} className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest px-4 py-2 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
            {loadingNew ? '...' : 'Nueva Frase'}
          </button>
        </div>
        
        <div className="bg-slate-50 py-12 px-8 rounded-2xl border-2 border-dashed border-slate-200 text-center mb-8">
          <p className="text-2xl font-serif text-slate-700 italic">"{shadowingText}"</p>
        </div>

        {error && <p className="text-red-600 text-xs text-center mb-6 font-bold bg-red-50 p-3 rounded-xl border border-red-100 animate-shake">{error}</p>}

        <div className="flex justify-center">
          <button 
            onClick={playTTS}
            disabled={loadingAudio || loadingNew}
            className={`w-24 h-24 rounded-full shadow-2xl flex items-center justify-center text-3xl transition-all ${
              isPlaying ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-600 text-white hover:scale-105 active:scale-95 shadow-indigo-200'
            } disabled:opacity-50`}
          >
            {loadingAudio ? <i className="fas fa-circle-notch animate-spin"></i> : <i className={`fas ${isPlaying ? 'fa-stop' : 'fa-play'}`}></i>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListeningModule;
