import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function getBase64Image(url: string): Promise<{ mimeType: string, data: string } | null> {
  if (!url) return null;
  
  if (url.startsWith('data:')) {
    const match = url.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (match) {
      return { mimeType: match[1], data: match[2] };
    }
    return null;
  }
  
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const match = result.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (match) {
          resolve({ mimeType: match[1], data: match[2] });
        } else {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Failed to fetch image for base64 conversion", e);
    return null;
  }
}
