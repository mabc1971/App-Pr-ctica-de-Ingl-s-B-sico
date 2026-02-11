
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
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key no encontrada.");
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a 50-word story in basic English about: ${topic}. Then list 3 difficult words with Spanish translation.`,
      });
      setStory(response.text || 'No content returned.');
    } catch (err: any) {
      setError("No se pudo conectar con el generador. Verifica tu conexión.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Generador de Historias IA</h2>
        <div className="flex flex-wrap gap-2">
          {['A small cat', 'The red car', 'My family', 'Big city'].map(t => (
            <button key={t} onClick={() => generateStory(t)} className="bg-white/20 hover:bg-white/40 px-4 py-2 rounded-xl text-sm font-bold transition-all">
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="text-center py-10 text-slate-400 font-medium animate-pulse">Escribiendo historia...</div>}
      
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-sm text-center">{error}</div>}

      {story && !loading && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm font-serif text-lg leading-relaxed text-slate-700 whitespace-pre-wrap">
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
          <a key={res.name} href={res.url} target="_blank" className="bg-white p-4 rounded-xl border border-slate-200 text-center text-xs font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-all">
            {res.name} <i className="fas fa-external-link-alt ml-1 text-[8px]"></i>
          </a>
        ))}
      </div>
    </div>
  );
};

export default ReadingModule;
