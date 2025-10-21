import React, { useState, useCallback } from 'react';
import { ImageUploadCard } from './components/ImageUploadCard';
import { ResultCard } from './components/ResultCard';
import { Header } from './components/Header';
import { extractClothing, virtualTryOn } from './services/geminiService';
import type { ImageFile } from './types';
import { ErrorDisplay } from './components/ErrorDisplay';
import { GlobeIcon, SpinnerIcon } from './components/icons';

type Mode = 'extract' | 'direct';

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('extract');

  // 'extract' flow state
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [clothingImage, setClothingImage] = useState<string | null>(null);

  // 'direct' flow state
  const [productImage, setProductImage] = useState<ImageFile | null>(null);

  // Common state
  const [modelImage, setModelImage] = useState<ImageFile | null>(null);
  const [contextPrompt, setContextPrompt] = useState('');
  const [finalImages, setFinalImages] = useState<string[] | null>(null);

  const [isExtracting, setIsExtracting] = useState(false);
  const [isTryingOn, setIsTryingOn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtractClothing = useCallback(async () => {
    if (!originalImage) return;

    setIsExtracting(true);
    setError(null);
    setClothingImage(null);

    try {
      const result = await extractClothing(originalImage);
      setClothingImage(result);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Đã xảy ra lỗi không xác định khi tách trang phục.');
    } finally {
      setIsExtracting(false);
    }
  }, [originalImage]);

  const handleVirtualTryOn = useCallback(async () => {
    const clothingSourceUrl = mode === 'extract' ? clothingImage : productImage?.url;
    if (!modelImage || !clothingSourceUrl) return;

    setIsTryingOn(true);
    setError(null);
    setFinalImages(null);

    try {
      const result = await virtualTryOn(modelImage, clothingSourceUrl, contextPrompt);
      setFinalImages(result);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Đã xảy ra lỗi không xác định khi thử đồ.');
    } finally {
      setIsTryingOn(false);
    }
  }, [modelImage, clothingImage, productImage, mode, contextPrompt]);

  const resetFlowStates = (newMode: Mode) => {
    setMode(newMode);
    setError(null);
    setOriginalImage(null);
    setClothingImage(null);
    setProductImage(null);
    setModelImage(null);
    setFinalImages(null);
    setContextPrompt('');
  };

  const isTryOnButtonDisabled =
    isTryingOn ||
    !modelImage ||
    (mode === 'extract' && !clothingImage) ||
    (mode === 'direct' && !productImage);

  // ✅ khai báo class số cột để Tailwind bắt được
  const gridCols = mode === 'extract' ? 'md:grid-cols-3' : 'md:grid-cols-2';

  return (
    <div className="min-h-screen font-sans text-gray-200">
      <Header />
      {/* Thu hẹp bề rộng & giảm padding */}
      <main className="mx-auto max-w-[1100px] px-3 md:px-6 pt-4">
        {error && <ErrorDisplay message={error} onClose={() => setError(null)} />}

        {/* Thanh chọn mode gọn hơn */}
        <div className="mb-6 flex justify-center p-1.5 bg-slate-800 rounded-xl max-w-md mx-auto">
          <button
            onClick={() => resetFlowStates('extract')}
            className={`w-1/2 px-3 py-2 text-sm font-bold rounded-lg transition-all ${
              mode === 'extract'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/10'
                : 'text-gray-300 hover:bg-slate-700'
            }`}
          >
            Tách & Thử đồ
          </button>
          <button
            onClick={() => resetFlowStates('direct')}
            className={`w-1/2 px-3 py-2 text-sm font-bold rounded-lg transition-all ${
              mode === 'direct'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/10'
                : 'text-gray-300 hover:bg-slate-700'
            }`}
          >
            Thử đồ Trực tiếp
          </button>
        </div>

        {/* Các ô nhỏ lại: gap-4 + chiều cao 260px */}
        <div className={`grid grid-cols-1 ${gridCols} gap-4 mb-6`}>
          {mode === 'extract' ? (
            <>
              <div className="h-[260px]">
                <ImageUploadCard
                  id="original-image"
                  title="1. Ảnh Gốc"
                  stepText="Tải lên ảnh người mẫu mặc trang phục bạn muốn tách."
                  buttonText="Tách Trang phục"
                  onImageUpload={setOriginalImage}
                  onActionClick={handleExtractClothing}
                  isLoading={isExtracting}
                  isActionButtonDisabled={!originalImage || isExtracting}
                />
              </div>

              <div className="h-[260px]">
                <ResultCard
                  title="2. Trang phục đã tách"
                  imageUrl={clothingImage}
                  isLoading={isExtracting}
                  placeholderText="Trang phục được tách sẽ xuất hiện ở đây."
                />
              </div>

              <div className="h-[260px]">
                <ImageUploadCard
                  id="model-image"
                  title="3. Người mẫu Mới"
                  stepText="Tải lên ảnh người mẫu bạn muốn thử đồ."
                  onImageUpload={setModelImage}
                />
              </div>
            </>
          ) : (
            <>
              <div className="h-[260px]">
                <ImageUploadCard
                  id="product-image"
                  title="1. Ảnh Trang phục"
                  stepText="Tải lên ảnh trang phục đã được tách nền."
                  onImageUpload={setProductImage}
                />
              </div>
              <div className="h-[260px]">
                <ImageUploadCard
                  id="model-image"
                  title="2. Người mẫu Mới"
                  stepText="Tải lên ảnh người mẫu bạn muốn thử đồ."
                  onImageUpload={setModelImage}
                />
              </div>
            </>
          )}
        </div>

        {/* Khối bối cảnh: padding & margin nhỏ hơn */}
        <div className="bg-slate-800 rounded-2xl shadow-lg p-5 mb-6 border border-slate-700 transform transition-all duration-300 hover:shadow-cyan-500/10">
          <h3 className="text-lg font-bold text-gray-100 mb-1">
            {mode === 'extract' ? '4. Thêm Bối cảnh & Thử đồ' : '3. Thêm Bối cảnh & Thử đồ'}
          </h3>
          <p className="text-sm text-gray-400 mb-3">
            Mô tả bối cảnh cho ảnh kết quả và bắt đầu quá trình thử đồ.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="relative md:col-span-2">
              <label htmlFor="context-prompt" className="block text-sm font-medium text-gray-300 mb-1">
                Bối cảnh (Tùy chọn)
              </label>
              <div className="relative">
                <GlobeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="context-prompt"
                  value={contextPrompt}
                  onChange={(e) => setContextPrompt(e.target.value)}
                  placeholder="VD: đang đi dạo trên đường phố Paris vào buổi tối"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-700 text-gray-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition placeholder:text-gray-500"
                />
              </div>
            </div>

            <button
              onClick={handleVirtualTryOn}
              disabled={isTryOnButtonDisabled}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center hover:from-teal-600 hover:to-cyan-600 focus:outline-none focus:ring-4 focus:ring-cyan-300/50 disabled:bg-gray-500 disabled:bg-none disabled:cursor-not-allowed transition-all duration-300 h-11"
            >
              {isTryingOn && <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />}
              Thử đồ cho Người mẫu
            </button>
          </div>
        </div>

        {/* Kết quả cuối cùng nhỏ lại */}
        <div className="mt-6">
          <div className="h-[360px]">
            <ResultCard
              title="Kết quả Cuối cùng"
              imageUrl={finalImages}
              isLoading={isTryingOn}
              placeholderText="Ảnh người mẫu mới mặc trang phục sẽ xuất hiện ở đây."
              aspectRatio="video"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
