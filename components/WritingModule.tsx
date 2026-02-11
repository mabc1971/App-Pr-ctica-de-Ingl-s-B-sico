
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

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
      if (!apiKey) throw new Error("API Key no configurada.");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as an English teacher. Correct the following short text for a basic student. First, provide the corrected version, then explain the grammar mistakes in Spanish: "${text}"`,
      });
      
      const resultText = response.text;
      if (!resultText) throw new Error("No se recibió respuesta del tutor.");
      setFeedback(resultText);
    } catch (err: any) {
      console.error("Writing Error:", err);
      setError("Error al conectar con el tutor de escritura. Verifica tu conexión e inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">Práctica de Escritura</h3>
          <span className="text-[10px] font-bold text-indigo-500 uppercase bg-indigo-50 px-2 py-1 rounded">IA Correction</span>
        </div>
        <textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-40 p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-slate-700 font-medium"
          placeholder="Escribe algo en inglés aquí (ej: 'I is learning English today')..."
        />
        <button 
          onClick={checkWriting}
          disabled={loading || text.length < 5}
          className="mt-4 w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-200"
        >
          {loading ? (
            <>
              <i className="fas fa-circle-notch animate-spin"></i>
              James está revisando...
            </>
          ) : (
            <>
              <i className="fas fa-magic"></i>
              Corregir mi texto
            </>
          )}
        </button>
        <p className="text-[10px] text-slate-400 mt-3 text-center">Escribe al menos 5 caracteres para habilitar la corrección.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-sm font-medium text-center animate-shake">
          <i className="fas fa-exclamation-triangle mr-2"></i> {error}
        </div>
      )}

      {feedback && (
        <div className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-md text-slate-700 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2 mb-4 text-indigo-600">
            <i className="fas fa-comment-dots"></i>
            <p className="font-bold text-sm uppercase tracking-wider">Feedback de James:</p>
          </div>
          <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-wrap">
            {feedback}
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingModule;
