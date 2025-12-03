import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Clue {
  id: string;
  day: string;
  clue_number: number;
  text: string;
  answer: string;
  created_at: string;
}

export interface Answer {
  id: string;
  player_name: string;
  clue_id: string;
  day: string;
  response: string;
  is_correct: boolean;
  created_at: string;
}

export interface PlayerScore {
  name: string;
  score: number;
  answers_today: number;
}

export const useSupabaseGame = () => {
  const [todayClues, setTodayClues] = useState<Clue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // Fetch today's clues (available to players)
  const fetchTodayClues = useCallback(async () => {
    const { data, error } = await supabase
      .from('clues')
      .select('*')
      .eq('day', today)
      .order('clue_number');

    if (error) {
      console.error('Error fetching today clues:', error);
    } else {
      setTodayClues(data || []);
    }
  }, [today]);

  // Get player's answers for today (by player name)
  const getPlayerTodayAnswers = useCallback(async (playerName: string): Promise<Answer[]> => {
    const normalizedName = playerName.trim().toLowerCase();
    const { data, error } = await supabase
      .from('answers')
      .select('*')
      .eq('player_name', normalizedName)
      .eq('day', today);

    if (error) {
      console.error('Error fetching player answers:', error);
      return [];
    }
    return (data || []) as Answer[];
  }, [today]);

  // Check if player has completed today
  const hasPlayerCompletedToday = useCallback(async (playerName: string): Promise<boolean> => {
    const answers = await getPlayerTodayAnswers(playerName);
    return answers.length >= 2;
  }, [getPlayerTodayAnswers]);

  // Submit an answer via edge function (secure)
  const submitAnswer = useCallback(async (
    playerName: string,
    clueId: string,
    response: string
  ): Promise<{ success: boolean; isCorrect: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('submit-answer', {
        body: {
          playerName,
          clueId,
          response,
          day: today,
        },
      });

      if (error) {
        console.error('Submit answer error:', error);
        return { success: false, isCorrect: false, error: error.message };
      }

      if (data.error) {
        return { success: false, isCorrect: false, error: data.error };
      }

      return { success: true, isCorrect: data.isCorrect };
    } catch (err) {
      console.error('Submit answer exception:', err);
      return { success: false, isCorrect: false, error: 'Erreur de connexion' };
    }
  }, [today]);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchTodayClues();
      setLoading(false);
    };
    init();
  }, [fetchTodayClues]);

  return {
    todayClues,
    loading,
    error,
    today,
    fetchTodayClues,
    getPlayerTodayAnswers,
    hasPlayerCompletedToday,
    submitAnswer,
  };
};
