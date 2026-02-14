
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS welcome_video_url TEXT DEFAULT 'https://www.loom.com/embed/your-video-id';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS welcome_video_watched BOOLEAN DEFAULT false;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS profiles_last_login_idx ON profiles(last_login);
