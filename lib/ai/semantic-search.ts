import type { SupabaseClient } from "@supabase/supabase-js";

const EXPECTED_EMBEDDING_DIM = 384;

/**
 * Represents a success case retrieved from the database
 */
export interface SuccessCase {
  id: string;
  user_id: string;
  category: string;
  principle_ids: string[];
  description: string;
  embedding: number[];
  similarity_distance?: number;
  success_rate: number;
  created_at: string;
  updated_at: string;
}

/**
 * Find semantically similar success cases using pgvector cosine similarity
 *
 * @param supabaseClient - Initialized Supabase client
 * @param embedding - 384-dimensional embedding vector
 * @param category - Filter by category (fitness, productivity, learning)
 * @param limit - Maximum number of results to return (default: 3)
 * @returns Promise resolving to array of similar success cases
 */
export async function findSimilarCases(
  supabaseClient: SupabaseClient,
  embedding: number[],
  category: string,
  limit: number = 3
): Promise<SuccessCase[]> {
  // Validate embedding dimension
  if (embedding.length !== EXPECTED_EMBEDDING_DIM) {
    throw new Error(
      `Expected ${EXPECTED_EMBEDDING_DIM}-dim embedding, got ${embedding.length}`
    );
  }

  try {
    // Use pgvector's cosine similarity operator (<->)
    // The <-> operator returns the distance (smaller is more similar)
    // We order by ascending distance to get the most similar cases first

    // Try RPC-based similarity search if available
    try {
      const { data, error } = await (supabaseClient as any)
        .rpc("match_success_cases", {
          query_embedding: embedding,
          match_count: limit,
          filter_category: category,
        });

      if (!error && data && Array.isArray(data)) {
        return data.map((item: any) => ({
          ...item,
          similarity_distance: item.distance || undefined,
        }));
      }
    } catch (error) {
      // Log that RPC failed and falling back to direct approach
      console.warn(
        "RPC match_success_cases failed, falling back to direct approach",
        error
      );
      // Fallback continues...
    }

    // Fallback: Use direct similarity search
    return findSimilarCasesDirect(supabaseClient, embedding, category, limit);
  } catch (error) {
    throw new Error(
      `Failed to find similar cases: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Alternative approach using direct embedding vector comparison
 * This function demonstrates a lower-level approach if RPC is not available
 *
 * @param supabaseClient - Initialized Supabase client
 * @param embedding - 384-dimensional embedding vector
 * @param category - Filter by category
 * @param limit - Maximum results
 * @returns Promise resolving to array of similar success cases
 */
export async function findSimilarCasesDirect(
  supabaseClient: SupabaseClient,
  embedding: number[],
  category: string,
  limit: number = 3
): Promise<SuccessCase[]> {
  // Validate embedding dimension
  if (embedding.length !== EXPECTED_EMBEDDING_DIM) {
    throw new Error(
      `Expected ${EXPECTED_EMBEDDING_DIM}-dim embedding, got ${embedding.length}`
    );
  }

  try {
    // Fetch all success cases for the category
    const { data, error } = await supabaseClient
      .from("success_cases")
      .select(
        "id, user_id, category, principle_ids, description, embedding, success_rate, created_at, updated_at"
      )
      .eq("category", category)
      .limit(100); // Fetch up to 100 for client-side filtering

    if (error) {
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Calculate cosine similarity for each case
    const withSimilarity = data.map((item) => {
      const distance = cosineSimilarity(embedding, item.embedding);
      return {
        ...item,
        similarity_distance: distance,
      };
    });

    // Sort by distance (ascending) and return top limit results
    return withSimilarity
      .sort((a, b) => (a.similarity_distance || 1) - (b.similarity_distance || 1))
      .slice(0, limit);
  } catch (error) {
    throw new Error(
      `Failed to find similar cases: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Calculate cosine similarity between two vectors
 * Returns distance as 1 - cosine_similarity (smaller = more similar)
 *
 * @param vecA - First vector
 * @param vecB - Second vector
 * @returns Distance value between 0 and 1
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 1; // Maximum distance if either vector is zero
  }

  const similarity = dotProduct / (magnitudeA * magnitudeB);
  // Return distance as 1 - similarity (0 = identical, 1 = opposite)
  return 1 - similarity;
}
