ALTER TABLE studio_profile ADD COLUMN IF NOT EXISTS youtube_handle text;
ALTER TABLE studio_profile ADD COLUMN IF NOT EXISTS youtube_channel_id text;
ALTER TABLE studio_profile ADD COLUMN IF NOT EXISTS youtube_subscribers int default 0;
ALTER TABLE studio_profile ADD COLUMN IF NOT EXISTS youtube_total_views bigint default 0;
ALTER TABLE studio_profile ADD COLUMN IF NOT EXISTS youtube_video_count int default 0;
ALTER TABLE studio_profile ADD COLUMN IF NOT EXISTS youtube_recent_videos jsonb;
ALTER TABLE studio_profile ADD COLUMN IF NOT EXISTS youtube_connected boolean default false;
ALTER TABLE studio_profile ADD COLUMN IF NOT EXISTS youtube_synced_at timestamptz;