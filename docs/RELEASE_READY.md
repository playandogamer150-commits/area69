# Release Ready

## Branch

- Current branch: `codex/hardening-initial-audit`
- Remote: `origin -> https://github.com/playandogamer150-commits/area69.git`

## Commits Prepared

- `f559ab4` Harden config and restore frontend quality gates
- `7abea95` Secure auth tokens and Pix activation flow
- `6887632` Enforce resource ownership across uploads and user data
- `c21c01e` Harden production deploy defaults and security headers

## Required Production Variables

### Vercel (`frontend`)

```env
VITE_API_BASE_URL=https://api.seu-dominio.com/api/v1
VITE_ENABLE_NSFW_CONTROLS=true
VITE_ENABLE_VIDEO_GENERATION=true
VITE_ENABLE_FACE_SWAP=true
VITE_MAX_FILE_SIZE=10485760
VITE_MAX_REFERENCE_PHOTOS=20
VITE_TASK_POLL_INTERVAL=5000
VITE_TASK_POLL_MAX_ATTEMPTS=120
```

### Render Web Service (`backend`)

```env
ENVIRONMENT=production
ENABLE_API_DOCS=false
LOG_LEVEL=INFO
JWT_SECRET_KEY=<secret forte com 64+ caracteres>
DATABASE_URL=<Render PostgreSQL internal/external URL>
REDIS_URL=<Redis URL real se for usar Celery/rate limiting>
BACKEND_PUBLIC_URL=https://api.seu-dominio.com
INTERNAL_API_BASE_URL=https://api.seu-dominio.com
CORS_ORIGINS=https://seu-dominio.com,https://www.seu-dominio.com
ALLOWED_HOSTS=api.seu-dominio.com
STORAGE_PATH=/app/storage
REPLICATE_API_TOKEN=<token real>
REPLICATE_OWNER=<owner real>
WAVESPEED_API_KEY=<token real>
FAL_KEY=<token real>
R2_ACCOUNT_ID=<id real>
R2_ACCESS_KEY_ID=<key real>
R2_SECRET_ACCESS_KEY=<secret real>
R2_BUCKET_NAME=<bucket real>
R2_PUBLIC_BASE_URL=<public base url real>
EFI_CLIENT_ID=<client id real>
EFI_CLIENT_SECRET=<client secret real>
EFI_PIX_KEY=<pix key real>
EFI_CERT_PATH=/app/backend/.certs/efi-cert.p12
EFI_CERT_PASSWORD=<senha do certificado se existir>
EFI_SANDBOX=false
PIX_DEFAULT_AMOUNT_CENTS=4990
```

## Pre-Push Checklist

- Fill real variables in Vercel and Render
- Confirm production domains for `CORS_ORIGINS` and `ALLOWED_HOSTS`
- Confirm Render service start command / Docker deployment mode
- Confirm whether Redis will be provisioned now or later
- Confirm EFI certificate delivery strategy (`EFI_CERT_PATH` vs `EFI_CERT_BASE64`)

## Push Command

```bash
git push -u origin codex/hardening-initial-audit
```

## Suggested Merge Flow

1. Push branch
2. Deploy branch or preview if available
3. Validate login, Pix, upload, LoRA, generation, dashboard
4. Merge into `main`
5. Trigger production rollout
