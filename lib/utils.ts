import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractJson(text: string): string {
  let jsonText = text.trim();
  
  // Remove markdown block if present
  if (jsonText.includes('```')) {
    const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) jsonText = match[1].trim();
  }

  // Find first balanced object or array
  const firstBrace = jsonText.indexOf('{');
  const firstBracket = jsonText.indexOf('[');
  
  let startIdx = -1;
  let opener = '';
  let closer = '';

  if (firstBrace !== -1 && (firstBracket === -1 || (firstBrace < firstBracket))) {
    startIdx = firstBrace;
    opener = '{';
    closer = '}';
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    opener = '[';
    closer = ']';
  }

  if (startIdx === -1) return jsonText;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < jsonText.length; i++) {
    const char = jsonText[i];
    
    if (char === '"' && !escape) {
      inString = !inString;
    }

    if (!inString) {
      if (char === opener) depth++;
      else if (char === closer) {
        depth--;
        if (depth === 0) {
          return jsonText.substring(startIdx, i + 1);
        }
      }
    }

    if (char === '\\' && !escape) escape = true;
    else escape = false;
  }

  return jsonText.substring(startIdx);
}
