/**
 * In-memory session management for conversation state
 *
 * Stores active conversation sessions with user context and history.
 * Sessions are lost on serverless cold start (acceptable for MVP).
 * Post-MVP: migrate to Redis or Supabase.
 */

import type { ConversationTurn, UserContext } from "@/lib/ai/llm";

export interface ConversationSession {
  sessionId: string;
  user_context: UserContext;
  created_at: number;
  last_accessed: number;
}

// In-memory session store (Map<sessionId, ConversationSession>)
const sessions = new Map<string, ConversationSession>();

// Cleanup old sessions after 1 hour of inactivity
const SESSION_TIMEOUT_MS = 60 * 60 * 1000;

function cleanupSessions(): void {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.last_accessed > SESSION_TIMEOUT_MS) {
      sessions.delete(sessionId);
    }
  }
}

export function createSession(user_context: UserContext): string {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, {
    sessionId,
    user_context,
    created_at: Date.now(),
    last_accessed: Date.now(),
  });

  // Periodically clean up stale sessions
  if (sessions.size % 10 === 0) {
    cleanupSessions();
  }

  return sessionId;
}

export function getSession(sessionId: string): ConversationSession | null {
  const session = sessions.get(sessionId);
  if (session) {
    session.last_accessed = Date.now();
  }
  return session || null;
}

export function updateSessionContext(
  sessionId: string,
  user_context: UserContext
): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.user_context = user_context;
    session.last_accessed = Date.now();
  }
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function getSessionCount(): number {
  return sessions.size;
}
