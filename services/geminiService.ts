// src/services/geminiService.ts
import { GoogleGenAI, Modality } from "@google/genai";
import type { ImageFile } from "../types";

/**
 * Lấy API key mà người dùng đã nhập trên web.
 * - Ưu tiên window.getGeminiApiKey() (được thêm trong index.html)
 * - fallback sang localStorage
 */
function getUserApiKey(): string {
  const key =
    (window as any).getGeminiApiKey?.() ||
    localStorage.getItem("gemini_api_key");

  if (!key) {
    throw new Error(
      "Bạn chưa nhập Gemini API Key. Hãy reload trang và nhập key trước."
    );
  }
  return key;
}

/** Tạo client mỗi lần gọi, đảm bảo luôn lấy key mới nhất */
function createAI(): GoogleGenAI {
  const apiKey = getUserApiKey();
  return new GoogleGenAI({ apiKey });
}

/** Chuyển ảnh (data + mimeType) thành part cho Gemini */
const imageToPart = (image: ImageFile) => {
  return {
    inlineData: {
      data: image.data,
      mimeType: image.mimeType,
    },
  };
};

/** Lấy base64 từ ảnh URL (dùng cho ảnh quần áo) */
const getBase64FromImageUrl = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return reject(new Error("Could not get canvas context"));
      }
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      // Bỏ tiền tố "data:image/...;base64,"
      resolve(dataURL.replace(/^data:image\/(png|jpeg);base64,/, ""));
    };
    img.onerror = () => {
      reject(new Error("Không tải được ảnh từ URL (CORS hoặc URL không hợp lệ)."));
    };
    img.src = url;
  });
};

// Model dùng cho image generation (có thể đổi nếu cần)
const MODEL_NAME = "gemini-2.5-flash-image";

/** 
 * Tách trang phục ra nền trắng (product flat lay)
 */
export const extractClothing = async (originalImage: ImageFile): Promise<string> => {
  const ai = createAI();

  const prompt =
    "Từ hình ảnh này, hãy tạo một hình ảnh mới chỉ chứa trang phục chính trên nền trắng trơn. " +
    "Xóa hoàn toàn người và hậu cảnh. Trang phục phải được hiển thị phẳng, như thể dành cho danh mục sản phẩm.";

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      parts: [imageToPart(originalImage), { text: prompt }],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  const cand = response.candidates?.[0];
  const parts = cand?.content?.parts ?? [];
  for (const part of parts) {
    if ((part as any).inlineData) {
      const base64ImageBytes: string = (part as any).inlineData.data;
      const mime: string = (part as any).inlineData.mimeType || "image/png";
      return `data:${mime};base64,${base64ImageBytes}`;
    }
  }

  throw new Error("Không thể tách trang phục từ hình ảnh.");
};

/**
 * Thử đồ ảo (Virtual Try-On):
 * - clothingImageUrl: URL ảnh sản phẩm (áo/quần) → sẽ được convert sang base64
 * - modelImage: ảnh người mẫu (ImageFile)
 * - contextPrompt: mô tả bối cảnh (optional)
 * Trả về: mảng dataURL ảnh kết quả (1..5 ảnh tuỳ số ảnh thành công)
 */
export const virtualTryOn = async (
  modelImage: ImageFile,
  clothingImageUrl: string,
  contextPrompt?: string
): Promise<string[]> => {
  const clothingImageBase64 = await getBase64FromImageUrl(clothingImageUrl);

  const clothingImagePart = {
    inlineData: {
      data: clothingImageBase64,
      mimeType: "image/png",
    },
  };

  const baseInstruction =
    "Nhiệm vụ của bạn là chuyên gia thử đồ ảo. Lấy trang phục từ hình ảnh đầu tiên (ảnh sản phẩm) " +
    "và mặc nó cho người trong hình ảnh thứ hai (ảnh người mẫu).";

  const requirements =
    "Yêu cầu quan trọng: Giữ nguyên hoàn toàn người mẫu (khuôn mặt, tóc, dáng người, màu da). " +
    "Chỉ thay thế quần áo họ đang mặc bằng trang phục được cung cấp. " +
    "Trang phục mới phải vừa vặn một cách tự nhiên và chân thực với tư thế của người mẫu.";

  const backgroundInstruction = contextPrompt
    ? `Tạo một bối cảnh mới cho hình ảnh dựa trên mô tả sau: "${contextPrompt}".`
    : "Tự động tạo một bối cảnh mới phù hợp với phong cách của trang phục.";

  const outputInstruction =
    "Hãy sáng tạo và tạo ra một hình ảnh độc đáo với phong cách riêng. " +
    "Chỉ trả về hình ảnh kết quả cuối cùng, không thêm bất kỳ văn bản nào.";

  const prompt = `${baseInstruction} ${requirements} ${backgroundInstruction} ${outputInstruction}`;

  // Sinh 1 ảnh (có try/catch để không làm hỏng cả loạt)
  const generateSingleImage = async (): Promise<string | null> => {
    try {
      const ai = createAI();
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [clothingImagePart, imageToPart(modelImage), { text: prompt }],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const cand = response.candidates?.[0];
      const parts = cand?.content?.parts ?? [];
      for (const part of parts) {
        if ((part as any).inlineData) {
          const base64ImageBytes: string = (part as any).inlineData.data;
          const mime: string = (part as any).inlineData.mimeType || "image/png";
          return `data:${mime};base64,${base64ImageBytes}`;
        }
      }
    } catch (error) {
      console.error("Lỗi khi tạo một ảnh:", error);
    }
    return null;
  };

  // Thử tạo 5 ảnh, lấy ảnh hợp lệ
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
