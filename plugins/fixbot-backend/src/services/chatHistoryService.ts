import { Knex } from 'knex';
import {
  FixBotUser,
  ChatSession,
  ChatMessage,
  StorageInfo,
  CreateSessionRequest,
  AddMessageRequest,
  ChatHistoryRequest,
  DeleteSessionRequest,
  StorageQuotaResponse,
} from '../types/chatHistory';
import { v4 as uuidv4 } from 'uuid';

export class ChatHistoryService {
  constructor(
    private readonly database: Knex,
    private readonly logger?: any,
  ) {}

  // Helper to log errors
  private logError(message: string, error: any) {
    if (this.logger) {
      this.logger.error(message, error);
    } else {
      console.error(message, error);
    }
  }

  // ===== USER MANAGEMENT =====

  async getOrCreateUser(
    userId: string,
    username: string,
    email?: string,
    avatarUrl?: string,
  ): Promise<FixBotUser> {
    try {
      const existing = await this.database('fixbot_users')
        .where({ user_id: userId })
        .first();

      if (existing) {
        // Update last login
        await this.database('fixbot_users')
          .where({ user_id: userId })
          .update({ last_login: new Date() });
        return existing;
      }

      // Create new user
      const [user] = await this.database('fixbot_users')
        .insert({
          user_id: userId,
          username,
          email,
          avatar_url: avatarUrl,
          storage_used: 0,
          storage_limit: 52428800, // 50 MB
          created_at: new Date(),
          last_login: new Date(),
        })
        .returning('*');
      
      return user;
    } catch (error) {
      this.logError('Error in getOrCreateUser:', error);
      throw error;
    }

    return user;
  }

  async getUserStorageInfo(userId: string): Promise<StorageInfo> {
    const user = await this.database('fixbot_users')
      .where({ user_id: userId })
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    const used = user.storage_used || 0;
    const limit = user.storage_limit || 52428800;
    const percentage = (used / limit) * 100;
    const remaining = limit - used;

    return {
      used,
      limit,
      percentage: Math.min(percentage, 100),
      remaining: Math.max(remaining, 0),
      isNearLimit: percentage > 80,
      isFull: percentage > 95,
    };
  }

  async getStorageQuota(userId: string): Promise<StorageQuotaResponse> {
    const storage = await this.getUserStorageInfo(userId);

    const sessionsCount = await this.database('fixbot_chat_sessions')
      .where({ user_id: userId })
      .count('* as count')
      .first();

    const messagesCount = await this.database('fixbot_chat_messages')
      .join(
        'fixbot_chat_sessions',
        'fixbot_chat_messages.session_id',
        'fixbot_chat_sessions.session_id',
      )
      .where('fixbot_chat_sessions.user_id', userId)
      .count('* as count')
      .first();

    const oldestSession = await this.database('fixbot_chat_sessions')
      .where({ user_id: userId })
      .orderBy('created_at', 'asc')
      .first();

    return {
      user_id: userId,
      storage,
      sessions_count: Number(sessionsCount?.count || 0),
      messages_count: Number(messagesCount?.count || 0),
      oldest_session: oldestSession ? oldestSession.created_at : null,
    };
  }

  // ===== SESSION MANAGEMENT =====

  async createSession(request: CreateSessionRequest): Promise<ChatSession> {
    const sessionId = uuidv4();
    const [session] = await this.database('fixbot_chat_sessions')
      .insert({
        user_id: request.user_id,
        session_id: sessionId,
        title: request.title || 'New Chat',
        created_at: new Date(),
        updated_at: new Date(),
        message_count: 0,
      })
      .returning('*');

    return session;
  }

  async getSessions(request: ChatHistoryRequest): Promise<ChatSession[]> {
    let query = this.database('fixbot_chat_sessions')
      .where({ user_id: request.user_id })
      .orderBy('updated_at', 'desc');

    if (request.limit) {
      query = query.limit(request.limit);
    }

    if (request.offset) {
      query = query.offset(request.offset);
    }

    return query;
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    return this.database('fixbot_chat_sessions')
      .where({ session_id: sessionId })
      .first();
  }

  async updateSessionTitle(
    sessionId: string,
    title: string,
  ): Promise<void> {
    await this.database('fixbot_chat_sessions')
      .where({ session_id: sessionId })
      .update({ title, updated_at: new Date() });
  }

  async deleteSession(request: DeleteSessionRequest): Promise<void> {
    // Verify ownership
    const session = await this.database('fixbot_chat_sessions')
      .where({ session_id: request.session_id, user_id: request.user_id })
      .first();

    if (!session) {
      throw new Error('Session not found or unauthorized');
    }

    // Delete session (cascade will delete messages)
    await this.database('fixbot_chat_sessions')
      .where({ session_id: request.session_id })
      .delete();
  }

  // ===== MESSAGE MANAGEMENT =====

  async addMessage(request: AddMessageRequest): Promise<ChatMessage> {
    const contentSize = Buffer.byteLength(request.content, 'utf8');

    // Check storage before adding
    const session = await this.getSession(request.session_id);
    if (!session) {
      throw new Error('Session not found');
    }

    const storage = await this.getUserStorageInfo(session.user_id);
    if (storage.remaining < contentSize) {
      throw new Error('Storage quota exceeded. Please delete old chats.');
    }

    const [message] = await this.database('fixbot_chat_messages')
      .insert({
        session_id: request.session_id,
        role: request.role,
        content: request.content,
        content_size: contentSize,
        timestamp: new Date(),
      })
      .returning('*');

    // Update session
    await this.database('fixbot_chat_sessions')
      .where({ session_id: request.session_id })
      .update({
        updated_at: new Date(),
        message_count: this.database.raw('message_count + 1'),
      });

    return message;
  }

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.database('fixbot_chat_messages')
      .where({ session_id: sessionId })
      .orderBy('timestamp', 'asc');
  }

  async deleteOldSessions(userId: string, keepCount: number = 10): Promise<number> {
    // Get sessions to delete (keep only latest N)
    const sessionsToKeep = await this.database('fixbot_chat_sessions')
      .where({ user_id: userId })
      .orderBy('updated_at', 'desc')
      .limit(keepCount)
      .pluck('session_id');

    const deletedCount = await this.database('fixbot_chat_sessions')
      .where({ user_id: userId })
      .whereNotIn('session_id', sessionsToKeep)
      .delete();

    return deletedCount;
  }

  // ===== CLEANUP =====

  async cleanupUserStorage(userId: string): Promise<{
    deleted_sessions: number;
    freed_bytes: number;
  }> {
    const storageBefore = await this.getUserStorageInfo(userId);

    if (!storageBefore.isFull && !storageBefore.isNearLimit) {
      return { deleted_sessions: 0, freed_bytes: 0 };
    }

    // Delete oldest 5 sessions
    const oldestSessions = await this.database('fixbot_chat_sessions')
      .where({ user_id: userId })
      .orderBy('updated_at', 'asc')
      .limit(5)
      .pluck('session_id');

    if (oldestSessions.length > 0) {
      await this.database('fixbot_chat_sessions')
        .whereIn('session_id', oldestSessions)
        .delete();
    }

    const storageAfter = await this.getUserStorageInfo(userId);
    const freedBytes = storageBefore.used - storageAfter.used;

    return {
      deleted_sessions: oldestSessions.length,
      freed_bytes: freedBytes,
    };
  }

  /**
   * Get recent sessions with message preview untuk sidebar
   */
  async getRecentSessions(
    userId: string,
    limit: number = 20,
  ): Promise<
    Array<{
      session_id: string;
      title: string;
      lastMessage: string;
      lastMessageAt: Date;
      messageCount: number;
      createdAt: Date;
      updatedAt: Date;
    }>
  > {
    const sessions = await this.database('fixbot_session_summary')
      .where('user_id', userId)
      .orderBy('updated_at', 'desc')
      .limit(limit);

    return sessions.map((s: any) => ({
      session_id: s.session_id,
      title: s.title,
      lastMessage: s.last_message ? s.last_message.substring(0, 100) : '',
      lastMessageAt: s.last_message_at || s.updated_at,
      messageCount: parseInt(s.message_count, 10) || 0,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<any> {
    const prefs = await this.database('fixbot_user_preferences')
      .where('user_id', userId)
      .first();

    if (!prefs) {
      // Create default preferences
      const [newPrefs] = await this.database('fixbot_user_preferences')
        .insert({
          user_id: userId,
          theme: 'auto',
          language: 'en',
          notifications_enabled: true,
          auto_cleanup_enabled: true,
          preferences: {},
        })
        .returning('*');
      return newPrefs;
    }

    return prefs;
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<{
      theme: string;
      language: string;
      notifications_enabled: boolean;
      auto_cleanup_enabled: boolean;
      preferences: any;
    }>,
  ): Promise<void> {
    await this.database('fixbot_user_preferences')
      .insert({
        user_id: userId,
        ...preferences,
      })
      .onConflict('user_id')
      .merge();
  }
}
