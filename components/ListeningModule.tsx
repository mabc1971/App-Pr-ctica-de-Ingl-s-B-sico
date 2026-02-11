
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { decode, decodeAudioData } from '../services/audioUtils.ts';

const ListeningModule: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [shadowingText, setShadowingText] = useState<string>('Welcome! Let\'s practice your listening skills today.');
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
        contents: 'Generate one short, simple, and natural English sentence for a basic student. Maximum 8 words. No quotes.',
      });
      const newText = response.text?.trim() || shadowingText;
      setShadowingText(newText);
    } catch (e) {
      console.error("Fetch Phrase Error:", e);
      setError("No se pudo obtener una nueva frase.");
    } finally {
      setLoadingNewPhrase(false);
    }
  };

  const playTTS = async () => {
    if (isPlaying || loadingAudio) return;
    setLoadingAudio(true);
    setError(null);
    
    try {
      // Inicializar o reanudar AudioContext
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
          speechConfig: { 
            voiceConfig: { 
              prebuiltVoiceConfig: { voiceName: 'Kore' } 
            } 
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio && audioContextRef.current) {
        const audioData = decode(base64Audio);
        const buffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
          setIsPlaying(false);
          // Automáticamente traer una nueva frase para mantener el ritmo
          fetchNewPhrase();
        };
        
        setIsPlaying(true);
        source.start(0);
      } else {
        throw new Error("No se recibió data de audio.");
      }
    } catch (error: any) {
      console.error('TTS Playback Error:', error);
      setError("Error al reproducir audio. Verifica la API Key y tu conexión.");
      setIsPlaying(false);
    } finally {
      setLoadingAudio(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">Práctica de Escucha Directa</h3>
          <button 
            onClick={fetchNewPhrase} 
            disabled={loadingNewPhrase || isPlaying}
            className="text-xs font-bold text-indigo-600 uppercase tracking-widest hover:underline disabled:opacity-30 transition-all"
          >
            {loadingNewPhrase ? <i className="fas fa-sync animate-spin"></i> : 'Nueva Frase'}
          </button>
        </div>
        
        <div className="bg-slate-50 py-10 px-6 rounded-2xl border-2 border-dashed border-slate-200 text-center mb-8">
          {loadingNewPhrase ? (
            <div className="h-8 bg-slate-200 rounded animate-pulse w-3/4 mx-auto"></div>
          ) : (
            <p className="text-2xl font-serif text-slate-700 italic">"{shadowingText}"</p>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-xs text-center mb-4 font-medium">{error}</p>
        )}

        <div className="flex justify-center">
          <button 
            onClick={playTTS}
            disabled={loadingAudio || loadingNewPhrase}
            className={`w-20 h-20 rounded-full shadow-xl flex items-center justify-center text-2xl transition-all ${
              isPlaying ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-600 text-white hover:scale-105 active:scale-95'
            } disabled:opacity-50`}
            title="Escuchar y practicar"
          >
            {loadingAudio ? <i className="fas fa-circle-notch animate-spin"></i> : <i className={`fas ${isPlaying ? 'fa-stop' : 'fa-play'}`}></i>}
          </button>
        </div>
        <p className="text-center text-slate-400 text-xs mt-6">
          <i className="fas fa-info-circle mr-1"></i> 
          Al terminar de escuchar, James te dará una frase nueva automáticamente.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="https://www.newsinslowenglish.com/" target="_blank" rel="noopener noreferrer" className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center gap-4 hover:border-indigo-300 transition-all group">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
            <i className="fas fa-podcast"></i>
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">News in Slow English</p>
            <p className="text-xs text-slate-500">Noticias a ritmo pausado.</p>
          </div>
        </a>
        <a href="https://www.youtube.com/@EasyEnglishLearning" target="_blank" rel="noopener noreferrer" className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center gap-4 hover:border-red-300 transition-all group">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-xl group-hover:bg-red-600 group-hover:text-white transition-all">
            <i className="fab fa-youtube"></i>
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">Easy English YouTube</p>
            <p className="text-xs text-slate-500">Entrevistas reales subtituladas.</p>
          </div>
        </a>
      </div>
    </div>
  );
};

export default ListeningModule;
