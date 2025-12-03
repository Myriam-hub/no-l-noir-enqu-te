import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Clue {
  id: string;
  day: string;
  clue_number: number;
  text: string;
  answer: string;
  created_at: string;
}

export interface TodayStats {
  completedPlayers: string[];
  partialPlayers: string[];
  totalAnswersToday: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
}

export interface TodayAnswer {
  player_name: string;
  is_correct: boolean;
  clue_id: string;
  created_at: string;
}

export const useAdminGame = (adminCode: string) => {
  const [allClues, setAllClues] = useState<Clue[]>([]);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [allPlayers, setAllPlayers] = useState<string[]>([]);
  const [todayAnswers, setTodayAnswers] = useState<TodayAnswer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // Fetch all clues (admin only)
  const fetchAllClues = useCallback(async () => {
    if (!adminCode) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-clues', {
        body: { action: 'list', adminCode },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAllClues(data.data || []);
    } catch (err) {
      console.error('Error fetching clues:', err);
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  }, [adminCode]);

  // Fetch stats (admin only)
  const fetchStats = useCallback(async () => {
    if (!adminCode) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-stats', {
        body: { adminCode, day: today },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setTodayStats(data.data.todayStats);
      setLeaderboard(data.data.leaderboard);
      setAllPlayers(data.data.allPlayers);
      setTodayAnswers(data.data.todayAnswers);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  }, [adminCode, today]);

  // Add clue
  const addClue = useCallback(async (
    day: string,
    clueNumber: number,
    text: string,
    answer: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-clues', {
        body: {
          action: 'add',
          adminCode,
          clueData: { day, clue_number: clueNumber, text, answer },
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      await fetchAllClues();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur';
      return { success: false, error: message };
    }
  }, [adminCode, fetchAllClues]);

  // Update clue
  const updateClue = useCallback(async (
    id: string,
    updates: Partial<Omit<Clue, 'id' | 'created_at'>>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-clues', {
        body: {
          action: 'update',
          adminCode,
          clueId: id,
          clueData: updates,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      await fetchAllClues();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur';
      return { success: false, error: message };
    }
  }, [adminCode, fetchAllClues]);

  // Delete clue
  const deleteClue = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-clues', {
        body: {
          action: 'delete',
          adminCode,
          clueId: id,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      await fetchAllClues();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur';
      return { success: false, error: message };
    }
  }, [adminCode, fetchAllClues]);

  // Load all admin data
  const loadAdminData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchAllClues(), fetchStats()]);
    setLoading(false);
  }, [fetchAllClues, fetchStats]);

  return {
    allClues,
    todayStats,
    leaderboard,
    allPlayers,
    todayAnswers,
    loading,
    error,
    today,
    loadAdminData,
    fetchAllClues,
    fetchStats,
    addClue,
    updateClue,
    deleteClue,
  };
};
