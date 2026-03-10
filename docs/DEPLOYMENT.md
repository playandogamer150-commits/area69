# AREA 69 Deployment Guide

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- API credentials:
  - Replicate API token
  - Fal.ai API key
  - Cloudflare R2 account with bucket

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/playandogamer150-commits/area69.git
cd area69
```

### 2. Configure Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Frontend
cp frontend/.env.example frontend/.env
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `REPLICATE_API_TOKEN` | Your Replicate API token |
| `FAL_KEY` | Your Fal.ai API key |
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `JWT_SECRET_KEY` | Secret key for JWT tokens |
| `CORS_ORIGINS` | Allowed frontend origins, comma separated |
| `BACKEND_PUBLIC_URL` | Public backend origin used by internal callbacks |
| `INTERNAL_API_BASE_URL` | Internal base URL for server-side fetches |
| `STORAGE_PATH` | Filesystem path used for local uploads |

### 3. Start All Services

```bash
docker-compose up -d
```

This will start:
- Backend API (port 8000)
- Frontend (port 3003 in Docker Compose)
- PostgreSQL database (port 5432)
- Redis cache (port 6379)

### 4. Verify Services

```bash
# Check backend health
curl http://localhost:8000/api/v1/health

# Access frontend
open http://localhost:3003
```

## Development

### Running Without Docker

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Production Deployment

### Using Docker Compose

```bash
# Build and start
docker-compose -f docker-compose.yml up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Using Custom Domain

Update nginx.conf with your domain and configure SSL:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # ... rest of config
}
```

## API Documentation

Once running, access the interactive API documentation:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Troubleshooting

### Database Connection Issues

```bash
# Check database logs
docker-compose logs db

# Verify connection
docker-compose exec db psql -U postgres -c "SELECT 1"
```

### R2 Upload Issues

Ensure your R2 bucket is public or use presigned URLs for private files.

### High Memory Usage

For production, consider:
- Increasing container memory limits
- Using a managed PostgreSQL service
- Using a managed Redis service

## Security Considerations

1. **JWT Secret**: Use a strong random string for `JWT_SECRET_KEY`
2. **API Keys**: Never commit API keys to version control
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Implement rate limiting for production

## Monitoring

Add monitoring with:
- Prometheus metrics endpoint
- Grafana dashboards
- Sentry for error tracking

## Backup

Regularly backup:
- PostgreSQL database
- R2 object storage
- Environment configuration
