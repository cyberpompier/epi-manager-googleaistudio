import React, { useState } from 'react';
import { ChatIcon, ImageIcon, MicIcon } from './components/Icons';
import { ChatTab } from './components/ChatTab';
import { ImageTab } from './components/ImageTab';
import { LiveTab } from './components/LiveTab';
import { AppMode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);

  const renderContent = () => {
    switch (mode) {
      case AppMode.CHAT:
        return <ChatTab />;
      case AppMode.IMAGE:
        return <ImageTab />;
      case AppMode.LIVE:
        return <LiveTab />;
      default:
        return <ChatTab />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-brand-500/30">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col items-center lg:items-stretch py-6 z-20">
        <div className="mb-8 px-4 flex items-center justify-center lg:justify-start gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg shadow-lg shadow-brand-500/20 flex-shrink-0"></div>
          <h1 className="hidden lg:block text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            OmniAssist
          </h1>
        </div>

        <nav className="flex-1 space-y-2 px-2">
          <SidebarItem 
            active={mode === AppMode.CHAT} 
            onClick={() => setMode(AppMode.CHAT)} 
            icon={<ChatIcon className="w-6 h-6" />} 
            label="Chat" 
          />
          <SidebarItem 
            active={mode === AppMode.IMAGE} 
            onClick={() => setMode(AppMode.IMAGE)} 
            icon={<ImageIcon className="w-6 h-6" />} 
            label="Imagine" 
          />
          <SidebarItem 
            active={mode === AppMode.LIVE} 
            onClick={() => setMode(AppMode.LIVE)} 
            icon={<MicIcon className="w-6 h-6" />} 
            label="Live" 
          />
        </nav>

        <div className="mt-auto px-4 hidden lg:block">
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 text-xs text-slate-400">
            <p className="font-semibold text-slate-300 mb-1">Gemini 2.5 Active</p>
            <p>Powered by Google GenAI SDK</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col bg-slate-950">
        {/* Background gradient effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-brand-600/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[10%] right-[5%] w-[30%] h-[30%] bg-blue-600/5 rounded-full blur-[100px]"></div>
        </div>

        {/* Header (Mobile only branding) */}
        <header className="lg:hidden h-16 border-b border-slate-800 flex items-center px-6 bg-slate-900/80 backdrop-blur-md z-10">
           <div className="w-6 h-6 bg-gradient-to-br from-brand-400 to-brand-600 rounded-md mr-3"></div>
           <span className="font-bold text-lg">OmniAssist</span>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative z-0 flex flex-col">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

interface SidebarItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
    }`}
  >
    <div className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`}>
      {icon}
    </div>
    <span className="hidden lg:block font-medium">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full hidden lg:block"></div>}
  </button>
);

export default App;