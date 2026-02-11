
import { GoogleGenAI } from "@google/genai";
import React, { useState } from 'react';

const WritingModule: React.FC = () => {
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkWriting = async () => {
    if (!text.trim() || text.length < 5) return;
    setLoading(true);
    setError(null);
    setFeedback(null);
    
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API_KEY no configurada en Vercel.");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as an English teacher. Correct the following text for a beginner: "${text}". Explain mistakes in Spanish.`,
      });
      
      setFeedback(response.text || "No se recibió feedback.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al conectar con James.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Práctica de Escritura</h3>
        <textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-40 p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          placeholder="Escribe algo en inglés..."
        />
        <button 
          onClick={checkWriting}
          disabled={loading || text.length < 5}
          className="mt-4 w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-3 transition-all shadow-lg"
        >
          {loading ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-magic"></i>}
          Corregir mi texto
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-sm font-bold text-center">
          <i className="fas fa-exclamation-triangle mr-2"></i> {error}
        </div>
      )}

      {feedback && (
        <div className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-md text-slate-700 whitespace-pre-wrap animate-in fade-in">
          <p className="font-bold text-indigo-600 mb-2">James dice:</p>
          {feedback}
        </div>
      )}
    </div>
  );
};

export default WritingModule;
