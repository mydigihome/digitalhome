
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('student', 'main_account', 'moderator', 'super_admin');

-- Create user_roles table (roles MUST be in separate table)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'main_account',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Super admin can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin') OR auth.uid() = user_id);

CREATE POLICY "Super admin can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Update profiles RLS: super admin can view all profiles
CREATE POLICY "Super admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Super admin can update any profile
CREATE POLICY "Super admin can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Add status column to feedback table
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Super admin feedback policies
CREATE POLICY "Super admin can view all feedback"
  ON public.feedback FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can update all feedback"
  ON public.feedback FOR UPDATE
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can delete all feedback"
  ON public.feedback FOR DELETE
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Super admin policies for all data tables (SELECT only for analytics)
CREATE POLICY "Super admin can view all projects"
  ON public.projects FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can view all tasks"
  ON public.tasks FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can view all notes"
  ON public.notes FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can view all expenses"
  ON public.expenses FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can view all resource_engagements"
  ON public.resource_engagements FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
