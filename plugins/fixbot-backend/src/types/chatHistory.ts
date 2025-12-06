// Type definitions for FixBot chat history system

export interface FixBotUser {
  id: number;
  user_id: string; // GitHub user ID or email
  username: string;
  email?: string;
  avatar_url?: string;
  storage_used: number; // bytes
  storage_limit: number; // bytes
  created_at: Date;
  last_login: Date;
}

export interface ChatSession {
  id: number;
  user_id: string;
  session_id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  message_count: number;
}

export interface ChatMessage {
  id: number;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  content_size: number;
  timestamp: Date;
}

export interface StorageInfo {
  used: number; // bytes
  limit: number; // bytes
  percentage: number; // 0-100
  remaining: number; // bytes
  isNearLimit: boolean; // > 80%
  isFull: boolean; // > 95%
}

export interface ChatHistoryRequest {
  user_id: string;
  session_id?: string;
  limit?: number;
  offset?: number;
}

export interface CreateSessionRequest {
  user_id: string;
  title?: string;
}

export interface AddMessageRequest {
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface DeleteSessionRequest {
  session_id: string;
  user_id: string;
}

export interface StorageQuotaResponse {
  user_id: string;
  storage: StorageInfo;
  sessions_count: number;
  messages_count: number;
  oldest_session: Date | null;
}
