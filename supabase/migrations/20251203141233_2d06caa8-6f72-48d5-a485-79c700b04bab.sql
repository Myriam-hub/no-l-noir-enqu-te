-- Drop existing tables that will be replaced
DROP TABLE IF EXISTS public.answers CASCADE;
DROP TABLE IF EXISTS public.clues CASCADE;

-- Create secrets table (max 20 secrets, each belonging to a person)
CREATE TABLE public.secrets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  person_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clues table (multiple clues per secret)
CREATE TABLE public.clues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  secret_id UUID NOT NULL REFERENCES public.secrets(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily_secrets table (which 2 secrets are shown each day)
CREATE TABLE public.daily_secrets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day INTEGER NOT NULL CHECK (day >= 1 AND day <= 10),
  secret1_id UUID REFERENCES public.secrets(id) ON DELETE SET NULL,
  secret2_id UUID REFERENCES public.secrets(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(day)
);

-- Create guesses table (player guesses for secrets)
CREATE TABLE public.guesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  secret_id UUID NOT NULL REFERENCES public.secrets(id) ON DELETE CASCADE,
  day INTEGER NOT NULL CHECK (day >= 1 AND day <= 10),
  guess_name TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(player_name, secret_id)
);

-- Enable RLS on all tables
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guesses ENABLE ROW LEVEL SECURITY;

-- RLS policies for secrets (players can only see active secrets)
CREATE POLICY "Anyone can read active secrets" ON public.secrets
  FOR SELECT USING (is_active = true);

-- RLS policies for clues (anyone can read clues of active secrets)
CREATE POLICY "Anyone can read clues" ON public.clues
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.secrets WHERE id = secret_id AND is_active = true)
  );

-- RLS policies for daily_secrets (anyone can read)
CREATE POLICY "Anyone can read daily_secrets" ON public.daily_secrets
  FOR SELECT USING (true);

-- RLS policies for guesses
CREATE POLICY "Anyone can read guesses" ON public.guesses
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert guesses" ON public.guesses
  FOR INSERT WITH CHECK (true);

-- Initialize the 10 days
INSERT INTO public.daily_secrets (day) VALUES 
  (1), (2), (3), (4), (5), (6), (7), (8), (9), (10);