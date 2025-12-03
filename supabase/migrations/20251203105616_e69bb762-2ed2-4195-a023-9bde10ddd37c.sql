-- Make player_id nullable since we're using player_name now
ALTER TABLE public.answers ALTER COLUMN player_id DROP NOT NULL;

-- Update existing foreign key constraint if needed
ALTER TABLE public.answers DROP CONSTRAINT IF EXISTS answers_player_id_fkey;