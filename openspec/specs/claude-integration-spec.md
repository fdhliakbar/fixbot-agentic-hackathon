# Claude AI Integration Specification

**Version:** 1.0.0  
**Created:** December 6, 2025  
**Status:** Active  
**Owner:** Backend Team

---

## 1. Overview

This specification defines the integration between FixBot and Claude Sonnet 4 AI model from Anthropic. The integration enables natural language code assistance, bug detection, and automated code fixing capabilities.

---

## 2. Requirements

### 2.1 Functional Requirements

**FR-1: AI Chat Interface**

- System MUST support conversational interactions with Claude AI
- System MUST maintain conversation context across multiple messages
- System MUST support code snippets in both input and output

**FR-2: Code Analysis**

- System MUST analyze code for bugs, errors, and anti-patterns
- System MUST provide quality scores and recommendations
- System MUST support multiple programming languages

**FR-3: Code Generation**

- System MUST generate code fixes based on identified issues
- System MUST provide explanations for suggested changes
- System MUST format output as valid code

### 2.2 Non-Functional Requirements

**NFR-1: Performance**

- API response time MUST be < 10 seconds for 95% of requests
- System MUST handle concurrent requests from multiple users
- Timeout configured at 30 seconds

**NFR-2: Reliability**

- System MUST retry failed requests (max 3 attempts)
- System MUST handle API rate limits gracefully
- System MUST provide fallback responses on failure

**NFR-3: Security**

- API keys MUST be stored securely in configuration
- User code MUST NOT be logged or persisted
- All API calls MUST use HTTPS

---

## 3. API Integration

### 3.1 Claude API Configuration

**Endpoint:** `https://api.anthropic.com/v1/messages`

**Authentication:**

```
x-api-key: ${CLAUDE_API_KEY}
anthropic-version: 2023-06-01
```

**Model:** `claude-sonnet-4-20250514`

**Parameters:**

```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 4096,
  "temperature": 0.7,
  "system": "You are FixBot, an AI code assistant...",
  "messages": [
    {
      "role": "user",
      "content": "User message"
    }
  ]
}
```

### 3.2 Request Format

**System Prompt Template:**

```
You are FixBot, an intelligent code analysis and fixing assistant created by fdhliakbar.

Features:
1. Smart Error Detection: Analyze code and identify bugs, errors, and potential issues
2. Auto-Fix Suggestions: Provide detailed fixing suggestions with code examples
3. Code Quality Analysis: Review code quality, readability, and best practices
4. Real-time Chat: Interactive chat interface for code discussions
5. Repository Scanning: Scan entire repositories for issues
6. Automated PR Creation: Create pull requests with fixes automatically
7. Multi-Language Support: Support for JavaScript, TypeScript, Python, Go, and more

Integration:
- GitHub Integration: Read repos, create branches, commit fixes, open PRs
- Backstage Native: Seamlessly integrated into Backstage catalog

Respond as FixBot when asked about your identity. Provide clear, actionable code assistance.
```

### 3.3 Response Format

**Success Response:**

```json
{
  "id": "msg_xxx",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Here's how to fix the issue..."
    }
  ],
  "model": "claude-sonnet-4-20250514",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 123,
    "output_tokens": 456
  }
}
```

**Error Response:**

```json
{
  "type": "error",
  "error": {
    "type": "rate_limit_error",
    "message": "Rate limit exceeded"
  }
}
```

---

## 4. Implementation

### 4.1 Client Service (`claudeClient.ts`)

```typescript
interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeClientConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

class ClaudeClient {
  constructor(config: ClaudeClientConfig, logger: LoggerService);

  async chat(messages: ClaudeMessage[]): Promise<string>;
  async analyzeCode(code: string, language: string): Promise<AnalysisResult>;
  async fixCode(code: string, issue: string): Promise<FixResult>;
  async explainCode(code: string): Promise<string>;
}
```

### 4.2 Error Handling

**Retry Strategy:**

```typescript
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  backoffMultiplier: 2, // Exponential backoff
  retryableErrors: ['rate_limit_error', 'overloaded_error', 'api_error'],
};
```

**Timeout Configuration:**

```typescript
const TIMEOUT_MS = 30000; // 30 seconds
```

### 4.3 Rate Limiting

**Implementation:**

```typescript
interface RateLimitConfig {
  requestsPerMinute: 50;
  requestsPerHour: 1000;
  tokensPerMinute: 40000;
  tokensPerDay: 1000000;
}
```

**Strategy:**

- Track requests per user/session
- Implement token bucket algorithm
- Queue requests when limit reached
- Return 429 status with retry-after header

---

## 5. Message Transformation

### 5.1 Input Sanitization

**Rules:**

- Strip extra fields (timestamp, metadata)
- Validate message roles (user/assistant only)
- Limit message length (max 100KB)
- Escape special characters

**Transform:**

```typescript
function sanitizeMessages(messages: Message[]): ClaudeMessage[] {
  return messages.map(m => ({
    role: m.role,
    content: m.content.substring(0, 100000), // Limit length
  }));
}
```

### 5.2 Output Formatting

**Code Block Detection:**

````typescript
function formatResponse(response: string): FormattedResponse {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

  return {
    text: response.replace(codeBlockRegex, ''),
    codeBlocks: extractCodeBlocks(response),
  };
}
````

---

## 6. Context Management

### 6.1 System Context

**Injection Strategy:**

- Add system prompt on first message
- Include FixBot identity and capabilities
- Provide context about current user/repo

**Context Window:**

- Maximum: 200K tokens (Claude Sonnet 4)
- Recommended: Keep conversation < 50 messages
- Truncate old messages if limit reached

### 6.2 Conversation History

**Storage:**

- In-memory during session
- No persistent storage (privacy)
- Clear on user logout

**Management:**

```typescript
interface ConversationManager {
  addMessage(message: Message): void;
  getHistory(): Message[];
  clear(): void;
  truncate(maxMessages: number): void;
}
```

---

## 7. Monitoring & Logging

### 7.1 Metrics to Track

- **Request Count**: Total API calls per hour
- **Response Time**: P50, P95, P99 latencies
- **Error Rate**: Failed requests per total
- **Token Usage**: Input/output tokens consumed
- **Cost**: Estimated API cost per day

### 7.2 Logging Strategy

**Log Levels:**

- `INFO`: Request initiated, response received
- `WARN`: Retry attempt, rate limit approaching
- `ERROR`: API failure, timeout, invalid response

**Log Format:**

```json
{
  "timestamp": "2025-12-06T10:30:00Z",
  "level": "INFO",
  "service": "claude-client",
  "event": "api_request",
  "model": "claude-sonnet-4-20250514",
  "inputTokens": 123,
  "outputTokens": 456,
  "duration": 2345,
  "userId": "user-123"
}
```

**Privacy:**

- NEVER log user code content
- NEVER log API keys
- Hash user identifiers

---

## 8. Cost Management

### 8.1 Pricing (Claude Sonnet 4)

- **Input**: $3 per million tokens
- **Output**: $15 per million tokens

### 8.2 Budget Controls

**Limits:**

- Daily token budget: 1M tokens (~$10)
- Per-user limit: 100 requests/day
- Alert when 80% budget consumed

**Optimization:**

- Cache common responses
- Truncate long conversations
- Use lower temperature for deterministic tasks

---

## 9. Testing

### 9.1 Unit Tests

```typescript
describe('ClaudeClient', () => {
  it('should send chat request successfully');
  it('should handle rate limit errors with retry');
  it('should timeout after 30 seconds');
  it('should sanitize message history');
  it('should extract code blocks from response');
});
```

### 9.2 Integration Tests

- Test with real Claude API (staging key)
- Verify response format parsing
- Test error scenarios (invalid key, rate limit)
- Validate retry logic

### 9.3 Load Tests

- 100 concurrent users
- 1000 requests/minute
- Measure P95 latency
- Verify rate limit handling

---

## 10. Acceptance Criteria

- ✅ Chat endpoint returns responses < 10 seconds
- ✅ Conversation history maintained across requests
- ✅ Code blocks properly formatted in output
- ✅ Retry logic handles transient failures
- ✅ Rate limits respected and communicated to users
- ✅ API keys secured and never logged
- ✅ Error messages user-friendly
- ✅ System context includes FixBot identity

---

## 11. References

- [Anthropic Claude API Documentation](https://docs.anthropic.com/claude/reference)
- [Claude Prompt Engineering Guide](https://docs.anthropic.com/claude/docs/prompt-engineering)
- [Rate Limits](https://docs.anthropic.com/claude/reference/rate-limits)

---

**Last Updated:** December 6, 2025  
**Implementation Status:** ✅ Complete
