
-- Add optional fields for shared album, link, and playlist to event_details
ALTER TABLE public.event_details 
  ADD COLUMN IF NOT EXISTS shared_album_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_link_url text,
  ADD COLUMN IF NOT EXISTS external_link_label text,
  ADD COLUMN IF NOT EXISTS playlist_url text,
  ADD COLUMN IF NOT EXISTS background_style text NOT NULL DEFAULT 'gradient';
