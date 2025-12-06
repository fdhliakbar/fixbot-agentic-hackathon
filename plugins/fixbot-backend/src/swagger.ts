/**
 * Swagger/OpenAPI configuration for FixBot API
 */
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FixBot API Documentation',
      version: '1.0.0',
      description: 'API endpoints for FixBot chat history, storage management, and AI integration',
      contact: {
        name: 'FixBot Team',
        email: 'admin@fixbot.local',
      },
    },
    servers: [
      {
        url: '/api/fixbot',
        description: 'FixBot Backend API',
      },
    ],
    components: {
      securitySchemes: {
        basicAuth: {
          type: 'http',
          scheme: 'basic',
          description: 'Admin authentication with username and password',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            user_id: { type: 'string', example: 'anonymous' },
            username: { type: 'string', example: 'anonymous' },
            email: { type: 'string', nullable: true, example: null },
            storage_used: { type: 'integer', example: 0 },
            storage_limit: { type: 'integer', example: 52428800 },
            created_at: { type: 'string', format: 'date-time' },
            last_login: { type: 'string', format: 'date-time' },
          },
        },
        ChatSession: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            user_id: { type: 'string', example: 'anonymous' },
            session_id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            title: { type: 'string', example: 'New Chat' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            message_count: { type: 'integer', example: 0 },
            metadata: { type: 'object', example: {} },
          },
        },
        ChatMessage: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            session_id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            role: { type: 'string', enum: ['user', 'assistant'], example: 'user' },
            content: { type: 'string', example: 'Hello, how can I help?' },
            content_size: { type: 'integer', example: 25 },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        RecentSession: {
          type: 'object',
          properties: {
            session_id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            title: { type: 'string', example: 'Repository Health Check' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            message_count: { type: 'integer', example: 5 },
            last_message: { type: 'string', example: 'Your repository health score is 85/100' },
            last_message_at: { type: 'string', format: 'date-time' },
          },
        },
        StorageInfo: {
          type: 'object',
          properties: {
            storage_used: { type: 'integer', example: 5242880 },
            storage_limit: { type: 'integer', example: 52428800 },
            percentage: { type: 'number', format: 'float', example: 10.0 },
            isNearLimit: { type: 'boolean', example: false },
            isFull: { type: 'boolean', example: false },
          },
        },
        UserPreferences: {
          type: 'object',
          properties: {
            theme: { type: 'string', enum: ['auto', 'light', 'dark'], example: 'auto' },
            language: { type: 'string', example: 'en' },
            notifications_enabled: { type: 'boolean', example: true },
            auto_cleanup_enabled: { type: 'boolean', example: true },
            preferences: { type: 'object', example: {} },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'An error occurred' },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and registration',
      },
      {
        name: 'Chat Sessions',
        description: 'Manage chat sessions and conversation history',
      },
      {
        name: 'Messages',
        description: 'Send and retrieve chat messages',
      },
      {
        name: 'Storage',
        description: 'Monitor and manage user storage quota',
      },
      {
        name: 'Preferences',
        description: 'User preferences and settings',
      },
      {
        name: 'AI Chat',
        description: 'AI-powered chat interface',
      },
    ],
  },
  apis: ['./src/router.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
