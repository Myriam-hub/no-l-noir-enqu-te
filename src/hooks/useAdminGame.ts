import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Secret {
  id: string;
  title: string;
  person_name: string;
  is_active: boolean;
  created_at: string;
  clues: Clue[];
}

export interface Clue {
  id: string;
  secret_id: string;
  text: string;
  created_at: string;
}

export interface DailySecrets {
  id: string;
  day: number;
  secret1_id: string | null;
  secret2_id: string | null;
}

export interface TodayStats {
  completedPlayers: string[];
  partialPlayers: string[];
  totalGuessesToday: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
}

export const useAdminGame = (adminCode: string) => {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [dailySecrets, setDailySecrets] = useState<DailySecrets[]>([]);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [todayGuesses, setTodayGuesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const calculateGameDay = useCallback(() => {
    const startDate = new Date('2024-12-01');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, Math.min(10, diffDays));
  }, []);

  const currentDay = calculateGameDay();

  const fetchSecrets = useCallback(async () => {
    if (!adminCode) return;
    const { data } = await supabase.functions.invoke('admin-secrets', {
      body: { action: 'list', adminCode },
    });
    if (data?.success) {
      setSecrets(data.secrets || []);
      setDailySecrets(data.dailySecrets || []);
    }
  }, [adminCode]);

  const fetchStats = useCallback(async () => {
    if (!adminCode) return;
    const { data } = await supabase.functions.invoke('admin-stats', {
      body: { adminCode, day: currentDay },
    });
    if (data?.success) {
      setTodayStats(data.todayStats);
      setLeaderboard(data.leaderboard || []);
      setTodayGuesses(data.todayGuesses || []);
    }
  }, [adminCode, currentDay]);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSecrets(), fetchStats()]);
    setLoading(false);
  }, [fetchSecrets, fetchStats]);

  const addSecret = useCallback(async (title: string, personName: string) => {
    const { data, error } = await supabase.functions.invoke('admin-secrets', {
      body: { action: 'add', adminCode, secret: { title, person_name: personName } },
    });
    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error };
    await fetchSecrets();
    return { success: true };
  }, [adminCode, fetchSecrets]);

  const updateSecret = useCallback(async (secretId: string, updates: Partial<Secret>) => {
    const { data, error } = await supabase.functions.invoke('admin-secrets', {
      body: { action: 'update', adminCode, secretId, secret: updates },
    });
    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error };
    await fetchSecrets();
    return { success: true };
  }, [adminCode, fetchSecrets]);

  const deleteSecret = useCallback(async (secretId: string) => {
    const { data, error } = await supabase.functions.invoke('admin-secrets', {
      body: { action: 'delete', adminCode, secretId },
    });
    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error };
    await fetchSecrets();
    return { success: true };
  }, [adminCode, fetchSecrets]);

  const addClue = useCallback(async (secretId: string, text: string) => {
    const { data, error } = await supabase.functions.invoke('admin-secrets', {
      body: { action: 'addClue', adminCode, secretId, clueText: text },
    });
    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error };
    await fetchSecrets();
    return { success: true };
  }, [adminCode, fetchSecrets]);

  const updateClue = useCallback(async (clueId: string, text: string) => {
    const { data, error } = await supabase.functions.invoke('admin-secrets', {
      body: { action: 'updateClue', adminCode, clueId, clueText: text },
    });
    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error };
    await fetchSecrets();
    return { success: true };
  }, [adminCode, fetchSecrets]);

  const deleteClue = useCallback(async (clueId: string) => {
    const { data, error } = await supabase.functions.invoke('admin-secrets', {
      body: { action: 'deleteClue', adminCode, clueId },
    });
    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error };
    await fetchSecrets();
    return { success: true };
  }, [adminCode, fetchSecrets]);

  const setDaySecrets = useCallback(async (day: number, secret1Id: string | null, secret2Id: string | null) => {
    const { data, error } = await supabase.functions.invoke('admin-secrets', {
      body: { action: 'setDailySecrets', adminCode, day, secretIds: [secret1Id, secret2Id] },
    });
    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error };
    await fetchSecrets();
    return { success: true };
  }, [adminCode, fetchSecrets]);

  return {
    secrets, dailySecrets, todayStats, leaderboard, todayGuesses, currentDay, loading,
    loadAdminData, addSecret, updateSecret, deleteSecret, addClue, updateClue, deleteClue,
    setDaySecrets, refreshStats: fetchStats,
  };
};
