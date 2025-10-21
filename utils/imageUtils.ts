
import type { ImageFile } from '../types';

export const fileToImageFile = (file: File): Promise<ImageFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const url = URL.createObjectURL(file);
        // Remove the data URL prefix e.g. "data:image/png;base64,"
        const base64Data = result.substring(result.indexOf(',') + 1);
        resolve({
          data: base64Data,
          mimeType: file.type,
          url: url,
        });
      } else {
        reject(new Error("Could not read file"));
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
};
