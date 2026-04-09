
-- Add priority column to contacts
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS priority boolean DEFAULT false;

-- Add widget order columns to user_preferences
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS widget_order_left jsonb DEFAULT NULL;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS widget_order_right jsonb DEFAULT NULL;
