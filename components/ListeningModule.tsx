
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { decode, decodeAudioData } from '../services/audioUtils.ts';

const ListeningModule: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [shadowingText, setShadowingText] = useState<string>('English is fun to learn with AI tutors.');
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [loadingNewPhrase, setLoadingNewPhrase] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const fetchNewPhrase = async () => {
    setLoadingNewPhrase(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Generate a single short, natural sentence in basic English for a student to practice speaking (shadowing). Maximum 10 words.',
      });
      const newPhrase = response.text?.trim().replace(/^["']|["']$/g, '') || shadowingText;
      setShadowingText(newPhrase);
    } catch (error) {
      console.error('Error fetching new phrase:', error);
    } finally {
      setLoadingNewPhrase(false);
    }
  };

  const playTTS = async (text: string) => {
    if (isPlaying) return;
    setLoadingAudio(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const buffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
          setIsPlaying(false);
          // Cambiar frase automáticamente después de escuchar para incentivar la práctica
          fetchNewPhrase();
        };
        setIsPlaying(true);
        source.start();
      }
    } catch (error) {
      console.error('Error in TTS:', error);
      setIsPlaying(false);
    } finally {
      setLoadingAudio(false);
    }
  };

  const podcasts = [
    { title: 'News in Slow English', type: 'Initial/Intermediate', link: 'https://www.newsinslowenglish.com/' },
    { title: '6 Minute English (BBC)', type: 'Advanced/Practical', link: 'https://www.bbc.co.uk/learningenglish/english/features/6-minute-english' },
    { title: 'Coffee Break English', type: 'Structured Lessons', link: 'https://coffeebreaklanguages.com/coffeebreakenglish/' },
  ];

  const youtubeChannels = [
    { 
      name: 'Easy English', 
      desc: 'Entrevistas reales en la calle con subtítulos claros.', 
      color: 'bg-red-500', 
      url: 'https://www.youtube.com/@EasyEnglishLearning' 
    },
    { 
      name: 'Butterfly English', 
      desc: 'Clases estructuradas de gramática y vocabulario.', 
      color: 'bg-orange-500', 
      url: 'https://www.youtube.com/@ButterflyEnglish' 
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Shadowing Exercise */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <i className="fas fa-ghost text-indigo-500"></i> Práctica de Shadowing
            </h3>
            <button 
              onClick={fetchNewPhrase}
              disabled={loadingNewPhrase || isPlaying}
              className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <i className={`fas fa-arrows-rotate ${loadingNewPhrase ? 'animate-spin' : ''}`}></i>
              Cambiar Frase
            </button>
          </div>
          <p className="text-slate-600 text-sm mb-6">
            Presiona <strong>Play</strong> para escuchar y repetir. La frase cambiará automáticamente al terminar.
          </p>
          
          <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300 mb-6 flex-1 flex items-center justify-center min-h-[120px]">
             {loadingNewPhrase ? (
               <div className="flex items-center gap-2 text-indigo-500">
                 <i className="fas fa-circle-notch animate-spin"></i>
                 <span className="font-medium">Generando frase...</span>
               </div>
             ) : (
               <div className="text-xl md:text-2xl font-medium text-slate-700 italic text-center px-4">
                 "{shadowingText}"
               </div>
             )}
          </div>

          <div className="flex justify-center gap-4">
            <button 
              onClick={() => playTTS(shadowingText)}
              disabled={isPlaying || loadingAudio || loadingNewPhrase}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl shadow-indigo-200 ${
                isPlaying ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
              } disabled:opacity-50`}
            >
              {loadingAudio ? (
                <i className="fas fa-spinner animate-spin text-2xl"></i>
              ) : (
                <i className={`fas ${isPlaying ? 'fa-stop' : 'fa-play'} text-2xl`}></i>
              )}
            </button>
          </div>
        </div>

        {/* Podcasts Section */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white flex flex-col">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-indigo-300">
            <i className="fas fa-podcast"></i> Podcasts Reales
          </h3>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {podcasts.map(p => (
              <a 
                key={p.title} 
                href={p.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-4 bg-white/10 rounded-xl hover:bg-white/20 border border-transparent hover:border-indigo-500/50 transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="font-bold text-sm">{p.title}</p>
                  <p className="text-[10px] text-indigo-300 uppercase tracking-widest">{p.type}</p>
                </div>
                <i className="fas fa-external-link-alt text-xs opacity-60 group-hover:opacity-100 group-hover:text-indigo-400 transition-all"></i>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* YouTube Section */}
      <section>
        <h3 className="text-xl font-bold text-slate-800 mb-4 px-2">Audiovisuales (YouTube)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {youtubeChannels.map(yt => (
            <a 
              key={yt.name} 
              href={yt.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-6 hover:shadow-md hover:border-indigo-200 transition-all group"
            >
               <div className={`w-16 h-16 ${yt.color} rounded-2xl flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform shadow-lg`}>
                 <i className="fab fa-youtube"></i>
               </div>
               <div className="flex-1">
                 <h4 className="font-bold text-slate-900 flex items-center gap-2">
                   {yt.name}
                   <i className="fas fa-external-link-alt text-[10px] text-slate-300"></i>
                 </h4>
                 <p className="text-sm text-slate-500 line-clamp-2">{yt.desc}</p>
                 <span className="mt-2 text-xs font-bold text-indigo-600 block group-hover:translate-x-1 transition-transform">Visitar canal oficial <i className="fas fa-chevron-right text-[8px]"></i></span>
               </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ListeningModule;
