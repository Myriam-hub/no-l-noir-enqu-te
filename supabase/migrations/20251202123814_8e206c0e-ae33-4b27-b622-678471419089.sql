-- Create players table with the 20 fixed players
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clues table
CREATE TABLE public.clues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day DATE NOT NULL,
  clue_number INTEGER NOT NULL CHECK (clue_number IN (1, 2)),
  text TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(day, clue_number)
);

-- Create answers table to track player responses
CREATE TABLE public.answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  clue_id UUID NOT NULL REFERENCES public.clues(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  response TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(player_id, clue_id)
);

-- Enable RLS on all tables
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Players table: everyone can read
CREATE POLICY "Anyone can read players" ON public.players FOR SELECT USING (true);

-- Clues table: everyone can read clues for today or past days
CREATE POLICY "Anyone can read clues" ON public.clues FOR SELECT USING (day <= CURRENT_DATE);

-- Answers table: anyone can read and insert
CREATE POLICY "Anyone can read answers" ON public.answers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert answers" ON public.answers FOR INSERT WITH CHECK (true);

-- Insert the 20 default players (placeholder names - admin can update)
INSERT INTO public.players (name) VALUES
  ('Joueur 1'),
  ('Joueur 2'),
  ('Joueur 3'),
  ('Joueur 4'),
  ('Joueur 5'),
  ('Joueur 6'),
  ('Joueur 7'),
  ('Joueur 8'),
  ('Joueur 9'),
  ('Joueur 10'),
  ('Joueur 11'),
  ('Joueur 12'),
  ('Joueur 13'),
  ('Joueur 14'),
  ('Joueur 15'),
  ('Joueur 16'),
  ('Joueur 17'),
  ('Joueur 18'),
  ('Joueur 19'),
  ('Joueur 20');