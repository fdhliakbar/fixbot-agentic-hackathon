-- Database improvements untuk FixBot
-- Add additional indexes, constraints, and tables

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_username ON fixbot_users(username);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON fixbot_users(last_login);
CREATE INDEX IF NOT EXISTS idx_sessions_user_updated ON fixbot_chat_sessions(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_session_created ON fixbot_chat_messages(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_storage_logs_user ON fixbot_storage_logs(user_id, timestamp DESC);

-- Add admin users table for Swagger authentication
CREATE TABLE IF NOT EXISTS fixbot_admin_users (
    admin_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email VARCHAR(255),
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Insert default admin (password: fixbot2025hack - hashed with bcrypt)
-- bcrypt hash for 'fixbot2025hack'
INSERT INTO fixbot_admin_users (username, password_hash, email, role)
VALUES (
    'fixbot',
    '$2b$10$hAIoJEcFjsoryvKL0aN6n.WPxDpWvJ.t/joW/6ptHNuaMhwTksiTK',
    'admin@fixbot.local',
    'admin'
) ON CONFLICT (username) DO NOTHING;

-- Add session_metadata column for storing extra info
ALTER TABLE fixbot_chat_sessions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add user preferences table
CREATE TABLE IF NOT EXISTS fixbot_user_preferences (
    user_id TEXT PRIMARY KEY REFERENCES fixbot_users(user_id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'auto',
    language VARCHAR(10) DEFAULT 'en',
    notifications_enabled BOOLEAN DEFAULT true,
    auto_cleanup_enabled BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-update timestamps
DROP TRIGGER IF EXISTS update_sessions_updated_at ON fixbot_chat_sessions;
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON fixbot_chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_preferences_updated_at ON fixbot_user_preferences;
CREATE TRIGGER update_preferences_updated_at
    BEFORE UPDATE ON fixbot_user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Add constraints
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_storage_positive'
    ) THEN
        ALTER TABLE fixbot_users 
        ADD CONSTRAINT check_storage_positive CHECK (storage_used >= 0);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_storage_limit_minimum'
    ) THEN
        ALTER TABLE fixbot_users 
        ADD CONSTRAINT check_storage_limit_minimum CHECK (storage_limit >= 10485760);
    END IF;
END $$;

-- Create view for session summary
CREATE OR REPLACE VIEW fixbot_session_summary AS
SELECT 
    s.session_id,
    s.user_id,
    u.username,
    s.title,
    s.created_at,
    s.updated_at,
    COUNT(m.id) as message_count,
    SUM(m.content_size) as total_size,
    MAX(m.timestamp) as last_message_at,
    (SELECT content FROM fixbot_chat_messages 
     WHERE session_id = s.session_id 
     ORDER BY timestamp DESC LIMIT 1) as last_message
FROM fixbot_chat_sessions s
LEFT JOIN fixbot_users u ON s.user_id = u.user_id
LEFT JOIN fixbot_chat_messages m ON s.session_id = m.session_id
GROUP BY s.session_id, s.user_id, u.username, s.title, s.created_at, s.updated_at;
