# Production Deployment Checklist

## Pre-Deploy

### Environment Setup
- [ ] All environment variables configured
- [ ] `CORS_ORIGINS`, `BACKEND_PUBLIC_URL`, `INTERNAL_API_BASE_URL` and `STORAGE_PATH` reviewed
- [ ] `ALLOWED_HOSTS`, `ENABLE_API_DOCS` and `LOG_LEVEL` reviewed
- [ ] API credentials tested (Replicate, Fal.ai, R2)
- [ ] Database migrations executed
- [ ] SSL certificates configured

### Security
- [ ] JWT_SECRET_KEY is unique and secure (64+ characters)
- [ ] POSTGRES_PASSWORD is strong (32+ characters)
- [ ] Rate limiting enabled
- [ ] Content moderation enabled
- [ ] HTTPS configured
- [ ] Security headers configured on frontend hosting
- [ ] Backend hosts restricted to real production domains

### Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Security tests passing
- [ ] Load tested (optional)

## Deploy

### Docker Compose
```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Services Verification
- [ ] Backend API running
- [ ] Frontend accessible via HTTPS
- [ ] PostgreSQL database healthy
- [ ] Redis cache working
- [ ] Celery workers processing tasks
- [ ] Health checks passing
- [ ] Docker/hosting health checks configured

## Post-Deploy

### Functional Testing
- [ ] User registration works
- [ ] Login and JWT works
- [ ] Reference photo upload works
- [ ] LoRA training starts
- [ ] Image generation works
- [ ] Face swap works
- [ ] Video generation works

### Monitoring
- [ ] Logs visible
- [ ] Error tracking (Sentry) configured
- [ ] Cost tracking active
- [ ] Alerts configured

### Maintenance
- [ ] Backup strategy in place
- [ ] Monitoring dashboards set up
- [ ] Runbook documented
