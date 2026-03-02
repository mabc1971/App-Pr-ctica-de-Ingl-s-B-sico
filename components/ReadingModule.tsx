
import { GoogleGenAI } from "@google/genai";
import React, { useState } from 'react';

const ReadingModule: React.FC = () => {
  const [story, setStory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateStory = async (topic: string) => {
    setLoading(true);
    setError(null);
    try {
      const getApiKey = () => {
        const win = window as any;
        return win.process?.env?.GEMINI_API_KEY || 
               win.process?.env?.API_KEY || 
               process.env.GEMINI_API_KEY || 
               process.env.API_KEY;
      };

      const apiKey = getApiKey();
      if (!apiKey) throw new Error("API Key no configurada. Por favor, configúrala en la sección de Habla.");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a very short story (max 50 words) in simple English for a basic student about: ${topic}. Focus on beginner vocabulary. After the story, list 3 words with Spanish translations.`,
      });
      
      setStory(response.text);
    } catch (err: any) {
      console.error("Reading Error:", err);
      setError(err.message || "Error al generar la historia.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <i className="fas fa-book-sparkles text-indigo-600"></i> Generador de Lecturas
        </h2>
        <p className="text-slate-500 mb-6 text-sm">Elige un tema para que James escriba una historia corta:</p>
        <div className="flex flex-wrap gap-3">
          {['A small cat', 'The red car', 'My family', 'Big city'].map(t => (
            <button 
              key={t} 
              onClick={() => generateStory(t)} 
              disabled={loading}
              className="bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 active:scale-95 border border-indigo-100"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center py-16">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-bold animate-pulse">James está escribiendo...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-200 text-sm text-center animate-shake shadow-sm">
          <i className="fas fa-exclamation-circle text-2xl mb-2 block"></i>
          <p className="font-bold">{error}</p>
        </div>
      )}

      {story && !loading && (
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm font-serif text-lg leading-relaxed text-slate-800 whitespace-pre-wrap animate-in fade-in zoom-in-95 duration-300">
          {story}
        </div>
      )}
    </div>
  );
};

export default ReadingModule;
