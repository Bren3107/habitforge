/**
 * useGamification - Manages user XP, streaks, badges, and level state
 * Polls for updates and caches locally
 */

import { useState, useCallback, useEffect } from "react";
import { gamificationAPI } from "@/lib/api";
import type { GamificationResponse } from "@/lib/api";

export function useGamification(userId: string | null) {
  const [gamification, setGamification] = useState<GamificationResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const stats = await gamificationAPI.getStats(userId);
      setGamification(stats);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to fetch gamification stats";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch stats on mount and when userId changes
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Optionally poll for updates every 30 seconds
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [userId, fetchStats]);

  return {
    gamification,
    loading,
    error,
    refresh: fetchStats,
  };
}
