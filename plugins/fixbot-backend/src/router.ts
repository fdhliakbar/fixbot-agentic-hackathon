import { LoggerService, RootConfigService } from '@backstage/backend-plugin-api';
import { InputError, NotFoundError } from '@backstage/errors';
import express from 'express';
import Router from 'express-promise-router';
import swaggerUi from 'swagger-ui-express';
import { ClaudeClient, ClaudeMessage } from './service/claudeClient';
import { ChatHistoryService } from './services/chatHistoryService';
import { createAdminAuthMiddleware } from './services/adminAuthMiddleware';
import { swaggerSpec } from './swagger';
import Knex from 'knex';

export async function createRouter({
  logger,
  config,
}: {
  logger: LoggerService;
  config: RootConfigService;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  // Initialize Claude client
  const claudeApiKey = config.getString('fixbot.claude.apiKey');
  const claudeModel = config.getString('fixbot.claude.model');
  const claudeClient = new ClaudeClient(claudeApiKey, claudeModel, logger);

  // Initialize database connection
  const dbHost = config.getString('fixbot.database.host');
  const dbPort = config.getNumber('fixbot.database.port');
  const dbUser = config.getString('fixbot.database.user');
  const dbPassword = config.getString('fixbot.database.password');
  const dbName = config.getString('fixbot.database.database');

  const knex = Knex({
    client: 'pg',
    connection: {
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      ssl: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createTimeoutMillis: 30000,
      propagateCreateError: false,
    },
    acquireConnectionTimeout: 30000,
  });

  // Test database connection and setup error handling
  knex.raw('SELECT 1')
    .then(() => logger.info('Database connection established'))
    .catch(err => logger.error('Database connection failed:', err));

  // Handle connection errors
  knex.on('query-error', (error: Error) => {
    logger.error('Database query error:', error);
  });

  // Initialize chat history service
  const chatHistoryService = new ChatHistoryService(knex, logger);

  // Initialize admin authentication middleware
  const adminAuth = createAdminAuthMiddleware({ knex });

  // Swagger API Documentation (protected by admin auth)
  router.use('/api-docs', adminAuth, swaggerUi.serve);
  router.get('/api-docs', adminAuth, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'FixBot API Documentation',
  }));

  // Middleware to extract user from Backstage token
  const getUserFromToken = (req: express.Request): string => {
    // Try to get from Backstage token in authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // Backstage token is a JWT (header.payload.signature)
        const token = authHeader.substring(7);
        
        // JWT payload is the second part (split by .)
        const parts = token.split('.');
        if (parts.length >= 2) {
          // Decode the payload (base64url encoded)
          const payload = JSON.parse(
            Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
          );
          
          // Extract user entity ref (e.g., "user:default/fdhliakbar")
          if (payload.sub) {
            logger.info(`Authenticated user from JWT: ${payload.sub}`);
            return payload.sub;
          }
        }
      } catch (error) {
        logger.warn('Failed to decode Backstage JWT token', error);
      }
    }
    
    // Fallback to X-User-Id header or anonymous
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    logger.info(`Using user (fallback): ${userId}`);
    return userId;
  };

  // Helper to retry database operations on connection errors
  async function retryDatabaseOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 2,
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        const isConnectionError = 
          error.message?.includes('Connection terminated') ||
          error.message?.includes('Connection closed') ||
          error.message?.includes('ECONNREFUSED') ||
          error.code === 'ECONNRESET' ||
          error.code === '57P01'; // PostgreSQL admin shutdown
        
        if (isConnectionError && attempt < maxRetries) {
          logger.warn(`Database connection error, retrying (${attempt + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        throw error;
      }
    }
    
    throw lastError;
  }

  /**
   * @openapi
   * /health:
   *   get:
   *     summary: Health check endpoint
   *     description: Returns the health status of the FixBot API
   *     tags: [System]
   *     responses:
   *       200:
   *         description: Service is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: ok
   *                 model:
   *                   type: string
   *                   example: claude-sonnet-4-20250514
   */
  router.get('/health', (_req, res) => {
    logger.info('Health check');
    res.json({ status: 'ok', model: claudeModel });
  });

  // ===== CHAT HISTORY ENDPOINTS =====

  /**
   * @openapi
   * /auth/user:
   *   post:
   *     summary: Get or create user
   *     description: Auto-creates user on first access with default storage quota
   *     tags: [Authentication]
   *     responses:
   *       200:
   *         description: User retrieved or created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   type: object
   *                   properties:
   *                     userId:
   *                       type: string
   *                     username:
   *                       type: string
   *                     storageUsed:
   *                       type: integer
   *                     storageLimit:
   *                       type: integer
   */
  router.post('/auth/user', async (req, res) => {
    try {
      const userId = getUserFromToken(req);
      const username = userId.split(':').pop() || userId; // Extract username from 'user:default/username'
      const user = await retryDatabaseOperation(() =>
        chatHistoryService.getOrCreateUser(userId, username)
      );
      
      res.json({ 
        user: {
          userId: user.user_id,
          storageUsed: user.storage_used,
          storageLimit: user.storage_limit,
        }
      });
    } catch (error) {
      logger.error('Error in auth/user endpoint', error);
      res.status(500).json({ 
        error: 'Failed to authenticate user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get user's storage quota info
  router.get('/storage-quota', async (req, res) => {
    try {
      const userId = getUserFromToken(req);
      const quota = await chatHistoryService.getStorageQuota(userId);
      
      res.json({ quota });
    } catch (error) {
      logger.error('Error in storage-quota endpoint', error);
      res.status(500).json({ 
        error: 'Failed to get storage quota',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get recent sessions untuk sidebar
  router.get('/sessions/recent', async (req, res) => {
    try {
      const userId = getUserFromToken(req);
      const limit = parseInt(req.query.limit as string) || 20;
      
      const sessions = await chatHistoryService.getRecentSessions(userId, limit);
      
      res.json({ sessions });
    } catch (error) {
      logger.error('Error in get recent sessions endpoint', error);
      res.status(500).json({ 
        error: 'Failed to get recent sessions',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Manual storage cleanup
  router.post('/cleanup-storage', async (req, res) => {
    try {
      const userId = getUserFromToken(req);
      const result = await chatHistoryService.cleanupUserStorage(userId);
      
      res.json({ 
        message: 'Storage cleanup completed',
        deletedSessions: result.deletedSessions,
        freedSpace: result.freedSpace,
      });
    } catch (error) {
      logger.error('Error in cleanup-storage endpoint', error);
      res.status(500).json({ 
        error: 'Failed to cleanup storage',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get all chat sessions for user
  router.get('/sessions', async (req, res) => {
    try {
      const userId = getUserFromToken(req);
      const sessions = await chatHistoryService.getSessions(userId);
      
      res.json({ sessions });
    } catch (error) {
      logger.error('Error in get sessions endpoint', error);
      res.status(500).json({ 
        error: 'Failed to get sessions',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Create new chat session
  router.post('/sessions', async (req, res) => {
    try {
      const userId = getUserFromToken(req);
      const { title } = req.body;
      
      logger.info(`Creating session for user: ${userId}, title: ${title}`);
      
      // Ensure user exists first
      const username = userId.split(':').pop() || userId;
      await retryDatabaseOperation(() =>
        chatHistoryService.getOrCreateUser(userId, username)
      );
      
      const session = await retryDatabaseOperation(() =>
        chatHistoryService.createSession({
          user_id: userId,
          title: title || 'New Chat'
        })
      );
      
      logger.info(`Session created: ${session.session_id}`);
      res.json({ session });
    } catch (error) {
      logger.error('Error in create session endpoint', error);
      res.status(500).json({ 
        error: 'Failed to create session',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get single session with details
  router.get('/sessions/:sessionId', async (req, res) => {
    try {
      const userId = getUserFromToken(req);
      const { sessionId } = req.params;
      
      const session = await chatHistoryService.getSession(sessionId);
      
      if (!session || session.user_id !== userId) {
        throw new NotFoundError('Session not found');
      }
      
      res.json({ session });
    } catch (error) {
      logger.error('Error in get session endpoint', error);
      if (error instanceof NotFoundError) {
        res.status(404).json({ 
          error: 'Session not found',
          message: error.message,
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to get session',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  });

  // Update session title
  router.patch('/sessions/:sessionId', async (req, res) => {
    try {
      const userId = getUserFromToken(req);
      const { sessionId } = req.params;
      const { title } = req.body;
      
      const session = await chatHistoryService.getSession(sessionId);
      if (!session || session.user_id !== userId) {
        throw new NotFoundError('Session not found');
      }
      
      await chatHistoryService.updateSessionTitle(sessionId, title);
      
      res.json({ message: 'Session title updated' });
    } catch (error) {
      logger.error('Error in update session endpoint', error);
      if (error instanceof NotFoundError) {
        res.status(404).json({ 
          error: 'Session not found',
          message: error.message,
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to update session',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  });

  // Delete chat session
  router.delete('/sessions/:sessionId', async (req, res) => {
    try {
      const userId = getUserFromToken(req);
      const { sessionId } = req.params;
      
      const session = await chatHistoryService.getSession(sessionId);
      if (!session || session.user_id !== userId) {
        throw new NotFoundError('Session not found');
      }
      
      await chatHistoryService.deleteSession(sessionId);
      
      res.json({ message: 'Session deleted successfully' });
    } catch (error) {
      logger.error('Error in delete session endpoint', error);
      if (error instanceof NotFoundError) {
        res.status(404).json({ 
          error: 'Session not found',
          message: error.message,
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to delete session',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  });

  // Get messages for a session
  router.get('/sessions/:sessionId/messages', async (req, res) => {
    try {
      const userId = getUserFromToken(req);
      const { sessionId } = req.params;
      
      const session = await chatHistoryService.getSession(sessionId);
      if (!session || session.user_id !== userId) {
        throw new NotFoundError('Session not found');
      }
      
      const messages = await chatHistoryService.getMessages(sessionId);
      
      res.json({ messages });
    } catch (error) {
      logger.error('Error in get messages endpoint', error);
      if (error instanceof NotFoundError) {
        res.status(404).json({ 
          error: 'Session not found',
          message: error.message,
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to get messages',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  });

  // Add message to session
  router.post('/sessions/:sessionId/messages', async (req, res) => {
    try {
      const userId = getUserFromToken(req);
      const { sessionId } = req.params;
      const { role, content } = req.body;
      
      if (!role || !content) {
        throw new InputError('Role and content are required');
      }
      
      const session = await chatHistoryService.getSession(sessionId);
      if (!session || session.user_id !== userId) {
        throw new NotFoundError('Session not found');
      }
      
      const message = await chatHistoryService.addMessage(userId, sessionId, role, content);
      
      res.json({ message });
    } catch (error) {
      logger.error('Error in add message endpoint', error);
      if (error instanceof NotFoundError) {
        res.status(404).json({ 
          error: 'Session not found',
          message: error.message,
        });
      } else if (error instanceof InputError) {
        res.status(400).json({ 
          error: 'Invalid input',
          message: error.message,
        });
      } else if (error instanceof Error && error.message.includes('Storage quota exceeded')) {
        res.status(507).json({ 
          error: 'Storage quota exceeded',
          message: error.message,
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to add message',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  });

  // ===== USER PREFERENCES ENDPOINTS =====

  // Get user preferences
  router.get('/preferences', async (req, res) => {
    try {
      const userId = getUserFromToken(req);
      const preferences = await chatHistoryService.getUserPreferences(userId);
      
      res.json(preferences);
    } catch (error) {
      logger.error('Error in get preferences endpoint', error);
      res.status(500).json({ 
        error: 'Failed to get preferences',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Update user preferences
  router.put('/preferences', async (req, res) => {
    try {
      const userId = getUserFromToken(req);
      const { theme, language, notifications_enabled, auto_cleanup_enabled, preferences } = req.body;
      
      await chatHistoryService.updateUserPreferences(userId, {
        theme,
        language,
        notifications_enabled,
        auto_cleanup_enabled,
        preferences,
      });
      
      res.json({ message: 'Preferences updated successfully' });
    } catch (error) {
      logger.error('Error in update preferences endpoint', error);
      res.status(500).json({ 
        error: 'Failed to update preferences',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Chat endpoint (with history persistence)
  router.post('/chat', async (req, res) => {
    try {
      const { message, conversationHistory, sessionId } = req.body;
      const userId = getUserFromToken(req);
      
      if (!message) {
        throw new InputError('Message is required');
      }

      logger.info(`Received chat message: ${message.substring(0, 50)}...`);

      // Ensure user exists
      const username = userId.split(':').pop() || userId;
      await chatHistoryService.getOrCreateUser(userId, username);

      // Transform conversationHistory to strip extra fields (like timestamp) that Claude API doesn't accept
      const messages: ClaudeMessage[] = (conversationHistory || []).map((m: any) => ({
        role: m.role,
        content: m.content,
      }));
      
      // Add system context if this is the first message
      if (messages.length === 0) {
        messages.push({
          role: 'user',
          content: `You are FixBot, an AI-powered code fixing assistant created by fdhliakbar for a hackathon. 

About FixBot:
- Created by: fdhliakbar
- Purpose: Intelligent code analysis and automatic bug fixing for Backstage
- Powered by: Claude Sonnet 4 (Anthropic AI)
- Platform: Backstage Plugin

FixBot Features:
1. **AI Chat Assistant**: Answer coding questions and provide solutions in any language
2. **Code Analysis**: Analyze code for bugs, vulnerabilities, and performance issues
3. **Auto-Fix**: Automatically fix common code issues and suggest improvements
4. **Code Explanation**: Explain complex code in simple terms
5. **Repository Health Scoring**: Scan repositories and provide health scores
6. **Smart Suggestions**: Give actionable recommendations for code improvement
7. **Multi-Language Support**: Support for JavaScript, TypeScript, Python, Go, and more

Integration:
- GitHub Integration: Read repos, create branches, commit fixes, open PRs
- Backstage Native: Seamlessly integrated into Backstage catalog

Respond as FixBot when asked about your identity. Now respond to the user's question.`,
        });
        messages.push({
          role: 'assistant',
          content: 'Understood! I am FixBot, ready to help with code fixing and analysis.',
        });
      }
      
      messages.push({
        role: 'user',
        content: message,
      });

      const aiResponse = await claudeClient.chat(messages);

      // Save messages to database if sessionId provided
      if (sessionId) {
        try {
          logger.info(`Attempting to save messages to session ${sessionId} for user ${userId}`);
          
          // Verify session exists and belongs to user
          const session = await retryDatabaseOperation(() => 
            chatHistoryService.getSession(sessionId)
          );
          
          if (!session) {
            logger.warn(`Session ${sessionId} not found, cannot save messages`);
          } else if (session.user_id !== userId) {
            logger.warn(`Session ${sessionId} does not belong to user ${userId}`);
          } else {
            // Save user message
            await retryDatabaseOperation(() =>
              chatHistoryService.addMessage({
                session_id: sessionId,
                role: 'user',
                content: message,
              })
            );
            logger.info(`User message saved to session ${sessionId}`);
            
            // Save AI response
            await retryDatabaseOperation(() =>
              chatHistoryService.addMessage({
                session_id: sessionId,
                role: 'assistant',
                content: aiResponse,
              })
            );
            logger.info(`AI response saved to session ${sessionId}`);
          }
        } catch (saveError) {
          logger.error('Failed to save messages to history:', saveError);
          // Don't fail the request if history save fails
        }
      } else {
        logger.info('No sessionId provided, messages not saved to database');
      }

      res.json({ response: aiResponse });
    } catch (error) {
      logger.error('Error in chat endpoint', error);
      if (error instanceof Error && error.message.includes('Storage quota exceeded')) {
        res.status(507).json({ 
          error: 'Storage quota exceeded',
          message: error.message,
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to get response from AI',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  });

  // Fix code endpoint
  router.post('/fix-code', async (req, res) => {
    try {
      const { code, issue } = req.body;
      
      if (!code) {
        throw new InputError('Code is required');
      }

      logger.info('Received code fix request');

      const fixedCode = await claudeClient.fixCode(code, issue);

      res.json({ fixedCode });
    } catch (error) {
      logger.error('Error in fix-code endpoint');
      res.status(500).json({ 
        error: 'Failed to fix code',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Analyze code endpoint
  router.post('/analyze', async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        throw new InputError('Code is required');
      }

      logger.info('Received code analysis request');

      const analysis = await claudeClient.analyzeCode(code);

      res.json({ analysis });
    } catch (error) {
      logger.error('Error in analyze endpoint');
      res.status(500).json({ 
        error: 'Failed to analyze code',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Explain code endpoint
  router.post('/explain', async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        throw new InputError('Code is required');
      }

      logger.info('Received code explanation request');

      const explanation = await claudeClient.explainCode(code);

      res.json({ explanation });
    } catch (error) {
      logger.error('Error in explain endpoint');
      res.status(500).json({ 
        error: 'Failed to explain code',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
