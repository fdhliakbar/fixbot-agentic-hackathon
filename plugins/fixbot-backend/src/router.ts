import { LoggerService, RootConfigService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import express from 'express';
import Router from 'express-promise-router';
import { ClaudeClient, ClaudeMessage } from './service/claudeClient';

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

  // Health check
  router.get('/health', (_req, res) => {
    logger.info('Health check');
    res.json({ status: 'ok', model: claudeModel });
  });

  // Chat endpoint
  router.post('/chat', async (req, res) => {
    try {
      const { message, conversationHistory } = req.body;
      
      if (!message) {
        throw new InputError('Message is required');
      }

      logger.info(`Received chat message: ${message.substring(0, 50)}...`);

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

      res.json({ response: aiResponse });
    } catch (error) {
      logger.error('Error in chat endpoint');
      res.status(500).json({ 
        error: 'Failed to get response from AI',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
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
