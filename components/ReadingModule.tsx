
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

const ReadingModule: React.FC = () => {
  const [story, setStory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateStory = async (topic: string) => {
    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a very short story (max 50 words) in basic English about: ${topic}. Focus on beginner vocabulary. After the story, list 3 words with translations.`,
      });
      
      const text = response.text;
      if (!text) throw new Error("Respuesta vacía del modelo.");
      setStory(text);
    } catch (err: any) {
      console.error("Reading Module Error:", err);
      setError("Error de conexión. Asegúrate de que la API_KEY esté configurada en Vercel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-3xl text-white shadow-xl">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <i className="fas fa-book-sparkles"></i> Historias IA para Leer
        </h2>
        <p className="text-indigo-100 mb-6 text-sm">Toca un tema y James escribirá una lectura para ti:</p>
        <div className="flex flex-wrap gap-2">
          {['A small cat', 'The red car', 'My family', 'Big city'].map(t => (
            <button 
              key={t} 
              onClick={() => generateStory(t)} 
              disabled={loading}
              className="bg-white/20 hover:bg-white text-white hover:text-indigo-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 active:scale-95 border border-white/10"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center py-16 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">James está escribiendo tu historia...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-200 text-sm text-center animate-shake">
          <i className="fas fa-circle-exclamation text-xl mb-2 block"></i>
          <p className="font-bold">{error}</p>
        </div>
      )}

      {story && !loading && (
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm font-serif text-lg leading-relaxed text-slate-800 whitespace-pre-wrap animate-in zoom-in-95 duration-300">
          {story}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-60">
        {['LingQ', 'Readlang', 'BBC English', 'Levels'].map(name => (
          <div key={name} className="bg-slate-100 p-3 rounded-xl text-center text-[10px] font-bold uppercase text-slate-500 border border-slate-200">
            {name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReadingModule;
