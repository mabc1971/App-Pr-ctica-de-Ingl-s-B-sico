
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Flashcard {
  id: number;
  english: string;
  spanish: string;
  example: string;
  category: string;
}

const vocabularyData: Flashcard[] = [
  { id: 1, english: "Achievement", spanish: "Logro", example: "Winning the prize was a great achievement.", category: "Success" },
  { id: 2, english: "Knowledge", spanish: "Conocimiento", example: "She has a vast knowledge of history.", category: "Education" },
  { id: 3, english: "Environment", spanish: "Medio ambiente", example: "We must protect the environment.", category: "Nature" },
  { id: 4, english: "Challenge", spanish: "Desafío", example: "Learning a new language is a challenge.", category: "General" },
  { id: 5, english: "Opportunity", spanish: "Oportunidad", example: "Don't miss this opportunity.", category: "Business" },
  { id: 6, english: "Reliable", spanish: "Confiable", example: "He is a very reliable employee.", category: "Personality" },
  { id: 7, english: "Improvement", spanish: "Mejora", example: "There is always room for improvement.", category: "Growth" },
  { id: 8, english: "Sustainable", spanish: "Sostenible", example: "We need to find sustainable energy sources.", category: "Nature" },
];

const VocabularyModule: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0);

  const currentCard = vocabularyData[currentIndex];

  const handleNext = () => {
    setDirection(1);
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % vocabularyData.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + vocabularyData.length) % vocabularyData.length);
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col items-center py-8">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Tarjetas de Vocabulario</h2>
        <p className="text-slate-500">Expande tu léxico con palabras clave y su pronunciación.</p>
      </div>

      <div className="relative w-full max-w-md h-80 perspective-1000">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={{
              enter: (direction: number) => ({
                x: direction > 0 ? 300 : -300,
                opacity: 0,
                scale: 0.8
              }),
              center: {
                zIndex: 1,
                x: 0,
                opacity: 1,
                scale: 1
              },
              exit: (direction: number) => ({
                zIndex: 0,
                x: direction < 0 ? 300 : -300,
                opacity: 0,
                scale: 0.8
              })
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0 cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <motion.div
              className="w-full h-full relative preserve-3d transition-transform duration-500"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front Side */}
              <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-xl border-2 border-indigo-100 flex flex-col items-center justify-center p-8 text-center">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                  {currentCard.category}
                </span>
                <h3 className="text-4xl font-black text-slate-800 mb-4">{currentCard.english}</h3>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(currentCard.english);
                  }}
                  className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  <i className="fas fa-volume-up text-lg"></i>
                </button>
                <p className="mt-8 text-slate-400 text-sm italic">Toca para ver la traducción</p>
              </div>

              {/* Back Side */}
              <div 
                className="absolute inset-0 backface-hidden bg-indigo-600 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center text-white"
                style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
              >
                <h3 className="text-4xl font-bold mb-4">{currentCard.spanish}</h3>
                <div className="w-12 h-1 px-4 bg-white/30 rounded-full mb-6"></div>
                <p className="text-indigo-100 text-lg italic leading-relaxed">
                  "{currentCard.example}"
                </p>
                <p className="mt-8 text-indigo-200 text-sm">Toca para volver</p>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-8 mt-12">
        <button 
          onClick={handlePrev}
          className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:border-indigo-300 transition-all shadow-sm"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="text-slate-500 font-medium">
          {currentIndex + 1} / {vocabularyData.length}
        </div>
        <button 
          onClick={handleNext}
          className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:border-indigo-300 transition-all shadow-sm"
        >
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>

      <div className="mt-16 w-full max-w-2xl">
        <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <i className="fas fa-list-ul text-indigo-500"></i>
          Lista de Palabras
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {vocabularyData.map((card, idx) => (
            <div 
              key={card.id}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
                setIsFlipped(false);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                currentIndex === idx 
                  ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div>
                <p className="font-bold text-slate-800">{card.english}</p>
                <p className="text-sm text-slate-500">{card.spanish}</p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  speak(card.english);
                }}
                className="text-slate-400 hover:text-indigo-600 transition-colors"
              >
                <i className="fas fa-volume-up"></i>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VocabularyModule;
