import React, { useState, useCallback } from 'react';
import ToolCard from './components/ToolCard';
import RequestInput from './components/RequestInput';
import VideoGenerator from './components/VideoGenerator';
import { TOOLS } from './constants';
import { Tool } from './types';

const BackgroundNodes = () => (
  <svg
    className="absolute inset-0 w-full h-full z-0 opacity-20"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" style={{stopColor:'rgb(128,0,128)', stopOpacity:0.5}} />
        <stop offset="100%" style={{stopColor:'rgb(128,0,128)', stopOpacity:0}} />
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="transparent" />
    <g stroke="rgba(192, 132, 252, 0.4)" strokeWidth="1">
      <circle cx="10%" cy="20%" r="2" fill="url(#grad1)" />
      <circle cx="80%" cy="10%" r="3" fill="url(#grad1)" />
      <circle cx="50%" cy="80%" r="4" fill="url(#grad1)" />
      <circle cx="90%" cy="60%" r="2" fill="url(#grad1)" />
      <circle cx="30%" cy="90%" r="3" fill="url(#grad1)" />
      <circle cx="5%" cy="70%" r="2" fill="url(#grad1)" />
      <line x1="10%" y1="20%" x2="80%" y2="10%" />
      <line x1="80%" y1="10%" x2="50%" y2="80%" />
      <line x1="50%" y1="80%" x2="90%" y2="60%" />
      <line x1="90%" y1="60%" x2="30%" y2="90%" />
      <line x1="30%" y1="90%" x2="5%" y2="70%" />
      <line x1="5%" y1="70%" x2="10%" y2="20%" />
    </g>
  </svg>
);

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [page, setPage] = useState<'dashboard' | 'generator'>('dashboard');
  const [prompt, setPrompt] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleCardClick = useCallback((tool: Tool) => {
    setActiveTool(tool);
    setPage('generator');
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setPage('dashboard');
    setActiveTool(null);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-[#0a0328] via-[#1a0c4d] to-[#4c1d95] text-white overflow-hidden">
      <BackgroundNodes />
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
        {page === 'dashboard' ? (
          <>
            <header className="text-center mb-12">
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-300">
                duutz duutz
              </h1>
              <p className="mt-4 text-lg text-purple-200 max-w-2xl mx-auto">
                Your central launchpad for a suite of next-generation AI video tools. Choose a tool below to begin creating.
              </p>
            </header>
            
            <RequestInput
              prompt={prompt}
              setPrompt={setPrompt}
              audioUrl={audioUrl}
              setAudioUrl={setAudioUrl}
            />
            
            <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {TOOLS.map((tool) => (
                <ToolCard key={tool.id} tool={tool} onClick={handleCardClick} />
              ))}
            </div>
          </>
        ) : activeTool ? (
          <VideoGenerator 
            tool={activeTool} 
            initialPrompt={prompt} 
            onBack={handleBackToDashboard} 
          />
        ) : null}
      </main>
    </div>
  );
};

export default App;