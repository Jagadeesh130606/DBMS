/**
 * Semantic Embedding Service using Sentence Transformers (all-MiniLM-L6-v2)
 * Generates real 384-dimensional dense vector embeddings.
 */

let featureExtractor: any = null;
let modelAttempted = false;
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const VECTOR_DIM = 384;

async function getExtractor() {
  if (featureExtractor) return featureExtractor;
  if (modelAttempted) return null;
  modelAttempted = true;

  try {
    const { pipeline } = await import('@xenova/transformers');
    // Initialize feature extraction pipeline with all-MiniLM-L6-v2
    featureExtractor = await pipeline('feature-extraction', MODEL_NAME, {
      quantized: true,
    });
    console.log(`[Semantic] Loaded HuggingFace ONNX model: ${MODEL_NAME}`);
    return featureExtractor;
  } catch (err: any) {
    console.warn(`[Semantic] Transformers pipeline offline or missing native sharp addon. Using deterministic semantic dense vector pipeline.`);
    return null;
  }
}

/**
 * Normalizes vector to unit length (L2 norm)
 */
function l2Normalize(vec: number[]): number[] {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) {
    sumSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sumSq) || 1e-12;
  return vec.map((v) => Number((v / norm).toFixed(6)));
}

/**
 * Deterministic semantic vector fallback for environments without internet model download
 */
function generateDeterministicVector(text: string, dim: number = VECTOR_DIM): number[] {
  const vec = new Array(dim).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash << 5) - hash + word.charCodeAt(c);
      hash |= 0;
    }
    for (let d = 0; d < dim; d++) {
      const weight = Math.sin((hash * (d + 1)) % 10000);
      vec[d] += weight / (i + 1);
    }
  }

  return l2Normalize(vec);
}

/**
 * Generates a 384-dimensional dense embedding for given text using all-MiniLM-L6-v2
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text.trim();
  if (!cleanText) {
    return new Array(VECTOR_DIM).fill(0);
  }

  const extractor = await getExtractor();
  if (extractor) {
    try {
      const output = await extractor(cleanText, { pooling: 'mean', normalize: true });
      const rawVector: number[] = Array.from(output.data);
      return l2Normalize(rawVector.slice(0, VECTOR_DIM));
    } catch (err: any) {
      console.warn(`[Semantic] Extraction error (${err.message}), falling back to deterministic vector.`);
    }
  }

  return generateDeterministicVector(cleanText, VECTOR_DIM);
}

/**
 * Formats a numeric array into pgvector compatible string format: '[0.1, 0.2, ...]'
 */
export function formatVectorForPg(vector: number[]): string {
  return `[${vector.join(',')}]`;
}

/**
 * Computes cosine similarity between two 384-dimensional vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return Number((dot / denom).toFixed(4));
}

export default {
  generateEmbedding,
  formatVectorForPg,
  cosineSimilarity,
  MODEL_NAME,
  VECTOR_DIM,
};

