

## RUNBOOK.md (Operational Guide)

```bash
# Operations Runbook for Three-Tier Demo App

## Table of Contents
1. [System Overview](#system-overview)
2. [Health Checks](#health-checks)
3. [Common Operations](#common-operations)
4. [Troubleshooting Guides](#troubleshooting-guides)
5. [Backup & Recovery](#backup--recovery)
6. [Performance Tuning](#performance-tuning)
7. [Security Procedures](#security-procedures)
8. [Monitoring & Alerts](#monitoring--alerts)
9. [Disaster Recovery](#disaster-recovery)

## System Overview

### Component Status Matrix
| Component | Port | Health Check | Dependencies |
|-----------|------|--------------|--------------|
| Nginx | 80 | `/health` | web, app |
| Web (React) | 80 (internal) | - | app (for API) |
| App (Node.js) | 3000 | `/api/message` | db |
| Database (MySQL) | 3306 | TCP check | - |

### Normal Operating Parameters
- **CPU Usage**: < 50% per container
- **Memory Usage**: < 512MB per container
- **Response Time**: < 100ms for API
- **Error Rate**: < 1% of requests

## Health Checks

### Quick Health Check Script
```bash
#!/bin/bash
# save as health-check.sh

echo "=== Health Check ==="

# Check containers
for container in nginx web app db; do
    if docker ps | grep -q $container; then
        echo "✓ $container is running"
    else
        echo "✗ $container is NOT running"
    fi
done

# Check API
if curl -s http://localhost/api/message | grep -q "Hello"; then
    echo "✓ API is responding"
else
    echo "✗ API is not responding"
fi

# Check Web
if curl -s http://localhost/ | grep -q "Three Tier"; then
    echo "✓ Web app is responding"
else
    echo "✗ Web app is not responding"
fi

# Check Database
if docker exec db mysqladmin ping -h localhost -u root -prootpassword &>/dev/null; then
    echo "✓ Database is responding"
else
    echo "✗ Database is not responding"
fi
```

### Automated Health Monitoring
```bash
# Add to crontab for every 5 minutes
*/5 * * * * /path/to/health-check.sh >> /var/log/app-health.log
```

## Common Operations

### Starting the System
```bash
# Normal start
docker-compose up -d

# Start with rebuild
docker-compose up -d --build

# Start specific service
docker-compose up -d nginx
```

### Stopping the System
```bash
# Graceful stop
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop specific service
docker-compose stop nginx
```

### Restarting Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart app

# Rolling restart (zero downtime)
docker-compose up -d --no-deps --scale app=2 app
docker-compose up -d --no-deps --scale app=1 app
```

### Viewing Logs
```bash
# All logs
docker-compose logs

# Follow mode
docker-compose logs -f

# Specific service
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100

# With timestamps
docker-compose logs -t
```

### Database Operations
```bash
# Connect to MySQL
docker-compose exec db mysql -u appuser -papppassword appdb

# Backup database
docker-compose exec db mysqldump -u appuser -papppassword appdb > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T db mysql -u appuser -papppassword appdb

# Reset database
docker-compose down -v
docker-compose up -d
```

### Scaling Operations
```bash
# Scale app tier
docker-compose up -d --scale app=3

# Scale with load balancer
# Update nginx.conf with upstream group
```

## Troubleshooting Guides

### Issue 1: 502 Bad Gateway

**Symptoms:** Nginx returns 502 errors

**Diagnosis:**
```bash
# Check if app container is running
docker-compose ps app

# Check app logs
docker-compose logs app

# Test app directly
docker-compose exec nginx wget -O- http://app:3000/health
```

**Resolution:**
```bash
# Restart app service
docker-compose restart app

# If persists, rebuild
docker-compose build --no-cache app
docker-compose up -d app
```

### Issue 2: Database Connection Failed

**Symptoms:** API returns "Database connection failed"

**Diagnosis:**
```bash
# Check database status
docker-compose ps db
docker-compose logs db

# Verify credentials
docker-compose exec app node -e "
const mysql = require('mysql2/promise');
mysql.createConnection({
  host: 'db',
  user: 'appuser',
  password: 'apppassword',
  database: 'appdb'
}).then(conn => {
  console.log('Connected!');
  conn.end();
}).catch(err => console.log('Failed:', err.message));
"
```

**Resolution:**
```bash
# Restart database
docker-compose restart db

# Wait for initialization (30 seconds)
sleep 30

# Reset database if corrupted
docker-compose down -v
docker-compose up -d
```

### Issue 3: Out of Memory

**Symptoms:** Containers crashing, OOM errors

**Diagnosis:**
```bash
# Check memory usage
docker stats --no-stream

# Check Docker daemon logs
journalctl -u docker | grep -i oom
```

**Resolution:**
```bash
# Add memory limits to docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

# Restart with limits
docker-compose down
docker-compose up -d
```

### Issue 4: Port Conflicts

**Symptoms:** "port is already allocated" error

**Diagnosis:**
```bash
# Check what's using port 80
sudo lsof -i :80
sudo netstat -tulpn | grep :80
```

**Resolution:**
```bash
# Option 1: Change port in docker-compose.yml
ports:
  - "8080:80"  # Instead of "80:80"

# Option 2: Stop conflicting service
sudo systemctl stop apache2  # or nginx

# Option 3: Kill process using port
sudo kill -9 <PID>
```

## Backup & Recovery

### Automated Backup Script
```bash
#!/bin/bash
# save as backup.sh

BACKUP_DIR="/backups/app"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T db mysqldump -u appuser -papppassword appdb > $BACKUP_DIR/db_$DATE.sql

# Backup configuration
cp docker-compose.yml $BACKUP_DIR/
cp nginx/nginx.conf $BACKUP_DIR/
cp web-tier/vite.config.js $BACKUP_DIR/

# Compress backup
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.tar.gz"
```

### Recovery Procedure
```bash
# 1. Stop all services
docker-compose down

# 2. Restore database
docker-compose up -d db
sleep 30
cat backup.sql | docker-compose exec -T db mysql -u appuser -papppassword appdb

# 3. Restore configuration
cp backup/docker-compose.yml .
cp backup/nginx.conf nginx/

# 4. Rebuild and start
docker-compose build --no-cache
docker-compose up -d

# 5. Verify
./health-check.sh
```

## Performance Tuning

### Nginx Performance
```nginx
# Add to nginx/nginx.conf
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/html text/css application/javascript;
    
    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Node.js Performance
```javascript
// Add to app-tier/src/server.js
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    for (let i = 0; i < numCPUs; i++) cluster.fork();
} else {
    // Your existing app code
}
```

### Database Performance
```sql
-- Add indexes
CREATE INDEX idx_message ON demo(message);

-- Optimize queries
EXPLAIN SELECT * FROM demo WHERE message LIKE 'Hello%';

-- Enable query cache
SET GLOBAL query_cache_size = 268435456;
```

## Security Procedures

### Regular Security Tasks
```bash
# Weekly: Update base images
docker pull node:20-alpine
docker pull nginx:alpine
docker pull mysql:8
docker-compose build --no-cache

# Monthly: Scan for vulnerabilities
docker scan app-tier
docker scan web-tier

# Quarterly: Rotate passwords
# Update docker-compose.yml and rebuild
```

### Security Hardening
```yaml
# docker-compose.yml security additions
services:
  app:
    security_opt:
      - no-new-privileges:true
    read_only: true
    user: node:node
    
  db:
    environment:
      MYSQL_ROOT_PASSWORD: ${ROOT_PASSWORD}  # Use .env file
```

## Monitoring & Alerts

### Prometheus Metrics Exporter
```bash
# Add prometheus metrics endpoint to app
npm install prom-client
```

```javascript
// Add to app-tier/src/server.js
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});
```

### Alert Rules
```yaml
# Prometheus alert rules
groups:
  - name: app_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        annotations:
          summary: "High error rate detected"
      
      - alert: ContainerDown
        expr: up{job="docker"} == 0
        annotations:
          summary: "Container {{ $labels.container }} is down"
```

## Disaster Recovery

### Recovery Time Objectives (RTO)
- **Critical**: 15 minutes
- **High**: 30 minutes
- **Medium**: 1 hour
- **Low**: 4 hours

### Recovery Procedures by Scenario

#### Scenario 1: Complete System Failure
```bash
# 1. Restart Docker daemon
sudo systemctl restart docker

# 2. Start from backup
docker-compose up -d
./restore.sh latest_backup.tar.gz

# Expected recovery time: 10-15 minutes
```

#### Scenario 2: Database Corruption
```bash
# 1. Stop app tier
docker-compose stop app

# 2. Restore database
docker-compose exec -T db mysql -u root -p < clean_backup.sql

# 3. Restart app
docker-compose start app

# Expected recovery time: 5-10 minutes
```

#### Scenario 3: Data Center Failure
```bash
# On secondary site:
# 1. Restore from offsite backup
aws s3 cp s3://backups/app/latest.tar.gz .
tar -xzf latest.tar.gz

# 2. Start services
docker-compose up -d

# Expected recovery time: 30-60 minutes
```

### Runbook Checklist

- [ ] Health check script working
- [ ] Backups configured and tested
- [ ] Monitoring alerts set up
- [ ] On-call rotation defined
- [ ] Disaster recovery plan documented
- [ ] Security scanning enabled
- [ ] Log rotation configured
- [ ] Resource limits set
- [ ] SSL certificates (if using HTTPS)
- [ ] Rate limiting configured

## Emergency Contacts

| Role | Name | Contact | Response Time |
|------|------|---------|---------------|
| DevOps Engineer | - | - | 15 min |
| Database Admin | - | - | 30 min |
| Security Lead | - | - | 1 hour |

## Useful Commands Cheatsheet

```bash
# Quick status
docker-compose ps && ./health-check.sh

# Emergency restart
docker-compose down && docker-compose up -d

# Clear logs
docker-compose logs > /dev/null && docker system prune -f

# Debug network
docker network inspect app-net

# Interactive debugging
docker-compose exec app sh
docker-compose exec db mysql -u appuser -papppassword

# Performance profiling
docker stats $(docker-compose ps -q)
```

---

**Last Updated**: Mon Apr 27 08:40:56 PM BST 2026
**Version**: 1.0
**Maintainer**: DevOps Team
EOF
```

## Make scripts executable:

```bash
chmod +x health-check.sh backup.sh
```
