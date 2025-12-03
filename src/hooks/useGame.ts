import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Secret {
  id: string;
  title: string;
  person_name: string;
  is_active: boolean;
  clues: Clue[];
}

export interface Clue {
  id: string;
  secret_id: string;
  text: string;
}

export interface Guess {
  id: string;
  player_name: string;
  secret_id: string;
  day: number;
  guess_name: string;
  is_correct: boolean;
  created_at: string;
}

export interface DailySecrets {
  day: number;
  secret1_id: string | null;
  secret2_id: string | null;
}

export const useGame = () => {
  const [todaySecrets, setTodaySecrets] = useState<Secret[]>([]);
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate the game day (1-10) based on a start date
  const calculateGameDay = useCallback(() => {
    // Game starts December 1st, 2024 (adjust as needed)
    const startDate = new Date('2024-12-01');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // Clamp between 1 and 10
    return Math.max(1, Math.min(10, diffDays));
  }, []);

  // Fetch today's secrets
  const fetchTodaySecrets = useCallback(async () => {
    setLoading(true);
    try {
      const day = calculateGameDay();
      setCurrentDay(day);

      // Get daily secrets config for today
      const { data: dailyConfig, error: dailyError } = await supabase
        .from('daily_secrets')
        .select('*')
        .eq('day', day)
        .maybeSingle();

      if (dailyError) throw dailyError;

      if (!dailyConfig || (!dailyConfig.secret1_id && !dailyConfig.secret2_id)) {
        setTodaySecrets([]);
        return;
      }

      // Get the secret IDs for today
      const secretIds = [dailyConfig.secret1_id, dailyConfig.secret2_id].filter(Boolean);

      if (secretIds.length === 0) {
        setTodaySecrets([]);
        return;
      }

      // Fetch secrets
      const { data: secrets, error: secretsError } = await supabase
        .from('secrets')
        .select('*')
        .in('id', secretIds)
        .eq('is_active', true);

      if (secretsError) throw secretsError;

      // Fetch clues for these secrets
      const { data: clues, error: cluesError } = await supabase
        .from('clues')
        .select('*')
        .in('secret_id', secretIds);

      if (cluesError) throw cluesError;

      // Combine secrets with their clues
      const secretsWithClues = secrets?.map(s => ({
        ...s,
        clues: clues?.filter(c => c.secret_id === s.id) || []
      })) || [];

      setTodaySecrets(secretsWithClues);
    } catch (err) {
      console.error('Error fetching today secrets:', err);
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [calculateGameDay]);

  // Get player's guesses for today
  const getPlayerGuesses = useCallback(async (playerName: string): Promise<Guess[]> => {
    const day = calculateGameDay();
    
    const { data, error } = await supabase
      .from('guesses')
      .select('*')
      .eq('player_name', playerName)
      .eq('day', day);

    if (error) {
      console.error('Error fetching player guesses:', error);
      return [];
    }

    return data || [];
  }, [calculateGameDay]);

  // Check if player has completed today
  const hasPlayerCompletedToday = useCallback(async (playerName: string): Promise<boolean> => {
    const guesses = await getPlayerGuesses(playerName);
    return guesses.length >= 2;
  }, [getPlayerGuesses]);

  // Submit a guess
  const submitGuess = useCallback(async (
    playerName: string,
    secretId: string,
    guessName: string
  ): Promise<{ success: boolean; isCorrect?: boolean; error?: string }> => {
    const day = calculateGameDay();

    const { data, error } = await supabase.functions.invoke('submit-guess', {
      body: { playerName, secretId, guessName, day },
    });

    if (error) {
      console.error('Submit guess error:', error);
      return { success: false, error: error.message };
    }

    if (!data.success) {
      return { success: false, error: data.error };
    }

    return { success: true, isCorrect: data.isCorrect };
  }, [calculateGameDay]);

  useEffect(() => {
    fetchTodaySecrets();
  }, [fetchTodaySecrets]);

  return {
    todaySecrets,
    currentDay,
    loading,
    error,
    getPlayerGuesses,
    hasPlayerCompletedToday,
    submitGuess,
    refreshSecrets: fetchTodaySecrets,
  };
};
