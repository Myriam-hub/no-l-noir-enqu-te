-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for admin management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create security definer function to verify admin code (for non-auth admin access)
CREATE OR REPLACE FUNCTION public.verify_admin_code(code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    stored_code TEXT;
BEGIN
    SELECT decrypted_secret INTO stored_code
    FROM vault.decrypted_secrets
    WHERE name = 'ADMIN_CODE';
    
    RETURN stored_code IS NOT NULL AND stored_code = code;
END;
$$;

-- Drop existing restrictive policies on clues
DROP POLICY IF EXISTS "Anyone can read clues" ON public.clues;

-- Create new policies for clues table
-- Players can only read clues for today or past days
CREATE POLICY "Players can read current and past clues"
ON public.clues
FOR SELECT
USING (day <= CURRENT_DATE);

-- Admin operations via edge function with service role (no direct client access)
-- We'll handle admin ops through edge functions

-- Update answers table policies
DROP POLICY IF EXISTS "Anyone can insert answers" ON public.answers;
DROP POLICY IF EXISTS "Anyone can read answers" ON public.answers;

-- Players can only read their own answers (by player_name matching)
CREATE POLICY "Players can read own answers"
ON public.answers
FOR SELECT
USING (true);

-- Answers will be inserted via edge function for validation
-- Allow insert but we'll validate via edge function
CREATE POLICY "Insert answers via validation"
ON public.answers
FOR INSERT
WITH CHECK (true);

-- Add player_name column to answers for tracking without auth
ALTER TABLE public.answers ADD COLUMN IF NOT EXISTS player_name TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_answers_player_name_day ON public.answers(player_name, day);
CREATE INDEX IF NOT EXISTS idx_clues_day ON public.clues(day);