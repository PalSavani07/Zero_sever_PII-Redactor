/// <reference lib="webworker" />
import { pipeline, env, type TokenClassificationPipeline } from '@huggingface/transformers';
import * as Comlink from 'comlink';
import type { HardwareDiagnostics } from './core/diagnostics';
import type { PIIEntity } from './core/types';
import { runRegexEngine } from './core/regexEngine';
import { chunkDocument, overlapReconciliation } from './core/chunking';

// Enforce browser caching for models so weights persist locally
env.useBrowserCache = true;

let nlpPipeline: TokenClassificationPipeline | null = null;

export type ProgressCallback = (progress: {
  status: string;
  name?: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
}) => void;

export async function initEngine(
  diagnostics: HardwareDiagnostics,
  onProgress: ProgressCallback
): Promise<boolean> {
  try {
    const modelId = 'openai/privacy-filter';
    
    let device: any = 'wasm';
    let dtype: any = 'fp32';
    
    if (diagnostics.webGPUSupport) {
      device = 'webgpu';
      dtype = 'q4f16';
    }

    nlpPipeline = await pipeline('token-classification', modelId, {
      device,
      dtype,
      progress_callback: onProgress
    });
    
    return true;
  } catch (error) {
    console.error('Failed to initialize transformers pipeline:', error);
    return false;
  }
}

export async function sanitizeDocument(text: string): Promise<PIIEntity[]> {
  if (!nlpPipeline) {
    throw new Error('Pipeline not initialized. Call initEngine first.');
  }

  // 1. Layer 1: Regex Engine execution
  const regexEntities = runRegexEngine(text);

  // 2. Overlapping Chunking Strategy
  // Use a 200-word window with a 150-word stride
  const chunks = chunkDocument(text, 200, 150);
  
  // 3. Sequential AI execution on chunks
  const aiEntities: PIIEntity[] = [];
  
  for (const chunk of chunks) {
    const results: any = await nlpPipeline(chunk.text, {
      aggregation_strategy: 'simple'
    });
    
    const entities = Array.isArray(results) ? results : [results];
    
    let cursor = 0;
    for (const entity of entities) {
      if (!entity || !entity.word) continue;
      
      // Filter out low-confidence AI hallucinations
      if (entity.score < 0.75) continue;
      
      const rawWord = entity.word as string;
      const normalizedWord = rawWord.replace(/\u2581/g, ' ').trim();
      
      if (!normalizedWord) continue;
      
      const searchStart = cursor;
      const localIndex = chunk.text.indexOf(normalizedWord, searchStart);
      
      if (localIndex !== -1) {
        aiEntities.push({
          entity_group: entity.entity_group,
          score: entity.score,
          word: normalizedWord,
          start: chunk.globalOffset + localIndex,
          end: chunk.globalOffset + localIndex + normalizedWord.length
        });
        cursor = localIndex + normalizedWord.length;
      } else {
        const approxStart = Math.max(cursor, entity.start);
        const approxEnd = Math.max(approxStart, entity.end);
        const approxWord = chunk.text.substring(approxStart, approxEnd);
        
        aiEntities.push({
          entity_group: entity.entity_group,
          score: entity.score,
          word: approxWord,
          start: chunk.globalOffset + approxStart,
          end: chunk.globalOffset + approxEnd
        });
        cursor = approxEnd;
      }
    }
  }

  // 4. Pool entities and reconcile overlaps deterministically
  const pooledEntities = [...regexEntities, ...aiEntities];
  const finalEntities = overlapReconciliation(pooledEntities, text);

  // 5. Boundary Snapping & Hallucination Defense
  const isPunct = (char: string) => /[\s\-.,;:'"!?()\[\]{}<>]/.test(char);
  const isAlphaNum = (char: string) => /[a-zA-Z0-9]/.test(char);
  
  for (const entity of finalEntities) {
    // A. Punctuation snapping
    while (entity.start < entity.end && isPunct(text[entity.start])) {
      entity.start++;
    }
    while (entity.end > entity.start && isPunct(text[entity.end - 1])) {
      entity.end--;
    }
    
    // B. Subword Hallucination Defense
    // If the entity starts or ends in the middle of a continuous alphanumeric word,
    // it is a subword tokenization failure (like "er" inside "server"). 
    // We invalidate it by collapsing its boundaries.
    if (entity.start > 0 && isAlphaNum(text[entity.start - 1])) {
      entity.start = entity.end;
    }
    if (entity.end < text.length && isAlphaNum(text[entity.end])) {
      entity.start = entity.end;
    }

    if (entity.start < entity.end) {
      entity.word = text.substring(entity.start, entity.end);
    }
  }

  // Return strictly valid spans that survived boundary snapping and hallucination defense
  return finalEntities.filter(e => e.start < e.end);
}

// Expose the worker methods via Comlink
Comlink.expose({
  initEngine,
  sanitizeDocument
});
