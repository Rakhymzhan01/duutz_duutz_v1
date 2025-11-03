
import React from 'react';
import { Tool } from '../types';

interface ToolCardProps {
  tool: Tool;
  onClick: (tool: Tool) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, onClick }) => {
  return (
    <div 
      onClick={() => onClick(tool)}
      className={`group cursor-pointer p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden transition-all duration-300 ease-in-out transform hover:-translate-y-2 ${tool.tintClass} ${tool.shadowClass} hover:shadow-2xl`}
    >
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
