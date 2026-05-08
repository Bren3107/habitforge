import type { UserContext } from "@/lib/ai/llm";
import { supabaseServer } from "@/lib/supabase/server";

export interface ConversationSession {
  sessionId: string;
  user_context: UserContext;
  created_at: number;
  last_accessed: number;
}

const SESSION_TIMEOUT_MS = 60 * 60 * 1000;

export async function createSession(user_context: UserContext): Promise<string> {
  const sessionId = crypto.randomUUID();
  const now = new Date();

  const { error } = await supabaseServer
    .from("conversation_sessions")
    .insert({
      id: sessionId,
      user_context,
      created_at: now,
      last_accessed: now,
    });

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  return sessionId;
}

export async function getSession(
  sessionId: string
): Promise<ConversationSession | null> {
  const { data, error } = await supabaseServer
    .from("conversation_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch session: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const now = Date.now();
  const lastAccessed = new Date(data.last_accessed).getTime();

  if (now - lastAccessed > SESSION_TIMEOUT_MS) {
    await deleteSession(sessionId);
    return null;
  }

  await supabaseServer
    .from("conversation_sessions")
    .update({ last_accessed: new Date() })
    .eq("id", sessionId);

  return {
    sessionId: data.id,
    user_context: data.user_context,
    created_at: new Date(data.created_at).getTime(),
    last_accessed: now,
  };
}

export async function updateSessionContext(
  sessionId: string,
  user_context: UserContext
): Promise<void> {
  const { error } = await supabaseServer
    .from("conversation_sessions")
    .update({
      user_context,
      last_accessed: new Date(),
    })
    .eq("id", sessionId);

  if (error) {
    throw new Error(`Failed to update session: ${error.message}`);
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabaseServer
    .from("conversation_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    throw new Error(`Failed to delete session: ${error.message}`);
  }
}
