import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Secret {
  id: string;
  title: string;
  person_name: string;
  is_active: boolean;
  first_found_by: string | null;
  first_found_at: string | null;
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
  is_first_finder: boolean;
  created_at: string;
}

export interface GameConfig {
  id: string;
  start_date: string;
  end_date: string;
}

export const useGame = () => {
  const [allSecrets, setAllSecrets] = useState<Secret[]>([]);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all active secrets
  const fetchSecrets = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch game config
      const { data: config } = await supabase
        .from('game_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (config) {
        setGameConfig(config);
      }

      // Fetch all active secrets
      const { data: secrets, error: secretsError } = await supabase
        .from('secrets')
        .select('*')
        .eq('is_active', true);

      if (secretsError) throw secretsError;

      if (!secrets || secrets.length === 0) {
        setAllSecrets([]);
        return;
      }

      // Fetch all clues for these secrets
      const secretIds = secrets.map(s => s.id);
      const { data: clues, error: cluesError } = await supabase
        .from('clues')
        .select('*')
        .in('secret_id', secretIds);

      if (cluesError) throw cluesError;

      // Combine secrets with their clues
      const secretsWithClues = secrets.map(s => ({
        ...s,
        clues: clues?.filter(c => c.secret_id === s.id) || []
      }));

      setAllSecrets(secretsWithClues);
    } catch (err) {
      console.error('Error fetching secrets:', err);
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get player's guesses
  const getPlayerGuesses = useCallback(async (playerName: string): Promise<Guess[]> => {
    const { data, error } = await supabase
      .from('guesses')
      .select('*')
      .eq('player_name', playerName);

    if (error) {
      console.error('Error fetching player guesses:', error);
      return [];
    }

    return (data || []) as Guess[];
  }, []);

  // Submit a guess
  const submitGuess = useCallback(async (
    playerName: string,
    secretId: string,
    guessName: string
  ): Promise<{ success: boolean; isCorrect?: boolean; isFirstFinder?: boolean; error?: string }> => {
    const { data, error } = await supabase.functions.invoke('submit-guess', {
      body: { playerName, secretId, guessName, day: 1 },
    });

    if (error) {
      console.error('Submit guess error:', error);
      return { success: false, error: error.message };
    }

    if (!data.success) {
      return { success: false, error: data.error };
    }

    // Refresh secrets to get updated first_found_by
    await fetchSecrets();

    return { success: true, isCorrect: data.isCorrect, isFirstFinder: data.isFirstFinder };
  }, [fetchSecrets]);

  useEffect(() => {
    fetchSecrets();
  }, [fetchSecrets]);

  return {
    allSecrets,
    gameConfig,
    loading,
    error,
    getPlayerGuesses,
    submitGuess,
    refreshSecrets: fetchSecrets,
  };
};
