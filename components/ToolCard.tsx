
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tool } from '../types';

interface ToolCardProps {
  tool: Tool;
  onClick: (tool: Tool) => void;
  isLocked?: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, onClick, isLocked = false }) => {
  const { t } = useTranslation('tools');
  return (
    <div 
      onClick={() => onClick(tool)}
      className={`group cursor-pointer p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden transition-all duration-300 ease-in-out transform hover:-translate-y-2 ${tool.tintClass} ${tool.shadowClass} hover:shadow-2xl relative ${isLocked ? 'opacity-75' : ''}`}
    >
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-2xl z-10">
          <div className="text-center">
            <svg 
              className="w-8 h-8 text-purple-400 mx-auto mb-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
              />
            </svg>
            <p className="text-purple-200 text-sm font-medium">{t('locked')}</p>
          </div>
        </div>
      )}
      
      <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden border border-white/10">
        <img 
          src={tool.gifSrc} 
          alt={`${tool.title} preview`} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">{tool.title}</h3>
      <p className="text-gray-300 text-sm leading-relaxed">{tool.description}</p>
    </div>
  );
};

export default ToolCard;
