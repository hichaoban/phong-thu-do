import React, { useState, useCallback, useRef } from 'react';
import type { ImageFile } from '../types';
import { fileToImageFile } from '../utils/imageUtils';
import { UploadIcon, SpinnerIcon } from './icons';

interface ImageUploadCardProps {
  id: string;
  title: string;
  stepText: string;
  buttonText?: string;
  onImageUpload: (file: ImageFile | null) => void;
  onActionClick?: () => void;
  isLoading?: boolean;
  isActionButtonDisabled?: boolean;
}

export const ImageUploadCard: React.FC<ImageUploadCardProps> = ({
  id,
  title,
  stepText,
  buttonText,
  onImageUpload,
  onActionClick,
  isLoading = false,
  isActionButtonDisabled = false,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const imageFile = await fileToImageFile(file);
        setPreviewUrl(imageFile.url);
        onImageUpload(imageFile);
      } catch (error) {
        console.error("Error processing file:", error);
        setPreviewUrl(null);
        onImageUpload(null);
      }
    } else {
        setPreviewUrl(null);
        onImageUpload(null);
    }
    // Reset file input value to allow re-uploading the same file
    if (event.target) {
        event.target.value = '';
    }
  }, [onImageUpload]);

  const handleAreaClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-slate-800 rounded-2xl shadow-lg overflow-hidden flex flex-col h-full transform transition-all duration-300 hover:shadow-cyan-500/10 border border-slate-700">
      <div className="p-5 border-b border-slate-700">
        <h3 className="text-xl font-bold text-gray-100">{title}</h3>
        <p className="text-sm text-gray-400 mt-1">{stepText}</p>
      </div>
      <div className="p-5 flex-grow">
        <div
          onClick={handleAreaClick}
          onDrop={(e) => { e.preventDefault(); handleFileChange({ target: e.dataTransfer } as any); }}
          onDragOver={(e) => e.preventDefault()}
          className="w-full aspect-[3/4] border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center text-center text-gray-400 cursor-pointer bg-slate-900 hover:bg-slate-700 hover:border-cyan-500 transition-colors"
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-md" />
          ) : (
            <div className="flex flex-col items-center p-4">
              <UploadIcon className="w-10 h-10 mb-2 text-gray-500" />
              <span>Nhấn hoặc kéo thả ảnh</span>
            </div>
          )}
          <input
            id={id}
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
      {onActionClick && buttonText && (
        <div className="p-5 bg-slate-800/50">
            <button
            onClick={onActionClick}
            disabled={isActionButtonDisabled || isLoading}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center hover:from-teal-600 hover:to-cyan-600 focus:outline-none focus:ring-4 focus:ring-cyan-300/50 disabled:bg-gray-500 disabled:bg-none disabled:cursor-not-allowed transition-all duration-300"
            >
            {isLoading && <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />}
            {buttonText}
            </button>
        </div>
      )}
    </div>
  );
};