# Proposal: GitHub Repository Integration

**Status:** 🟡 Proposed  
**Created:** December 6, 2025  
**Author:** fdhliakbar  
**Priority:** High  
**Target:** Post-Hackathon (Phase 2)

---

## 1. Problem Statement

Currently, FixBot can analyze code snippets provided by users in chat. However, to provide maximum value, FixBot needs to:

1. **Scan entire repositories** for issues across all files
2. **Create pull requests** with automated fixes
3. **Track fix history** and show repository health metrics
4. **Integrate with GitHub workflows** (CI/CD, code review)

Without GitHub integration, users must manually copy/paste code, limiting FixBot's effectiveness for large codebases.

---

## 2. Proposed Solution

Implement full GitHub API integration to enable:

### 2.1 Repository Scanning

- Fetch entire repository contents
- Analyze all files matching pattern (e.g., `src/**/*.ts`)
- Generate comprehensive issue report
- Prioritize issues by severity

### 2.2 Automated PR Creation

- Create feature branches for fixes
- Commit fixed code with descriptive messages
- Open pull request with detailed description
- Link to FixBot analysis report

### 2.3 Repository Health Dashboard

- Display health score (0-100)
- Show issue trends over time
- Track fix acceptance rate
- Compare with industry benchmarks

### 2.4 Workflow Integration

- Trigger on push/PR events (GitHub Actions)
- Comment on PRs with analysis
- Auto-suggest fixes in code review
- Block merges if critical issues found

---

## 3. Technical Approach

### 3.1 GitHub OAuth Setup

**Scopes Required:**

```
repo              # Full repository access
read:user         # User profile information
write:packages    # Package registry access (future)
```

**OAuth Flow:**

1. User clicks "Connect GitHub" in FixBot settings
2. Redirect to GitHub OAuth authorization
3. User approves permissions
4. GitHub redirects back with access token
5. Store token securely (encrypted in database)

### 3.2 GitHub API Client

**Implementation:**

```typescript
import { Octokit } from '@octokit/rest';

interface GitHubClientConfig {
  token: string;
  userAgent: string;
}

class GitHubClient {
  private octokit: Octokit;

  constructor(config: GitHubClientConfig);

  // Repository Operations
  async getRepository(owner: string, repo: string): Promise<Repository>;
  async listFiles(owner: string, repo: string, path: string): Promise<File[]>;
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
  ): Promise<string>;

  // Branch Operations
  async createBranch(
    owner: string,
    repo: string,
    branch: string,
    sha: string,
  ): Promise<void>;
  async commitFiles(
    owner: string,
    repo: string,
    branch: string,
    files: FileChange[],
  ): Promise<void>;

  // Pull Request Operations
  async createPullRequest(
    owner: string,
    repo: string,
    pr: PullRequestParams,
  ): Promise<PullRequest>;
  async commentOnPR(
    owner: string,
    repo: string,
    prNumber: number,
    comment: string,
  ): Promise<void>;

  // Webhook Operations
  async createWebhook(
    owner: string,
    repo: string,
    url: string,
    events: string[],
  ): Promise<void>;
}
```

### 3.3 Repository Scanner

**Algorithm:**

```
1. Fetch repository file tree
2. Filter files by extension (.js, .ts, .py, etc.)
3. Fetch content for each file (parallel, batch of 10)
4. Send to Claude API for analysis
5. Aggregate results by severity
6. Generate report with statistics
```

**Performance Optimization:**

- Cache file contents (1 hour TTL)
- Parallel API calls (10 concurrent)
- Skip large files (> 1MB)
- Rate limit respecting (5000 req/hour)

### 3.4 PR Creation Flow

```
1. User selects fixes to apply
2. Create branch: `fixbot/auto-fix-{timestamp}`
3. For each fix:
   a. Fetch original file
   b. Apply fix (patch/replace)
   c. Commit to branch
4. Create PR with description:
   - Summary of changes
   - List of fixes applied
   - Link to FixBot analysis
5. Notify user via Backstage notification
```

---

## 4. API Endpoints

### 4.1 Repository Scan

```
POST /api/fixbot/scan-repo
Content-Type: application/json

{
  "owner": "fdhliakbar",
  "repo": "my-project",
  "branch": "main",
  "include": ["src/**/*.ts"],
  "exclude": ["**/*.test.ts"]
}

Response:
{
  "scanId": "scan-20251206-123",
  "status": "in_progress",
  "totalFiles": 45,
  "estimatedTime": 180
}
```

### 4.2 Get Scan Results

```
GET /api/fixbot/scan-results/{scanId}

Response:
{
  "scanId": "scan-20251206-123",
  "status": "completed",
  "repository": {
    "owner": "fdhliakbar",
    "repo": "my-project",
    "branch": "main"
  },
  "summary": {
    "totalFiles": 45,
    "filesWithIssues": 12,
    "totalIssues": 28,
    "critical": 3,
    "high": 8,
    "medium": 12,
    "low": 5
  },
  "healthScore": 78,
  "issues": [
    {
      "file": "src/utils/auth.ts",
      "line": 42,
      "severity": "critical",
      "type": "security",
      "message": "SQL injection vulnerability",
      "suggestion": "Use parameterized queries"
    }
  ]
}
```

### 4.3 Create Auto-Fix PR

```
POST /api/fixbot/create-fix-pr
Content-Type: application/json

{
  "scanId": "scan-20251206-123",
  "fixes": [
    {
      "issueId": "issue-001",
      "file": "src/utils/auth.ts",
      "action": "apply_fix"
    }
  ]
}

Response:
{
  "pullRequest": {
    "number": 123,
    "url": "https://github.com/owner/repo/pull/123",
    "branch": "fixbot/auto-fix-20251206",
    "status": "open"
  },
  "appliedFixes": 3,
  "filesChanged": 2
}
```

---

## 5. UI Components

### 5.1 Repository Selector

```tsx
<RepositorySelector
  onSelect={repo => handleRepoSelect(repo)}
  placeholder="Select GitHub repository..."
  showRecent={true}
/>
```

### 5.2 Scan Results Dashboard

```
┌──────────────────────────────────────────┐
│ Repository Health Score: 78/100         │
│ ███████████████░░░░░░░░                 │
├──────────────────────────────────────────┤
│ 📊 Issues by Severity                   │
│   🔴 Critical: 3                        │
│   🟠 High: 8                            │
│   🟡 Medium: 12                         │
│   🟢 Low: 5                             │
├──────────────────────────────────────────┤
│ 📁 Files with Issues (12/45)            │
│   src/utils/auth.ts        [3 issues]   │
│   src/api/users.ts         [2 issues]   │
│   src/components/Form.tsx  [1 issue]    │
└──────────────────────────────────────────┘
```

### 5.3 PR Creation Dialog

```tsx
<PRCreationDialog
  fixes={selectedFixes}
  onConfirm={(branch, description) => createPR()}
  onCancel={() => closeDialog()}
/>
```

---

## 6. Database Schema

### 6.1 Repository Scans

```sql
CREATE TABLE repository_scans (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  owner VARCHAR(255) NOT NULL,
  repo VARCHAR(255) NOT NULL,
  branch VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  total_files INT,
  files_with_issues INT,
  health_score INT,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 6.2 Scan Issues

```sql
CREATE TABLE scan_issues (
  id UUID PRIMARY KEY,
  scan_id UUID REFERENCES repository_scans(id),
  file_path VARCHAR(500) NOT NULL,
  line_number INT,
  severity VARCHAR(50) NOT NULL,
  type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  suggestion TEXT,
  fixed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 6.3 Pull Requests

```sql
CREATE TABLE fixbot_pull_requests (
  id UUID PRIMARY KEY,
  scan_id UUID REFERENCES repository_scans(id),
  pr_number INT NOT NULL,
  pr_url VARCHAR(500) NOT NULL,
  branch VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  applied_fixes INT NOT NULL,
  files_changed INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  merged_at TIMESTAMP
);
```

---

## 7. Security Considerations

### 7.1 Token Storage

- Encrypt access tokens at rest (AES-256)
- Store in secure database (PostgreSQL)
- Never log tokens
- Rotate tokens every 90 days

### 7.2 Permissions Validation

- Verify user has write access before creating PRs
- Check repo visibility before scanning
- Respect .gitignore patterns
- Allow users to revoke access anytime

### 7.3 Rate Limiting

- Respect GitHub API rate limits (5000 req/hour)
- Implement exponential backoff
- Queue scans during high demand
- Show estimated wait time to users

---

## 8. Dependencies

### 8.1 NPM Packages

```json
{
  "@octokit/rest": "^20.0.0",
  "@octokit/auth-oauth": "^5.0.0",
  "simple-git": "^3.20.0",
  "ignore": "^5.3.0"
}
```

### 8.2 Backstage Integration

- `@backstage/plugin-catalog` - Entity references
- `@backstage/plugin-scaffolder` - PR templates
- `@backstage/integration-github` - GitHub auth

---

## 9. Testing Strategy

### 9.1 Unit Tests

- GitHubClient methods
- File content parsing
- PR description generation
- Issue aggregation logic

### 9.2 Integration Tests

- OAuth flow with test account
- Repository scanning (sample repo)
- Branch creation and commits
- PR creation and commenting

### 9.3 E2E Tests

- Complete scan-to-PR workflow
- Error handling scenarios
- Rate limit behavior
- Webhook processing

---

## 10. Rollout Plan

### Phase 1: MVP (1 week)

- [x] OAuth setup
- [ ] Repository scanning (single file)
- [ ] Issue detection and display
- [ ] Basic UI components

### Phase 2: Core Features (2 weeks)

- [ ] Multi-file scanning
- [ ] PR creation
- [ ] Health score calculation
- [ ] Scan history

### Phase 3: Advanced (3 weeks)

- [ ] GitHub Actions integration
- [ ] PR comments
- [ ] Trend analysis
- [ ] Custom rules

---

## 11. Success Metrics

### 11.1 Adoption

- 100+ repositories scanned in first month
- 50+ PRs created
- 80% user satisfaction rating

### 11.2 Performance

- Scan time < 5 minutes for repos < 100 files
- PR creation < 30 seconds
- 99.9% uptime

### 11.3 Quality

- 90% of fixes accepted by users
- 70% of PRs merged
- < 5% false positives

---

## 12. Risks & Mitigations

### Risk 1: GitHub Rate Limits

**Mitigation:**

- Implement caching strategy
- Queue scans during off-peak hours
- Use GraphQL API for batch queries

### Risk 2: Large Repositories

**Mitigation:**

- Set file size limits (< 1MB)
- Skip binary files
- Allow selective scanning by path

### Risk 3: Security Vulnerabilities

**Mitigation:**

- Regular security audits
- Encrypt sensitive data
- Implement token expiration
- Follow least privilege principle

---

## 13. Open Questions

1. Should we support GitLab/Bitbucket? (Future consideration)
2. How to handle monorepos? (Selective path scanning)
3. Should fixes be auto-merged? (No, require human approval)
4. Support for private repositories? (Yes, with proper OAuth scopes)

---

## 14. References

- [GitHub REST API](https://docs.github.com/en/rest)
- [Octokit.js](https://github.com/octokit/octokit.js)
- [GitHub OAuth Apps](https://docs.github.com/en/apps/oauth-apps)
- [Backstage GitHub Integration](https://backstage.io/docs/integrations/github/)

---

**Next Steps:**

1. Review proposal with team
2. Approve GitHub OAuth app
3. Create detailed implementation tasks
4. Assign to developer(s)
5. Begin Phase 1 development

**Estimated Effort:** 6 weeks (1 developer)  
**Timeline:** January - February 2026
