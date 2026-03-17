import { Types } from 'mongoose';
import { getOpenAIClient } from './openaiClient';
import UserMemoryVector from '../models/UserMemoryVector';

/**
 * Embedding model — OpenAI text-embedding-3-small.
 * Cost: ~$0.02 / 1M tokens. For Aurora's use case this is essentially free.
 * Produces 1536-dimension vectors that encode semantic meaning.
 */
const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Convert a text string into a 1536-dimension vector embedding.
 * Used both when storing memories and when retrieving (query embedding).
 */
export async function embedText(text: string): Promise<number[]> {
  const openai = getOpenAIClient();
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000), // hard cap to stay well within token limits
  });
  return response.data[0].embedding;
}

/**
 * Compute cosine similarity between two vectors.
 * Returns a value between -1 and 1 (higher = more similar).
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Embed a batch of memory points and store them in the UserMemoryVector collection.
 *
 * Called after finishChatSession saves the ChatContext — runs in the background
 * so the user's session-end response is not delayed.
 *
 * @param userId    The user's ObjectId
 * @param points    Array of important-point strings to embed and store
 * @param sessionId The ChatContext._id these points belong to
 */
export async function storeMemoryPoints(
  userId: Types.ObjectId | string,
  points: string[],
  sessionId?: Types.ObjectId | string
): Promise<void> {
  if (!points || points.length === 0) return;

  // Embed all points in parallel for speed
  const embeddings = await Promise.all(
    points.map(p => embedText(p))
  );

  const docs = points.map((text, i) => ({
    user: userId,
    text,
    embedding: embeddings[i],
    source: 'chat' as const,
    ...(sessionId ? { sessionId } : {}),
  }));

  await UserMemoryVector.insertMany(docs);
}

/**
 * Retrieve the most semantically relevant memories for a given query text.
 *
 * Steps:
 *   1. Embed the query (typically the user's latest message)
 *   2. Load up to 2000 of this user's memory vectors from MongoDB
 *   3. Compute cosine similarity between query and every stored memory
 *   4. Return the top-K texts, sorted by relevance
 *
 * @param userId    The user's ObjectId
 * @param queryText The text to find relevant memories for (user's current message)
 * @param topK      How many memories to return (default: 8)
 * @returns         Array of memory text strings, most relevant first
 */
export async function retrieveRelevantMemories(
  userId: Types.ObjectId | string,
  queryText: string,
  topK: number = 8
): Promise<string[]> {
  if (!queryText || queryText.trim().length === 0) return [];

  // Load this user's stored memory vectors (cap at 2000 for performance)
  const vectors = await UserMemoryVector.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(2000)
    .select('text embedding')
    .lean();

  if (vectors.length === 0) return [];

  // Embed the query text
  const queryEmbedding = await embedText(queryText);

  // Score each memory by cosine similarity to the query
  const scored = vectors.map(v => ({
    text: v.text,
    score: cosineSimilarity(queryEmbedding, v.embedding),
  }));

  // Sort descending by score and return top-K
  scored.sort((a, b) => b.score - a.score);

  // Only return memories with a meaningful similarity score (>0.3)
  // to avoid injecting completely unrelated noise into the context.
  return scored
    .filter(s => s.score > 0.3)
    .slice(0, topK)
    .map(s => s.text);
}
