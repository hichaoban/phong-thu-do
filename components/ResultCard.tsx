import React, { useState, useEffect } from 'react';
import { ImageIcon, SpinnerIcon, DownloadIcon } from './icons';

interface ResultCardProps {
  title: string;
  imageUrl: string | string[] | null;
  isLoading: boolean;
  placeholderText: string;
  aspectRatio?: 'default' | 'video';
}

export const ResultCard: React.FC<ResultCardProps> = ({
  title,
  imageUrl,
  isLoading,
  placeholderText,
  aspectRatio = 'default',
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (Array.isArray(imageUrl) && imageUrl.length > 0) {
      setSelectedImage(imageUrl[0]);
    } else if (typeof imageUrl === 'string') {
      setSelectedImage(imageUrl);
    } else {
      setSelectedImage(null);
    }
  }, [imageUrl]);

  const handleDownload = () => {
    if (!selectedImage) return;
    const link = document.createElement('a');
    link.href = selectedImage;
    
    try {
      const mimeType = selectedImage.split(';')[0].split(':')[1];
      const extension = mimeType.split('/')[1] || 'png';
      link.download = `ket-qua-thu-do-${Date.now()}.${extension}`;
    } catch (e) {
      link.download = `ket-qua-thu-do-${Date.now()}.png`;
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
    
  const isGallery = Array.isArray(imageUrl) && imageUrl.length > 1;

  return (
    <div className="bg-slate-800 rounded-2xl shadow-lg overflow-hidden flex flex-col h-full border border-slate-700">
      <div className="p-5 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-100">{title}</h3>
        {selectedImage && !isLoading && (
            <button 
                onClick={handleDownload}
                className="p-2 rounded-full text-gray-400 hover:bg-slate-700 hover:text-cyan-400 transition-colors"
                aria-label="Tải ảnh về"
                title="Tải ảnh về"
            >
                <DownloadIcon className="w-5 h-5" />
            </button>
        )}
      </div>
      <div className="p-5 flex-grow flex flex-col">
        <div className={`w-full ${aspectRatio === 'video' ? 'aspect-video' : 'aspect-[3/4]'} border border-slate-700 rounded-lg flex items-center justify-center text-center text-gray-500 bg-slate-900 relative ${isGallery ? 'mb-4' : ''}`}>
          {isLoading && (
            <div className="absolute inset-0 bg-slate-800/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
              <div className="flex flex-col items-center text-cyan-400">
                <SpinnerIcon className="w-12 h-12 animate-spin" />
                <span className="mt-4 font-semibold">{title === 'Kết quả Cuối cùng' ? 'AI đang tạo các lựa chọn...' : 'AI đang xử lý...'}</span>
              </div>
            </div>
          )}
          {selectedImage ? (
            <img src={selectedImage} alt="Generated result" className="w-full h-full object-contain rounded-md" />
          ) : (
            !isLoading && (
              <div className="flex flex-col items-center">
                <ImageIcon className="w-10 h-10 mb-2 text-gray-600" />
                <span>{placeholderText}</span>
              </div>
            )
          )}
        </div>
        {isGallery && !isLoading && imageUrl.length > 0 && (
          <div>
            <p className="text-sm text-gray-400 mb-2 text-center">Chọn một kiểu dáng bạn thích:</p>
            <div className="grid grid-cols-5 gap-2">
              {imageUrl.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(img)}
                  className={`aspect-square rounded-md overflow-hidden ring-2 transition-all duration-200 ${selectedImage === img ? 'ring-cyan-500 shadow-lg shadow-cyan-500/20' : 'ring-transparent hover:ring-cyan-500/50'}`}
                  aria-label={`Chọn kiểu dáng ${index + 1}`}
                >
                  <img src={img} alt={`Kết quả ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
