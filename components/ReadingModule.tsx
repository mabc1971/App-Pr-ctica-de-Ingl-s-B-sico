
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

const ReadingModule: React.FC = () => {
  const [story, setStory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateStory = async (topic: string) => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a very short story (max 100 words) in basic English for beginners about the topic: ${topic}. Include a list of 5 key words with their Spanish translation at the end.`,
      });
      setStory(response.text || 'No se pudo generar la historia.');
    } catch (error) {
      setStory('Error al conectar con el generador de historias.');
    } finally {
      setLoading(false);
    }
  };

  const resources = [
    { name: 'LingQ', desc: 'Material real con audios integrados.', icon: 'fa-language', url: 'https://www.lingq.com/en/' },
    { name: 'Beelinguapp', desc: 'Audiolibros e historias bilingües.', icon: 'fa-book-open', url: 'https://beelinguapp.com/' },
    { name: 'Readlang', desc: 'Traduce palabras mientras lees artículos.', icon: 'fa-highlighter', url: 'https://readlang.com/' },
    { name: 'News in Levels', desc: 'Noticias mundiales para cada nivel.', icon: 'fa-newspaper', url: 'https://www.newsinlevels.com/' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-lg mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Generador de Historias Cortas</h2>
            <p className="text-blue-100 mb-6">Elige un tema y Gemini creará una lectura adaptada para tu nivel.</p>
            <div className="flex flex-wrap gap-3">
              {['A Day at the Beach', 'The Secret Forest', 'My Future Robot', 'Traveling to London'].map(topic => (
                <button 
                  key={topic}
                  onClick={() => generateStory(topic)}
                  disabled={loading}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-medium backdrop-blur-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
          <i className="fas fa-book-open-reader absolute -right-4 -bottom-4 text-9xl text-white/10 -rotate-12"></i>
        </div>

        {loading && (
          <div className="flex flex-col items-center py-12 text-slate-400">
            <i className="fas fa-spinner animate-spin text-4xl mb-4 text-indigo-500"></i>
            <p>Escribiendo tu historia personalizada...</p>
          </div>
        )}

        {story && !loading && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 prose prose-slate max-w-none animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6 not-prose">
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Lectura Sugerida</span>
              <button onClick={() => setStory(null)} className="text-slate-400 hover:text-red-500 transition-colors"><i className="fas fa-times"></i></button>
            </div>
            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-serif text-lg">
              {story}
            </div>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-xl font-bold text-slate-800 mb-4 px-2">Plataformas de Lectura Recomendadas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {resources.map(res => (
            <a 
              key={res.name}
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col"
            >
              <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors mb-4">
                <i className={`fas ${res.icon} text-lg`}></i>
              </div>
              <h4 className="font-bold text-slate-900 flex items-center justify-between">
                {res.name}
                <i className="fas fa-external-link-alt text-[10px] text-slate-300 group-hover:text-indigo-400 transition-colors"></i>
              </h4>
              <p className="text-xs text-slate-500 mt-1 flex-1">{res.desc}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ReadingModule;
