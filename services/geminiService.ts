import { GoogleGenAI, Modality } from "@google/genai";
import type { ImageFile } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getBase64FromImageUrl = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL.replace(/^data:image\/(png|jpeg);base64,/, ''));
        };
        img.onerror = reject;
        img.src = url;
    });
};

const imageToPart = (image: ImageFile) => {
    return {
        inlineData: {
            data: image.data,
            mimeType: image.mimeType,
        },
    };
};

const model = 'gemini-2.5-flash-image';

export const extractClothing = async (originalImage: ImageFile): Promise<string> => {
    const prompt = 'Từ hình ảnh này, hãy tạo một hình ảnh mới chỉ chứa trang phục chính trên nền trắng trơn. Xóa hoàn toàn người và hậu cảnh. Trang phục phải được hiển thị phẳng, như thể dành cho danh mục sản phẩm.';

    const response = await ai.models.generateContent({
        model: model,
        contents: {
            parts: [
                imageToPart(originalImage),
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }
    throw new Error("Không thể tách trang phục từ hình ảnh.");
};

export const virtualTryOn = async (modelImage: ImageFile, clothingImageUrl: string, contextPrompt?: string): Promise<string[]> => {
    const clothingImageBase64 = await getBase64FromImageUrl(clothingImageUrl);
    
    const clothingImagePart = {
        inlineData: {
            data: clothingImageBase64,
            mimeType: 'image/png' 
        }
    };
    
    const baseInstruction = "Nhiệm vụ của bạn là chuyên gia thử đồ ảo. Lấy trang phục từ hình ảnh đầu tiên (ảnh sản phẩm) và mặc nó cho người trong hình ảnh thứ hai (ảnh người mẫu).";
    const requirements = "Yêu cầu quan trọng: Giữ nguyên hoàn toàn người mẫu (khuôn mặt, tóc, dáng người, màu da). Chỉ thay thế quần áo họ đang mặc bằng trang phục được cung cấp. Trang phục mới phải vừa vặn một cách tự nhiên và chân thực với tư thế của người mẫu.";
    const backgroundInstruction = contextPrompt
        ? `Tạo một bối cảnh mới cho hình ảnh dựa trên mô tả sau: "${contextPrompt}".`
        : "Tự động tạo một bối cảnh mới phù hợp với phong cách của trang phục.";
    const outputInstruction = "Hãy sáng tạo và tạo ra một hình ảnh độc đáo với phong cách riêng. Chỉ trả về hình ảnh kết quả cuối cùng, không thêm bất kỳ văn bản nào.";

    const prompt = `${baseInstruction} ${requirements} ${backgroundInstruction} ${outputInstruction}`;

    const generateSingleImage = async (): Promise<string | null> => {
        try {
            const response = await ai.models.generateContent({
                model: model,
                contents: {
                    parts: [
                        clothingImagePart,
                        imageToPart(modelImage),
                        { text: prompt },
                    ],
                },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });
            
            if (response.candidates && response.candidates.length > 0) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        const base64ImageBytes: string = part.inlineData.data;
                        return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                    }
                }
            }
        } catch (error) {
            console.error("Lỗi khi tạo một ảnh:", error);
        }
        return null;
    };

    const imagePromises: Promise<string | null>[] = [];
    for (let i = 0; i < 5; i++) {
        imagePromises.push(generateSingleImage());
    }

    const results = await Promise.all(imagePromises);
    const validResults = results.filter((url): url is string => url !== null);
    
    if (validResults.length > 0) {
        return validResults;
    }

    throw new Error("Không thể thực hiện thử đồ ảo. Vui lòng thử lại.");
};