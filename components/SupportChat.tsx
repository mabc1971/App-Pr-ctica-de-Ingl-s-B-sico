
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { getGeminiApiKey } from '../services/apiConfig.ts';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const SupportChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: '¡Hola! Soy el asistente de la Academia Fluentify. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', text: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const apiKey = getGeminiApiKey();
      
      if (!apiKey) {
        setMessages(prev => [...prev, { role: 'model', text: 'Error: API Key no configurada. Por favor, asegúrate de configurar tu API Key en Vercel como GEMINI_API_KEY o en la sección de Habla (Speaking).' }]);
        setIsLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Convert our messages to the format expected by the SDK
      // The first message is our welcome message, we should probably skip it or handle it carefully
      // Actually, the SDK history expects alternating user/model turns starting with user usually, 
      // but we can just pass the relevant history.
      const history = messages.slice(1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const chat = ai.chats.create({
        model: "gemini-3-flash-preview", 
        history: history,
        config: {
          systemInstruction: `Eres el Asistente Virtual Inteligente de la "Academia de inglés Fluentify". 
          Tu propósito es proporcionar información precisa, lógica y coherente sobre el funcionamiento de la academia.
          
          CONOCIMIENTO BASE (Única fuente de verdad):
          - Nombre: Academia de inglés Fluentify.
          - Misión: Enseñar inglés mediante tecnología de Inteligencia Artificial de vanguardia.
          - Funcionamiento: Los estudiantes practican las 4 habilidades (Speaking, Listening, Reading, Writing) a través de módulos interactivos con IA.
          - Tutor de Voz (James): Un sistema de voz en tiempo real que permite practicar conversación natural.
          - Cursos: Ofrecemos niveles Básico, Intermedio y Avanzado.
          - Horarios: Acceso ilimitado 24 horas al día, 7 días a la semana. Es una plataforma 100% digital y online.
          - Precios: 
            * Plan Mensual: $29 USD al mes.
            * Plan Anual: $249 USD al año (ahorro significativo).
          - Soporte: Chat de ayuda integrado (tú).
          
          REGLAS DE COMPORTAMIENTO:
          1. NO INVENTES información. Si no está en el CONOCIMIENTO BASE, di que no tienes esa información específica pero que pueden contactar a soporte técnico.
          2. MANTÉN LA COHERENCIA: Si el usuario envía mensajes cortos, números o frases ambiguas, pide aclaración educadamente basándote en el contexto de la conversación.
          3. FOCO EXCLUSIVO: Solo respondes sobre la Academia Fluentify. Si preguntan sobre otros temas (clima, política, otros idiomas, etc.), declina amablemente explicando tu función.
          4. TONO: Profesional, servicial, claro y motivador.
          5. IDIOMA: Responde siempre en español, a menos que el usuario te pida practicar una frase específica en inglés relacionada con la academia.`,
        },
      });

      const response = await chat.sendMessage({ message: userMessage });
      setMessages(prev => [...prev, { role: 'model', text: response.text || 'No pude procesar tu solicitud.' }]);
    } catch (error: any) {
      console.error("Chat error:", error);
      let errorMsg = 'Lo siento, hubo un error al procesar tu mensaje.';
      if (error?.message?.includes('API_KEY_INVALID')) {
        errorMsg = 'Tu API Key parece ser inválida. Por favor, revísala.';
      }
      setMessages(prev => [...prev, { role: 'model', text: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white w-80 md:w-96 h-[500px] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
                  <i className="fas fa-robot"></i>
                </div>
                <div>
                  <h3 className="font-bold text-sm">Soporte Fluentify</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-indigo-100 font-medium">En línea</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
            >
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' 
                        : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Escribe tu duda..."
                  className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isLoading}
                  className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-slate-800 rotate-90' : 'bg-indigo-600'
        }`}
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-comment-dots'} text-xl`}></i>
      </button>
    </div>
  );
};

export default SupportChat;
