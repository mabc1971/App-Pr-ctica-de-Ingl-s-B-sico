
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act like a patient English teacher. Correct the grammar and spelling of this text for a basic student: "${text}". Then, explain the corrections in Spanish.`,
      });
      
      setFeedback(response.text);
    } catch (err: any) {
      console.error(err);
      setError("Error al conectar con el tutor. Revisa la variable API_KEY en Vercel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Práctica de Escritura</h3>
        <textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-48 p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-700 font-medium leading-relaxed"
          placeholder="Escribe tu mensaje en inglés aquí para que James lo corrija..."
        />
        <button 
          onClick={checkWriting}
          disabled={loading || text.length < 5}
          className="mt-6 w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-100"
        >
          {loading ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-magic"></i>}
          {loading ? 'Revisando texto...' : 'Corregir mi texto'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-5 rounded-2xl border border-red-100 text-sm font-bold text-center animate-shake">
          <i className="fas fa-exclamation-triangle mr-2"></i> {error}
        </div>
      )}

      {feedback && (
        <div className="bg-white p-10 rounded-3xl border border-indigo-100 shadow-lg text-slate-700 whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
               <i className="fas fa-comment-dots"></i>
            </div>
            <p className="font-bold text-indigo-600 text-sm uppercase tracking-widest">Feedback de James:</p>
          </div>
          <div className="prose prose-indigo max-w-none">
            {feedback}
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingModule;
