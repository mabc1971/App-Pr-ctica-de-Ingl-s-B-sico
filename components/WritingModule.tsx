
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

const WritingModule: React.FC = () => {
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkWriting = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key no configurada.");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Correct the following English text for a basic student and explain errors in Spanish: "${text}"`,
      });
      setFeedback(response.text || 'No feedback available.');
    } catch (err) {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold mb-4">Práctica de Escritura</h3>
        <textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="Write something in English here..."
        />
        <button 
          onClick={checkWriting}
          disabled={loading || text.length < 5}
          className="mt-4 w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-magic"></i>}
          Corregir mi texto
        </button>
      </div>

      {error && <div className="text-center text-red-500 text-sm font-medium">{error}</div>}

      {feedback && (
        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 text-sm text-indigo-900 whitespace-pre-wrap">
          <p className="font-bold mb-2">Sugerencias del Tutor:</p>
          {feedback}
        </div>
      )}
    </div>
  );
};

export default WritingModule;
