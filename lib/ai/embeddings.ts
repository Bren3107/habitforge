/**
 * Embeddings module: lazy-loads @xenova/transformers and generates vector embeddings
 *
 * Key design:
 * - Lazy-load model on first embed() call (not at import time)
 * - Model: all-MiniLM-L6-v2 (384 dimensions)
 * - Prevents cold start delays during imports
 */

// Type for the transformer pipeline (using any to avoid deep dependency imports)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let modelPipeline: any = null;

const EMBEDDING_DIMENSION = 384;
const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

/**
 * Initialize the embedding model
 * Called once per serverless instance on first use
 */
export async function initEmbeddings(): Promise<void> {
  if (modelPipeline) {
    return; // Already initialized
  }

  try {
    // Dynamically import to enable lazy-loading
    const transformers = await import("@xenova/transformers");

    // Initialize the feature-extraction pipeline
    modelPipeline = await transformers.pipeline(
      "feature-extraction",
      MODEL_NAME
    );
  } catch (error) {
    throw new Error(
      `Failed to initialize embeddings model: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Generate a vector embedding for input text
 * Returns a 384-dimensional vector
 *
 * @param text - Text to embed
 * @returns Promise resolving to 384-dimensional vector
 */
export async function embed(text: string): Promise<number[]> {
  // Lazy-initialize on first call
  if (!modelPipeline) {
    await initEmbeddings();
  }

  try {
    // Generate embedding using the feature-extraction pipeline
    // The pipeline returns a tensor; we need to convert it to a regular array
    const result = await modelPipeline(text, {
      pooling: "mean",
      normalize: true,
    });

    // Convert tensor to array
    // result.data is the underlying array buffer
    const embedding = Array.from(result.data as number[]);

    // Verify dimension
    if (embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Unexpected embedding dimension: ${embedding.length} (expected ${EMBEDDING_DIMENSION})`
      );
    }

    return embedding;
  } catch (error) {
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get the embedding dimension (384 for all-MiniLM-L6-v2)
 */
export function getEmbeddingDimension(): number {
  return EMBEDDING_DIMENSION;
}

/**
 * Check if embeddings are initialized
 * Used for testing and diagnostics
 */
export function isInitialized(): boolean {
  return modelPipeline !== null;
}

/**
 * Reset embeddings (mainly for testing)
 */
export function resetEmbeddings(): void {
  modelPipeline = null;
}
