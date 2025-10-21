import React from 'react';
import { MagicWandIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-800/80 backdrop-blur-lg sticky top-0 z-50 shadow-sm border-b border-slate-700">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-center">
        <MagicWandIcon className="w-8 h-8 text-cyan-500 mr-3" />
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
          Phòng Thử Đồ AI
        </h1>
      </div>
    </header>
  );
};