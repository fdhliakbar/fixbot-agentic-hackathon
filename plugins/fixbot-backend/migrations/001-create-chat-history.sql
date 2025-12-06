-- Chat History Schema for FixBot
-- Stores user conversations with storage limits

-- Users table (stores authenticated users)
CREATE TABLE IF NOT EXISTS fixbot_users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL, -- GitHub user ID or email
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    avatar_url TEXT,
    storage_used BIGINT DEFAULT 0, -- Storage in bytes
    storage_limit BIGINT DEFAULT 52428800, -- 50 MB default limit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat sessions table
CREATE TABLE IF NOT EXISTS fixbot_chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES fixbot_users(user_id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) DEFAULT 'New Chat',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message_count INTEGER DEFAULT 0
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS fixbot_chat_messages (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL REFERENCES fixbot_chat_sessions(session_id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    content_size INTEGER NOT NULL, -- Size in bytes
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Storage usage tracking
CREATE TABLE IF NOT EXISTS fixbot_storage_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES fixbot_users(user_id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'add', 'delete'
    size_delta BIGINT NOT NULL, -- Positive or negative bytes
    storage_after BIGINT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_user_id ON fixbot_users(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON fixbot_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON fixbot_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON fixbot_chat_messages(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_storage_logs_user_id ON fixbot_storage_logs(user_id);

-- Function to update storage usage
CREATE OR REPLACE FUNCTION update_user_storage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE fixbot_users 
        SET storage_used = storage_used + NEW.content_size
        WHERE user_id = (
            SELECT user_id FROM fixbot_chat_sessions WHERE session_id = NEW.session_id
        );
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE fixbot_users 
        SET storage_used = storage_used - OLD.content_size
        WHERE user_id = (
            SELECT user_id FROM fixbot_chat_sessions WHERE session_id = OLD.session_id
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update storage
CREATE TRIGGER trigger_update_storage
AFTER INSERT OR DELETE ON fixbot_chat_messages
FOR EACH ROW EXECUTE FUNCTION update_user_storage();

-- Function to clean old messages when storage is full
CREATE OR REPLACE FUNCTION cleanup_old_messages(p_user_id VARCHAR, p_limit_mb INTEGER DEFAULT 50)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    current_storage BIGINT;
    storage_limit_bytes BIGINT := p_limit_mb * 1024 * 1024;
BEGIN
    -- Get current storage
    SELECT storage_used INTO current_storage
    FROM fixbot_users
    WHERE user_id = p_user_id;
    
    -- If over limit, delete oldest messages
    IF current_storage > storage_limit_bytes THEN
        WITH oldest_sessions AS (
            SELECT session_id 
            FROM fixbot_chat_sessions
            WHERE user_id = p_user_id
            ORDER BY updated_at ASC
            LIMIT 5
        )
        DELETE FROM fixbot_chat_messages
        WHERE session_id IN (SELECT session_id FROM oldest_sessions);
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
    END IF;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
