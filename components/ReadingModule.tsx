
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
        contents: `Write a very short story (max 60 words) in simple English for a beginner student about: ${topic}. After the story, list 3 important words with their Spanish translation.`,
      });
      
      const text = response.text;
      if (!text) throw new Error("La respuesta del modelo está vacía.");
      setStory(text);
    } catch (err: any) {
      console.error("Reading Error:", err);
      setError("Error al conectar con el tutor de lectura. Asegúrate de que la API Key esté configurada.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Generador de Historias IA</h2>
        <p className="text-indigo-100 mb-4 text-sm">Selecciona un tema para generar una lectura personalizada:</p>
        <div className="flex flex-wrap gap-2">
          {['A small cat', 'The red car', 'My family', 'Big city'].map(t => (
            <button 
              key={t} 
              onClick={() => generateStory(t)} 
              disabled={loading}
              className="bg-white/20 hover:bg-white/40 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center py-10 space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">James está escribiendo tu historia...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-sm text-center">
          <i className="fas fa-exclamation-triangle mr-2"></i> {error}
        </div>
      )}

      {story && !loading && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm font-serif text-lg leading-relaxed text-slate-700 whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-4 duration-500">
          {story}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'LingQ', url: 'https://www.lingq.com/' },
          { name: 'Readlang', url: 'https://readlang.com/' },
          { name: 'BBC Learning', url: 'https://www.bbc.co.uk/learningenglish' },
          { name: 'News in Levels', url: 'https://www.newsinlevels.com/' }
        ].map(res => (
          <a key={res.name} href={res.url} target="_blank" rel="noopener noreferrer" className="bg-white p-4 rounded-xl border border-slate-200 text-center text-xs font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-all">
            {res.name} <i className="fas fa-external-link-alt ml-1 text-[8px]"></i>
          </a>
        ))}
      </div>
    </div>
  );
};

export default ReadingModule;
