import React from 'react';
import { Briefcase, Trash2 } from 'lucide-react';

interface HeaderProps {
  onClearChat: () => void;
}

const Header: React.FC<HeaderProps> = ({ onClearChat }) => {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 shadow-sm z-10 sticky top-0">
      <div className="flex items-center gap-2.5">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-500 p-2 rounded-lg text-white shadow-md">
          <Briefcase size={20} />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 text-lg leading-tight">BizInsight AI</h1>
          <p className="text-xs text-gray-500 hidden sm:block">Professional Business Intelligence</p>
        </div>
      </div>
      
      <button 
        onClick={onClearChat}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
        title="Clear conversation"
      >
        <Trash2 size={16} />
        <span className="hidden sm:inline">Clear Chat</span>
      </button>
    </header>
  );
};

export default Header;