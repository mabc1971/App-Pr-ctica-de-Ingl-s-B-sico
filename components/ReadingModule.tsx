
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
      // Intentamos obtener la clave de ambos nombres posibles
      const apiKey = process.env.API_KEY || (process.env as any).CLAVE_API;
      
      if (!apiKey) {
        throw new Error("La clave de API no se encuentra. En Vercel, asegúrate de que el nombre sea exactamente API_KEY.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a very short story (max 50 words) in simple English for a basic student about: ${topic}. Focus on beginner vocabulary. After the story, list 3 words with Spanish translations.`,
      });
      
      if (!response.text) throw new Error("La IA no devolvió contenido.");
      setStory(response.text);
    } catch (err: any) {
      console.error("Reading Error:", err);
      setError(err.message || "Error al conectar con Gemini.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-8 rounded-3xl text-white shadow-xl">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <i className="fas fa-book-sparkles"></i> Generador de Lecturas
        </h2>
        <p className="text-indigo-100 mb-6 text-sm">Elige un tema para que James escriba una historia corta:</p>
        <div className="flex flex-wrap gap-3">
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
