
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
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API_KEY no encontrada. Configúrala en Vercel.");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a short story (max 60 words) in simple English for a basic student about: ${topic}. Include a title and 3 vocabulary words with Spanish translation at the end.`,
      });
      
      if (!response.text) throw new Error("La IA no devolvió texto.");
      setStory(response.text);
    } catch (err: any) {
      console.error("Reading Error:", err);
      setError(err.message || "Error al conectar con la IA.");
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

      {loading && <div className="text-center py-10 font-bold text-indigo-600 animate-pulse">James está escribiendo...</div>}
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-sm text-center font-medium">
          <i className="fas fa-exclamation-triangle mr-2"></i> {error}
        </div>
      )}

      {story && !loading && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm font-serif text-lg leading-relaxed text-slate-700 whitespace-pre-wrap animate-in fade-in duration-500">
          {story}
        </div>
      )}
    </div>
  );
};

export default ReadingModule;
