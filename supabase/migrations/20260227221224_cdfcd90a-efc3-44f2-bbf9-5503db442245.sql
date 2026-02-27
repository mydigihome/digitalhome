
-- Gmail tokens table
CREATE TABLE public.gmail_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamp with time zone,
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own gmail tokens"
  ON public.gmail_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tracked threads table
CREATE TABLE public.tracked_threads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  thread_id text NOT NULL,
  subject text,
  sender_name text,
  sender_email text,
  preview text,
  category text NOT NULL DEFAULT 'General',
  status text NOT NULL DEFAULT 'Up to Date',
  last_activity_at timestamp with time zone DEFAULT now(),
  tracked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, thread_id)
);

ALTER TABLE public.tracked_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tracked threads"
  ON public.tracked_threads FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for gmail_tokens updated_at
CREATE TRIGGER update_gmail_tokens_updated_at
  BEFORE UPDATE ON public.gmail_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
