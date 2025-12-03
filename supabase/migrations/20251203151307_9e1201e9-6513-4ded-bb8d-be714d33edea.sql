-- Add first_found_by to track who found each secret first
ALTER TABLE public.secrets ADD COLUMN IF NOT EXISTS first_found_by TEXT DEFAULT NULL;
ALTER TABLE public.secrets ADD COLUMN IF NOT EXISTS first_found_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add is_first_finder to guesses to track if this guess was the first correct one
ALTER TABLE public.guesses ADD COLUMN IF NOT EXISTS is_first_finder BOOLEAN DEFAULT FALSE;

-- Create game_config table for start/end dates
CREATE TABLE IF NOT EXISTS public.game_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  start_date DATE NOT NULL DEFAULT '2024-12-01',
  end_date DATE NOT NULL DEFAULT '2024-12-10',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read game config
CREATE POLICY "Anyone can read game_config" ON public.game_config FOR SELECT USING (true);

-- Insert default config
INSERT INTO public.game_config (start_date, end_date) VALUES ('2024-12-01', '2024-12-10')
ON CONFLICT DO NOTHING;