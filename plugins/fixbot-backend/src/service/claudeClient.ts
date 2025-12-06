import fetch from 'node-fetch';
import { LoggerService } from '@backstage/backend-plugin-api';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class ClaudeClient {
  private apiKey: string;
  private apiUrl = 'https://api.anthropic.com/v1/messages';
  private model: string;
  
  constructor(
    apiKey: string,
    model: string,
    private logger: LoggerService,
  ) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async chat(messages: ClaudeMessage[]): Promise<string> {
    try {
      this.logger.info('Sending request to Claude API');
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4096,
          messages: messages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Claude API error: ${response.status} - ${errorText}`);
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json() as ClaudeResponse;
      
      this.logger.info('Received response from Claude API');

      return data.content[0].text;
    } catch (error) {
      this.logger.error('Error calling Claude API');
      throw error;
    }
  }

  async fixCode(code: string, issue?: string): Promise<string> {
    const systemPrompt = issue
      ? `You are an expert code reviewer and fixer. The user has the following issue: ${issue}. Analyze the code and provide a fixed version with explanation.`
      : 'You are an expert code reviewer and fixer. Analyze the code and suggest improvements or fixes.';

    const userMessage = `${systemPrompt}\n\nCode:\n\`\`\`\n${code}\n\`\`\`\n\nProvide the fixed code and explanation.`;

    return this.chat([
      {
        role: 'user',
        content: userMessage,
      },
    ]);
  }

  async analyzeCode(code: string): Promise<string> {
    return this.chat([
      {
        role: 'user',
        content: `Analyze this code for potential bugs, security issues, performance problems, and suggest improvements:\n\n\`\`\`\n${code}\n\`\`\``,
      },
    ]);
  }

  async explainCode(code: string): Promise<string> {
    return this.chat([
      {
        role: 'user',
        content: `Explain what this code does in simple terms:\n\n\`\`\`\n${code}\n\`\`\``,
      },
    ]);
  }
}
