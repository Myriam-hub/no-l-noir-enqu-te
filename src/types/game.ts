export interface Clue {
  id: string;
  day: number;
  clueNumber: 1 | 2;
  content: string;
  answer: string;
  revealed: boolean;
  createdAt: Date;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
  lastPlayed: Date;
}

export interface Guess {
  id: string;
  playerId: string;
  clueId: string;
  guess: string;
  isCorrect: boolean;
  timestamp: Date;
}

export interface GameState {
  currentDay: number;
  players: Player[];
  clues: Clue[];
  guesses: Guess[];
}
