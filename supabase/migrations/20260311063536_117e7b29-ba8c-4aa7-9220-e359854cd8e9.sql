
-- Tighten waitlist insert policy to require matching user_id or email
DROP POLICY "Users can join waitlist" ON public.content_planner_waitlist;
CREATE POLICY "Users can join waitlist"
ON public.content_planner_waitlist
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
