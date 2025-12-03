-- Add RLS policy for user_roles table (admin-only access via service role)
CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());