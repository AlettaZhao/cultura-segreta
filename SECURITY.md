# Security Policy

## API Keys

Do not put Kimi/Moonshot API keys in frontend code, `VITE_` variables, `localStorage`, screenshots, commits, or GitHub issues.

Use Vercel environment variables:

```text
MOONSHOT_API_KEY
```

The browser should only call `/api/chat`; the serverless function reads the secret and forwards the request to Kimi.

## Reporting Issues

If you find a security issue, please do not publish the secret or exploit details in a public issue. Contact the repository owner directly and include:

- A short description of the issue
- Steps to reproduce
- Potential impact
- Suggested fix, if known

## Deployment Checklist

- `.env` and `.env.local` are ignored by Git.
- `.vercel` is ignored by Git.
- `MOONSHOT_API_KEY` is set in Vercel for Production.
- The deployed app returns a normal response from `/api/chat`.
