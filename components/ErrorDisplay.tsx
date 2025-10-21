import React from 'react';
import { AlertTriangleIcon, XIcon } from './icons';

interface ErrorDisplayProps {
  message: string;
  onClose: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onClose }) => {
  return (
    <div className="bg-red-900/20 border-l-4 border-red-500 text-red-300 p-4 rounded-md mb-6 flex justify-between items-center shadow-lg animate-fade-in-down" role="alert">
      <div className="flex items-center">
        <AlertTriangleIcon className="h-6 w-6 mr-3 text-red-500"/>
        <div>
          <p className="font-bold">Đã xảy ra lỗi</p>
          <p>{message}</p>
        </div>
      </div>
      <button onClick={onClose} className="text-red-400 hover:text-red-200 hover:bg-red-900/30 rounded-full p-1 transition-colors">
        <XIcon className="h-5 w-5" />
      </button>
    </div>
  );
};