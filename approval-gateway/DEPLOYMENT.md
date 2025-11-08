# Deployment Guide

This guide covers deploying the BrandPilot Approval Gateway to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Platform-Specific Guides](#platform-specific-guides)
4. [Post-Deployment](#post-deployment)
5. [Monitoring & Maintenance](#monitoring--maintenance)

## Pre-Deployment Checklist

### Security

- [ ] Generate strong `WEBHOOK_SIGNING_SECRET` (min 32 chars)
- [ ] Rotate all default secrets and API keys
- [ ] Enable HTTPS/TLS for all endpoints
- [ ] Configure Twilio webhook signature validation
- [ ] Set up firewall rules (allow only necessary ports)
- [ ] Review Redis security (password, TLS, network isolation)

### Infrastructure

- [ ] Provision production Redis instance (managed service recommended)
- [ ] Set up Redis backup/persistence
- [ ] Configure Redis memory limits and eviction policy
- [ ] Ensure Redis high availability (replica/sentinel)
- [ ] Set up health check endpoints
- [ ] Configure log aggregation

### Configuration

- [ ] Validate all environment variables
- [ ] Set proper `CORE_DECISION_WEBHOOK` URL
- [ ] Configure Twilio production numbers
- [ ] Test WhatsApp/iMessage connectivity
- [ ] Set appropriate rate limits for production load
- [ ] Configure proper deadline timeouts

### Testing

- [ ] Run full test suite: `make test`
- [ ] Test end-to-end approval flow in staging
- [ ] Load test rate limiting
- [ ] Test webhook failure/retry scenarios
- [ ] Verify timeout handling
- [ ] Test Redis failover

## Environment Setup

### Production Environment Variables

```bash
# Server
PORT=8080

# Redis (use managed service)
REDIS_URL=rediss://user:password@prod-redis.example.com:6380/0

# Core service
CORE_DECISION_WEBHOOK=https://api.brandpilot.com/decisions

# Twilio (production credentials)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_production_token
TWILIO_WA_NUMBER=whatsapp:+14155551234
OWNER_WA_NUMBER=whatsapp:+15555551234

# Photon iMessage Kit
PHOTON_BASE_URL=http://imessage-kit:5173
PHOTON_TO=owner@company.com

# Security (generate strong secret)
WEBHOOK_SIGNING_SECRET=$(openssl rand -hex 32)

# Rate limiting (tune for production load)
WA_BUCKET_CAPACITY=10
WA_BUCKET_REFILL_PER_MIN=2
IMSG_BUCKET_CAPACITY=10
IMSG_BUCKET_REFILL_PER_MIN=2
MIN_SPACING_SEC=15
```

### Redis Configuration

**Managed Redis (Recommended):**

- AWS ElastiCache
- Google Cloud Memorystore
- Azure Cache for Redis
- Upstash (serverless)

**Self-Hosted Redis:**

```conf
# redis.conf

# Security
requirepass your-strong-password-here
bind 0.0.0.0
protected-mode yes

# Persistence
save 900 1
save 300 10
save 60 10000
appendonly yes

# Memory
maxmemory 2gb
maxmemory-policy allkeys-lru

# Replication (if using replicas)
min-replicas-to-write 1
min-replicas-max-lag 10
```

## Platform-Specific Guides

### Docker Deployment

**1. Build image:**

```bash
docker build -t brandpilot-approval-gateway:latest .
```

**2. Run container:**

```bash
docker run -d \
  --name approval-gateway \
  -p 8080:8080 \
  --env-file .env.production \
  brandpilot-approval-gateway:latest
```

**3. With docker-compose:**

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  gateway:
    image: brandpilot-approval-gateway:latest
    ports:
      - "8080:8080"
    env_file:
      - .env.production
    restart: always
    depends_on:
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/"]
      interval: 30s
      timeout: 3s
      retries: 3

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: always

volumes:
  redis_data:
```

### Railway

**1. Install Railway CLI:**

```bash
npm install -g @railway/cli
```

**2. Initialize and deploy:**

```bash
railway login
railway init
railway up
```

**3. Set environment variables:**

```bash
railway variables set REDIS_URL=redis://...
railway variables set TWILIO_ACCOUNT_SID=AC...
# ... set all other variables
```

**4. Add Redis plugin:**

```bash
railway add --plugin redis
```

### Render

**1. Create `render.yaml`:**

```yaml
services:
  - type: web
    name: approval-gateway
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: REDIS_URL
        fromService:
          name: redis
          property: connectionString
      - key: TWILIO_ACCOUNT_SID
        sync: false
      - key: TWILIO_AUTH_TOKEN
        sync: false
      - key: WEBHOOK_SIGNING_SECRET
        generateValue: true

  - type: redis
    name: redis
    ipAllowList: []
    plan: starter
```

**2. Deploy:**

```bash
render deploy
```

### Fly.io

**1. Create `fly.toml`:**

```toml
app = "brandpilot-gateway"
primary_region = "sjc"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [services.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20

[[services.http_checks]]
  interval = 10000
  timeout = 2000
  grace_period = "5s"
  method = "get"
  path = "/"
```

**2. Create Redis:**

```bash
fly redis create
```

**3. Deploy:**

```bash
fly deploy
```

**4. Set secrets:**

```bash
fly secrets set TWILIO_ACCOUNT_SID=AC...
fly secrets set TWILIO_AUTH_TOKEN=...
```

### AWS (ECS + Fargate)

**1. Create ECR repository:**

```bash
aws ecr create-repository --repository-name brandpilot-gateway
```

**2. Build and push:**

```bash
docker build -t brandpilot-gateway .
docker tag brandpilot-gateway:latest $ECR_URI:latest
docker push $ECR_URI:latest
```

**3. Create task definition (task-def.json):**

```json
{
  "family": "approval-gateway",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [{
    "name": "gateway",
    "image": "$ECR_URI:latest",
    "portMappings": [{
      "containerPort": 8080,
      "protocol": "tcp"
    }],
    "environment": [
      {"name": "PORT", "value": "8080"}
    ],
    "secrets": [
      {"name": "REDIS_URL", "valueFrom": "arn:aws:secretsmanager:..."},
      {"name": "TWILIO_ACCOUNT_SID", "valueFrom": "arn:aws:secretsmanager:..."}
    ]
  }]
}
```

**4. Create service:**

```bash
aws ecs create-service \
  --cluster production \
  --service-name approval-gateway \
  --task-definition approval-gateway \
  --desired-count 2 \
  --launch-type FARGATE
```

## Post-Deployment

### Verification Steps

**1. Health check:**

```bash
curl https://your-domain.com/
```

Expected: `{"service": "brandpilot-approval-gateway", "status": "ok"}`

**2. Send test candidate:**

```bash
python tools/seed_candidate.py --url https://your-domain.com
```

**3. Verify WhatsApp message received**

**4. Test approval flow**

**5. Check decision callback:**

Monitor your core service logs for incoming decisions.

### Configure Twilio Webhook

1. Go to Twilio Console → Messaging → Settings → WhatsApp Sandbox Settings
2. Set "When a message comes in" to: `https://your-domain.com/webhooks/whatsapp`
3. Method: `POST`
4. Save

### Set Up SSL/TLS

**Let's Encrypt (recommended):**

```bash
# Using certbot
certbot --nginx -d your-domain.com
```

**Or use platform-provided SSL** (Railway, Render, Fly.io handle this automatically)

## Monitoring & Maintenance

### Logging

**Structured logging:**

```python
# Add to app/main.py
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","msg":"%(message)s"}',
    handlers=[logging.StreamHandler(sys.stdout)]
)
```

**Log aggregation services:**

- Datadog
- New Relic
- Loggly
- CloudWatch (AWS)

### Metrics

**Key metrics to track:**

- Request rate (candidates/min)
- Decision latency (ms)
- Rate limit hits
- Timeout count
- Error rate
- Redis memory usage

**Prometheus endpoint (optional):**

```python
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app)
```

### Alerts

**Set up alerts for:**

- High error rate (> 5%)
- High latency (> 5s)
- Redis connection failures
- Twilio API failures
- Decision webhook failures
- Timeout rate spike

### Backup & Recovery

**Redis backups:**

```bash
# Daily backup script
redis-cli --rdb /backups/dump-$(date +%Y%m%d).rdb
```

**State recovery:**

If Redis fails, candidates in-flight will expire. No permanent data loss since all activity is logged.

### Scaling

**Horizontal scaling:**

The service is stateless (Redis holds state), so you can scale horizontally:

```bash
# Docker Swarm
docker service scale approval-gateway=5

# Kubernetes
kubectl scale deployment approval-gateway --replicas=5

# Railway/Render
# Use platform UI to increase instance count
```

**Vertical scaling:**

Increase CPU/memory if seeing resource constraints.

### Database Maintenance

**Redis:**

```bash
# Monitor memory
redis-cli INFO memory

# Check key count
redis-cli DBSIZE

# Expire old activity logs (older than 30 days)
# Add to cron:
redis-cli --scan --pattern "activity:*" | xargs redis-cli DEL
```

### Updates & Rollbacks

**Blue-green deployment:**

1. Deploy new version to separate instance
2. Test thoroughly
3. Switch traffic
4. Keep old version running for quick rollback

**Rolling updates:**

```bash
# Kubernetes
kubectl set image deployment/approval-gateway gateway=new-image:v2

# Docker Swarm
docker service update --image new-image:v2 approval-gateway
```

**Rollback:**

```bash
# Kubernetes
kubectl rollout undo deployment/approval-gateway

# Docker Swarm
docker service update --rollback approval-gateway
```

## Troubleshooting

### High Latency

- Check Redis connection latency
- Review rate limit settings
- Increase instance count
- Optimize database queries

### Memory Issues

- Check Redis memory usage
- Review activity log retention
- Increase instance memory
- Set Redis maxmemory-policy

### Connection Errors

- Verify Redis connectivity
- Check firewall rules
- Validate TLS certificates
- Review network policies

### Webhook Failures

- Verify Twilio signature validation
- Check HTTPS certificate
- Review webhook URL configuration
- Test with Twilio webhook tester

## Security Best Practices

1. **Rotate secrets regularly** (quarterly)
2. **Use managed Redis** with encryption
3. **Enable rate limiting** at multiple layers
4. **Monitor for anomalies**
5. **Keep dependencies updated** (`pip-audit`)
6. **Use least-privilege IAM roles**
7. **Enable audit logging**
8. **Review access logs regularly**

---

For additional support, consult the main [README.md](README.md) and [EXAMPLES.md](EXAMPLES.md).

