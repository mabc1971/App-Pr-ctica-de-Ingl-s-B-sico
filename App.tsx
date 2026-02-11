
import React, { useState } from 'react';
import GeminiLiveTutor from './components/GeminiLiveTutor';
import WritingModule from './components/WritingModule';
import ReadingModule from './components/ReadingModule';
import ListeningModule from './components/ListeningModule';
import { SkillType } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SkillType | 'Dashboard'>( 'Dashboard');

  const SkillCard = ({ title, icon, color, type, desc }: { title: string, icon: string, color: string, type: SkillType, desc: string }) => (
    <button 
      onClick={() => setActiveTab(type)}
      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-1 transition-all text-left group"
    >
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white text-xl mb-4 group-hover:scale-110 transition-transform`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <h3 className="font-bold text-lg text-slate-800">{title}</h3>
      <p className="text-slate-500 text-sm mt-1">{desc}</p>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <nav className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 p-4">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <i className="fas fa-graduation-cap"></i>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Fluentify</span>
        </div>
        
        <div className="space-y-1">
          <NavItem active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} icon="fa-house" label="Dashboard" />
          <div className="pt-4 pb-2 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Habilidades</div>
          <NavItem active={activeTab === SkillType.READING} onClick={() => setActiveTab(SkillType.READING)} icon="fa-book-open" label="Lectura (Reading)" />
          <NavItem active={activeTab === SkillType.LISTENING} onClick={() => setActiveTab(SkillType.LISTENING)} icon="fa-headphones" label="Escucha (Listening)" />
          <NavItem active={activeTab === SkillType.SPEAKING} onClick={() => setActiveTab(SkillType.SPEAKING)} icon="fa-microphone" label="Habla (Speaking)" />
          <NavItem active={activeTab === SkillType.WRITING} onClick={() => setActiveTab(SkillType.WRITING)} icon="fa-pen-clip" label="Escritura (Writing)" />
        </div>

        <div className="mt-auto p-4 bg-slate-800/50 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-slate-400">Progreso Diario</span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full" style={{ width: '45%' }}></div>
          </div>
          <span className="text-[10px] mt-2 block text-slate-500">4 de 9 lecciones hoy</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {activeTab === 'Dashboard' ? '¡Bienvenido, Estudiante!' : activeTab}
            </h1>
            <p className="text-slate-500">
              {activeTab === 'Dashboard' 
                ? '¿Qué habilidad quieres practicar hoy?' 
                : `Domina el inglés con ejercicios de ${activeTab.toLowerCase()}.`}
            </p>
          </div>
          <div className="flex gap-4">
             <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-white transition-colors">
               <i className="far fa-bell text-slate-600"></i>
             </button>
             <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
               <img src="https://picsum.photos/40/40?seed=student" alt="Avatar" className="rounded-full" />
             </div>
          </div>
        </header>

        {activeTab === 'Dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SkillCard 
              title="Lectura" 
              icon="fa-book-open" 
              color="bg-blue-500" 
              type={SkillType.READING}
              desc="Historias y artículos para mejorar comprensión." 
            />
            <SkillCard 
              title="Escucha" 
              icon="fa-headphones" 
              color="bg-purple-500" 
              type={SkillType.LISTENING}
              desc="Podcasts y audios con transcripciones." 
            />
            <SkillCard 
              title="Habla" 
              icon="fa-microphone" 
              color="bg-pink-500" 
              type={SkillType.SPEAKING}
              desc="Conversación IA en tiempo real." 
            />
            <SkillCard 
              title="Escritura" 
              icon="fa-pen-clip" 
              color="bg-orange-500" 
              type={SkillType.WRITING}
              desc="Correcciones inteligentes por IA." 
            />

            <div className="md:col-span-2 lg:col-span-3 mt-4">
              <div className="bg-indigo-600 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                <div className="relative z-10 flex-1">
                  <h2 className="text-3xl font-bold mb-3">Reto del Día</h2>
                  <p className="text-indigo-100 mb-6 text-lg">Practica "Shadowing" con un podcast sobre tecnología por 5 minutos.</p>
                  <button onClick={() => setActiveTab(SkillType.LISTENING)} className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-lg">
                    Comenzar Ahora
                  </button>
                </div>
                <div className="relative z-10 hidden md:block">
                  <i className="fas fa-rocket text-[120px] text-indigo-400/30 -rotate-12"></i>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 lg:col-span-1 mt-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full">
                <h3 className="font-bold text-slate-800 mb-4">Recursos Sugeridos</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 text-red-600 rounded flex items-center justify-center text-xs">YT</div>
                    <span className="text-sm font-medium">Easy Spanish</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-xs">PC</div>
                    <span className="text-sm font-medium">News in Slow Spanish</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded flex items-center justify-center text-xs">WB</div>
                    <span className="text-sm font-medium">Centro Cervantes</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === SkillType.READING && (
          <div className="max-w-5xl mx-auto">
            <ReadingModule />
          </div>
        )}

        {activeTab === SkillType.LISTENING && (
          <div className="max-w-5xl mx-auto">
            <ListeningModule />
          </div>
        )}

        {activeTab === SkillType.SPEAKING && (
          <div className="max-w-4xl mx-auto">
            <GeminiLiveTutor />
            <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <h3 className="font-bold text-lg mb-4">Ejercicios de Vocalización</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                     <p className="text-xs text-indigo-500 font-bold mb-1 uppercase">Trabalenguas #1</p>
                     <p className="italic text-slate-700 font-medium">"I scream, you scream, we all scream for ice cream!"</p>
                  </div>
                  <div className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                     <p className="text-xs text-indigo-500 font-bold mb-1 uppercase">Práctica de Fonemas /th/</p>
                     <p className="italic text-slate-700 font-medium">"Think of three things through Thursday."</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === SkillType.WRITING && (
          <div className="max-w-4xl mx-auto">
            <WritingModule />
          </div>
        )}
      </main>
    </div>
  );
};

const NavItem = ({ active, icon, label, onClick }: { active: boolean, icon: string, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
        : 'hover:bg-slate-800 text-slate-400 hover:text-white'
    }`}
  >
    <i className={`fas ${icon} w-5 text-center`}></i>
    <span className="font-medium">{label}</span>
  </button>
);

export default App;
