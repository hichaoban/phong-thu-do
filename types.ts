
export interface ImageFile {
  data: string;      // Base64 encoded string without prefix
  mimeType: string;  // e.g., 'image/png'
  url: string;       // Object URL for preview
}
