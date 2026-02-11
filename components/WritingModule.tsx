
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

const WritingModule: React.FC = () => {
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkWriting = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analiza el siguiente texto en inglés escrito por un estudiante básico. Proporciona correcciones gramaticales, sugerencias de vocabulario y una explicación breve en español de por qué se hicieron los cambios: \n\n"${text}"`,
        config: {
          systemInstruction: 'Eres un editor experto de inglés. Sé constructivo y educativo.',
        }
      });
      setFeedback(response.text || 'No se pudo obtener feedback.');
    } catch (error) {
      setFeedback('Error al conectar con el tutor de escritura.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <i className="fas fa-pen-nib text-indigo-500"></i> Ejercicio de Escritura
        </h3>
        <p className="text-slate-600 mb-4">Escribe un párrafo corto sobre tus planes para el próximo fin de semana (mínimo 30 palabras):</p>
        <textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          placeholder="E.g. Next weekend, I am going to visit my family..."
        />
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-slate-400">{text.split(/\s+/).filter(x => x).length} palabras</span>
          <button 
            onClick={checkWriting}
            disabled={loading || text.length < 10}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-check"></i>}
            Corregir mi texto
          </button>
        </div>
      </div>

      {feedback && (
        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
            <i className="fas fa-comment-dots"></i> Feedback del Tutor:
          </h4>
          <div className="prose prose-indigo max-w-none text-indigo-800 text-sm whitespace-pre-wrap">
            {feedback}
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingModule;
