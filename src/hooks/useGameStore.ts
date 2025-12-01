import { useState, useEffect } from 'react';
import { Clue, Player, Guess, GameState } from '@/types/game';

const STORAGE_KEY = 'mystery-personnel-game';

// Sample clues for demonstration
const sampleClues: Clue[] = [
  {
    id: '1',
    day: 1,
    clueNumber: 1,
    content: "Cette personne a toujours une tasse de café à la main, même pendant les réunions du vendredi.",
    answer: "Marie Dupont",
    revealed: true,
    createdAt: new Date(),
  },
  {
    id: '2',
    day: 1,
    clueNumber: 2,
    content: "Son bureau est décoré de photos de chats et d'une collection impressionnante de plantes succulentes.",
    answer: "Jean Martin",
    revealed: true,
    createdAt: new Date(),
  },
];

const getInitialState = (): GameState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    return {
      ...parsed,
      clues: parsed.clues.map((c: Clue) => ({
        ...c,
        createdAt: new Date(c.createdAt),
      })),
      players: parsed.players.map((p: Player) => ({
        ...p,
        lastPlayed: new Date(p.lastPlayed),
      })),
      guesses: parsed.guesses.map((g: Guess) => ({
        ...g,
        timestamp: new Date(g.timestamp),
      })),
    };
  }
  return {
    currentDay: 1,
    players: [],
    clues: sampleClues,
    guesses: [],
  };
};

export const useGameStore = () => {
  const [state, setState] = useState<GameState>(getInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const getCurrentDayClues = (): Clue[] => {
    return state.clues.filter(c => c.day === state.currentDay && c.revealed);
  };

  const addPlayer = (name: string): Player => {
    const existingPlayer = state.players.find(
      p => p.name.toLowerCase() === name.toLowerCase()
    );
    if (existingPlayer) {
      return existingPlayer;
    }

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name,
      score: 0,
      correctAnswers: 0,
      lastPlayed: new Date(),
    };

    setState(prev => ({
      ...prev,
      players: [...prev.players, newPlayer],
    }));

    return newPlayer;
  };

  const submitGuess = (playerId: string, clueId: string, guess: string): boolean => {
    const clue = state.clues.find(c => c.id === clueId);
    if (!clue) return false;

    const alreadyGuessed = state.guesses.some(
      g => g.playerId === playerId && g.clueId === clueId && g.isCorrect
    );
    if (alreadyGuessed) return false;

    const isCorrect = guess.toLowerCase().trim() === clue.answer.toLowerCase().trim();
    
    const newGuess: Guess = {
      id: crypto.randomUUID(),
      playerId,
      clueId,
      guess,
      isCorrect,
      timestamp: new Date(),
    };

    setState(prev => {
      const updatedPlayers = prev.players.map(p => {
        if (p.id === playerId && isCorrect) {
          return {
            ...p,
            score: p.score + 10,
            correctAnswers: p.correctAnswers + 1,
            lastPlayed: new Date(),
          };
        }
        return p;
      });

      return {
        ...prev,
        guesses: [...prev.guesses, newGuess],
        players: updatedPlayers,
      };
    });

    return isCorrect;
  };

  const addClue = (clue: Omit<Clue, 'id' | 'createdAt'>): void => {
    const newClue: Clue = {
      ...clue,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    setState(prev => ({
      ...prev,
      clues: [...prev.clues, newClue],
    }));
  };

  const updateClue = (id: string, updates: Partial<Clue>): void => {
    setState(prev => ({
      ...prev,
      clues: prev.clues.map(c => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const deleteClue = (id: string): void => {
    setState(prev => ({
      ...prev,
      clues: prev.clues.filter(c => c.id !== id),
    }));
  };

  const setCurrentDay = (day: number): void => {
    setState(prev => ({ ...prev, currentDay: day }));
  };

  const getLeaderboard = (): Player[] => {
    return [...state.players].sort((a, b) => b.score - a.score);
  };

  const hasPlayerGuessedClue = (playerId: string, clueId: string): boolean => {
    return state.guesses.some(
      g => g.playerId === playerId && g.clueId === clueId && g.isCorrect
    );
  };

  return {
    state,
    getCurrentDayClues,
    addPlayer,
    submitGuess,
    addClue,
    updateClue,
    deleteClue,
    setCurrentDay,
    getLeaderboard,
    hasPlayerGuessedClue,
  };
};
