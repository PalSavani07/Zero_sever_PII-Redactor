import type { PIIEntity } from './types';

export interface Chunk {
  text: string;
  globalOffset: number;
}

export function chunkDocument(text: string, windowSize = 200, stride = 150): Chunk[] {
  // Find all words and their starting indices
  const wordRegex = /\S+/g;
  const words: { index: number, length: number }[] = [];
  let match;
  
  while ((match = wordRegex.exec(text)) !== null) {
    words.push({ index: match.index, length: match[0].length });
  }

  if (words.length === 0) {
    return [{ text, globalOffset: 0 }];
  }

  const chunks: Chunk[] = [];
  let i = 0;
  
  while (i < words.length) {
    const startIndex = words[i].index;
    const endWordIndex = Math.min(i + windowSize, words.length) - 1;
    const endIndex = words[endWordIndex].index + words[endWordIndex].length;
    
    chunks.push({
      text: text.substring(startIndex, endIndex),
      globalOffset: startIndex
    });
    
    if (i + windowSize >= words.length) {
      break;
    }
    
    i += stride;
  }
  
  return chunks;
}

export function overlapReconciliation(entities: PIIEntity[], sourceText: string): PIIEntity[] {
  if (entities.length === 0) return [];

  // Sort by start index ascending, then by end index descending
  const sorted = [...entities].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return b.end - a.end;
  });

  const merged: PIIEntity[] = [];

  for (const entity of sorted) {
    if (merged.length === 0) {
      merged.push({ ...entity });
      continue;
    }

    const last = merged[merged.length - 1];

    if (entity.start <= last.end) {
      // Overlap or touching -> merge
      last.end = Math.max(last.end, entity.end);
      last.score = Math.max(last.score, entity.score);
      
      if (last.entity_group !== entity.entity_group) {
        if (!last.entity_group.includes(entity.entity_group)) {
          last.entity_group = `${last.entity_group}|${entity.entity_group}`;
        }
      }
      
      last.word = sourceText.substring(last.start, last.end);
    } else {
      merged.push({ ...entity });
    }
  }

  return merged;
}
