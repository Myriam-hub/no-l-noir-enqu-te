import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Player {
  id: string;
  name: string;
  created_at: string;
}

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
  player_id: string;
  clue_id: string;
  day: string;
  response: string;
  is_correct: boolean;
  created_at: string;
}

export interface PlayerScore {
  player_id: string;
  name: string;
  score: number;
  answers_today: number;
}

export const useSupabaseGame = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [todayClues, setTodayClues] = useState<Clue[]>([]);
  const [allClues, setAllClues] = useState<Clue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // Fetch players
  const fetchPlayers = useCallback(async () => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching players:', error);
      setError(error.message);
    } else {
      setPlayers(data || []);
    }
  }, []);

  // Fetch today's clues
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

  // Fetch all clues (for admin)
  const fetchAllClues = useCallback(async () => {
    const { data, error } = await supabase
      .from('clues')
      .select('*')
      .order('day', { ascending: false })
      .order('clue_number');

    if (error) {
      console.error('Error fetching all clues:', error);
    } else {
      setAllClues(data || []);
    }
  }, []);

  // Get player's answers for today
  const getPlayerTodayAnswers = useCallback(async (playerId: string): Promise<Answer[]> => {
    const { data, error } = await supabase
      .from('answers')
      .select('*')
      .eq('player_id', playerId)
      .eq('day', today);

    if (error) {
      console.error('Error fetching player answers:', error);
      return [];
    }
    return data || [];
  }, [today]);

  // Check if player has completed today
  const hasPlayerCompletedToday = useCallback(async (playerId: string): Promise<boolean> => {
    const answers = await getPlayerTodayAnswers(playerId);
    return answers.length >= 2;
  }, [getPlayerTodayAnswers]);

  // Submit an answer
  const submitAnswer = useCallback(async (
    playerId: string,
    clueId: string,
    response: string,
    clue: Clue
  ): Promise<{ success: boolean; isCorrect: boolean; error?: string }> => {
    // Check if already answered this clue
    const { data: existingAnswer } = await supabase
      .from('answers')
      .select('*')
      .eq('player_id', playerId)
      .eq('clue_id', clueId)
      .maybeSingle();

    if (existingAnswer) {
      return { success: false, isCorrect: false, error: 'Déjà répondu à cet indice' };
    }

    // Check if answer is correct (case insensitive)
    const isCorrect = response.toLowerCase().trim() === clue.answer.toLowerCase().trim();

    const { error } = await supabase
      .from('answers')
      .insert({
        player_id: playerId,
        clue_id: clueId,
        day: today,
        response: response.trim(),
        is_correct: isCorrect,
      });

    if (error) {
      console.error('Error submitting answer:', error);
      return { success: false, isCorrect: false, error: error.message };
    }

    return { success: true, isCorrect };
  }, [today]);

  // Get leaderboard (total scores)
  const getLeaderboard = useCallback(async (): Promise<PlayerScore[]> => {
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('*');

    if (playersError) {
      console.error('Error fetching players for leaderboard:', playersError);
      return [];
    }

    const { data: answersData, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .eq('is_correct', true);

    if (answersError) {
      console.error('Error fetching answers for leaderboard:', answersError);
      return [];
    }

    const { data: todayAnswersData } = await supabase
      .from('answers')
      .select('*')
      .eq('day', today);

    const scores: PlayerScore[] = (playersData || []).map(player => {
      const correctAnswers = (answersData || []).filter(a => a.player_id === player.id);
      const todayAnswers = (todayAnswersData || []).filter(a => a.player_id === player.id);
      return {
        player_id: player.id,
        name: player.name,
        score: correctAnswers.length,
        answers_today: todayAnswers.length,
      };
    });

    return scores.sort((a, b) => b.score - a.score);
  }, [today]);

  // Admin: Add clue
  const addClue = useCallback(async (
    day: string,
    clueNumber: number,
    text: string,
    answer: string
  ): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase
      .from('clues')
      .insert({ day, clue_number: clueNumber, text, answer });

    if (error) {
      console.error('Error adding clue:', error);
      return { success: false, error: error.message };
    }

    await fetchAllClues();
    await fetchTodayClues();
    return { success: true };
  }, [fetchAllClues, fetchTodayClues]);

  // Admin: Update clue
  const updateClue = useCallback(async (
    id: string,
    updates: Partial<Omit<Clue, 'id' | 'created_at'>>
  ): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase
      .from('clues')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating clue:', error);
      return { success: false, error: error.message };
    }

    await fetchAllClues();
    await fetchTodayClues();
    return { success: true };
  }, [fetchAllClues, fetchTodayClues]);

  // Admin: Delete clue
  const deleteClue = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase
      .from('clues')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting clue:', error);
      return { success: false, error: error.message };
    }

    await fetchAllClues();
    await fetchTodayClues();
    return { success: true };
  }, [fetchAllClues, fetchTodayClues]);

  // Admin: Update player name
  const updatePlayerName = useCallback(async (
    id: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase
      .from('players')
      .update({ name })
      .eq('id', id);

    if (error) {
      console.error('Error updating player name:', error);
      return { success: false, error: error.message };
    }

    await fetchPlayers();
    return { success: true };
  }, [fetchPlayers]);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchPlayers(), fetchTodayClues(), fetchAllClues()]);
      setLoading(false);
    };
    init();
  }, [fetchPlayers, fetchTodayClues, fetchAllClues]);

  return {
    players,
    todayClues,
    allClues,
    loading,
    error,
    today,
    fetchPlayers,
    fetchTodayClues,
    fetchAllClues,
    getPlayerTodayAnswers,
    hasPlayerCompletedToday,
    submitAnswer,
    getLeaderboard,
    addClue,
    updateClue,
    deleteClue,
    updatePlayerName,
  };
};
