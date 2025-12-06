# FixBot - Security Configuration Guide

## 🔒 Security Setup

This project uses **environment variables** and **Kubernetes secrets** for sensitive data.

### Local Development

1. Copy `app-config.yaml` to `app-config.local.yaml`:
   ```bash
   cp app-config.yaml app-config.local.yaml
   ```

2. Edit `app-config.local.yaml` with your credentials:
   ```yaml
   backend:
     database:
       connection:
         host: ${POSTGRES_HOST}
         port: ${POSTGRES_PORT}
         user: ${POSTGRES_USER}
         password: ${POSTGRES_PASSWORD}
   ```

3. Set environment variables:
   ```powershell
   $env:POSTGRES_HOST = "your-host"
   $env:POSTGRES_USER = "your-user"
   $env:POSTGRES_PASSWORD = "your-password"
   $env:CLAUDE_API_KEY = "your-api-key"
   ```

### Kubernetes Production

1. Copy secrets template:
   ```bash
   cp k8s/secrets.yaml.template k8s/secrets.yaml
   ```

2. Edit `k8s/secrets.yaml` with actual values

3. Apply to cluster:
   ```bash
   kubectl apply -f k8s/secrets.yaml
   ```

4. **Never commit `k8s/secrets.yaml`** (already in .gitignore)

## 📁 Protected Files

These files are automatically ignored by Git:

- `credentials/` - All credential files
- `k8s/secrets.yaml` - Kubernetes secrets
- `*.local.yaml` - Local config overrides
- `*.tar` - Docker image exports

## ⚠️ Before Push/PR

Check for leaked secrets:
```bash
git diff --cached | Select-String -Pattern "api.*key|password|secret"
```

## 🔐 API Keys Used

- **Claude API**: Anthropic Claude Sonnet 4
- **GitHub OAuth**: Client ID + Secret
- **PostgreSQL**: Database credentials
