
## README.md

# Three-Tier Demo Application

A complete containerized three-tier application demonstrating modern web architecture with React, Node.js, MySQL, and Nginx.

## 🏗 Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│    Nginx    │────▶│   Node.js   │────▶│    MySQL    │
│   (React)   │◀────│ (Reverse    │◀────│  (Express)  │◀────│  Database   │
└─────────────┘     │   Proxy)    │     └─────────────┘     └─────────────┘
                    └─────────────┘
                     Port 80
```

### Components:
- **Web Tier**: React 18 application (Vite build tool)
- **App Tier**: Node.js/Express REST API
- **Database Tier**: MySQL 8.0
- **Proxy Tier**: Nginx (reverse proxy + static file serving)

## 🎯 Use Cases

### 1. **Learning & Demonstration**
- Understanding microservices architecture
- Docker containerization concepts
- Three-tier application patterns
- React + Node.js integration

### 2. **Development Template**
- Starting point for full-stack applications
- Production-ready Docker configuration
- Clean separation of concerns
- Scalable architecture pattern

### 3. **Testing Scenarios**
- API integration testing
- Database connectivity validation
- Reverse proxy configuration
- Container orchestration

### 4. **Interview/Assessment Projects**
- Showcase Docker knowledge
- Demonstrate full-stack capabilities
- Explain system architecture
- Troubleshooting skills

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git (optional)
- 2GB RAM minimum (4GB recommended)
- Port 80 available

## 🚀 Quick Start

### Method 1: Docker Compose (Recommended)

```bash
# Clone or navigate to project
cd three-tier-demo-app

# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Method 2: Manual Docker Run

```bash
# Create network
docker network create app-net

# Start database
docker run -d --name db --network app-net \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=appdb \
  -e MYSQL_USER=appuser \
  -e MYSQL_PASSWORD=apppassword \
  -v $(pwd)/db/init.sql:/docker-entrypoint-initdb.d/init.sql \
  mysql:8

# Start app tier
docker run -d --name app --network app-net \
  -e DB_HOST=db \
  -e DB_USER=appuser \
  -e DB_PASSWORD=apppassword \
  -e DB_NAME=appdb \
  app-tier

# Build web tier
cd web-tier && npm install && npm run build && cd ..

# Start web tier
docker run -d --name web --network app-net web-tier

# Start nginx
docker run -d --name nginx --network app-net \
  -p 80:80 \
  -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v $(pwd)/web-tier/dist:/usr/share/nginx/html:ro \
  nginx:alpine
```

## 🔍 Verification

### Test API endpoint:
```bash
curl http://localhost/api/message
# Expected: {"message":"Hello from the DB!"}
```

### Test web application:
```bash
curl http://localhost/
# Expected: Returns React application HTML
```

### Browser access:
- Open: http://localhost
- You should see: "Three Tier Demo App" with database message

## 🛠 Development Mode

### Run services locally (without Docker):

**1. Database:**
```bash
docker run -d --name db-dev -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=appdb \
  -e MYSQL_USER=appuser \
  -e MYSQL_PASSWORD=apppassword \
  mysql:8
```

**2. Backend:**
```bash
cd app-tier
npm install
npm start
# Runs on http://localhost:3000
```

**3. Frontend:**
```bash
cd web-tier
npm install
npm run dev
# Runs on http://localhost:5173
```

**4. Configure proxy (if needed):**
Update `web-tier/vite.config.js`:
```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})
```

## 📊 API Reference

### Endpoints

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/api/message` | Get greeting message | `{"message": "Hello from the DB!"}` |
| GET | `/health` | Health check | `"OK"` |

### Adding New Endpoints

Edit `app-tier/src/server.js`:

```javascript
// Add new endpoint
app.get('/api/users', async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.query("SELECT * FROM users");
    await conn.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

## 🗄 Database Schema

Current schema:
```sql
CREATE TABLE IF NOT EXISTS demo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message VARCHAR(255)
);
```

### Add new table:
Place SQL files in `db/init.sql` - they auto-execute on first run.

## 🐳 Docker Commands Reference

```bash
# Build images
docker-compose build

# Rebuild without cache
docker-compose build --no-cache

# Start services
docker-compose up -d

# Stop services
docker-compose down

# Stop and remove volumes (resets database)
docker-compose down -v

# View logs
docker-compose logs -f [service-name]

# Execute command in container
docker-compose exec app bash
docker-compose exec db mysql -u appuser -p appdb

# Check resource usage
docker stats

# Clean up everything
docker system prune -a
```

## 🔧 Troubleshooting

### Issue: Port 80 already in use
```bash
# Find process using port 80
sudo lsof -i :80
# Kill or use different port
# Change ports in docker-compose.yml: "8080:80"
```

### Issue: Database connection failed
```bash
# Check if db is ready
docker-compose logs db
# Wait 30 seconds for MySQL to initialize
# Verify connection
docker-compose exec app node -e "require('mysql2/promise').createConnection({host:'db',user:'appuser',password:'apppassword',database:'appdb'}).then(c=>console.log('OK')).catch(e=>console.log(e))"
```

### Issue: React build fails
```bash
# Clean and rebuild locally
cd web-tier
rm -rf node_modules dist
npm install
npm run build
# Then rebuild Docker image
docker-compose build --no-cache web
```

### Issue: Containers not starting
```bash
# Check logs
docker-compose logs
# Check Docker daemon
sudo systemctl status docker
# Restart Docker
sudo systemctl restart docker
```

## 📈 Scaling Considerations

### Horizontal Scaling:
```yaml
# docker-compose.yml
services:
  app:
    deploy:
      replicas: 3
  db:
    # Consider using managed database service
```

### Performance Optimization:
- Add Redis for caching
- Implement database connection pooling
- Use CDN for static assets
- Enable Gzip compression in Nginx
- Add health checks and auto-restart policies

## 🔒 Security Best Practices

1. **Environment Variables:**
   - Use `.env` file for secrets (add to .gitignore)
   - Rotate passwords regularly

2. **Network Security:**
   - Keep containers in isolated network
   - Don't expose database port to host

3. **Image Security:**
   - Use specific image tags (not `latest`)
   - Regularly update base images
   - Scan for vulnerabilities: `docker scan`

4. **Production Hardening:**
   - Run containers as non-root user
   - Implement rate limiting
   - Add request validation
   - Use HTTPS with Let's Encrypt

## 🚦 Next Steps & Enhancements

### Immediate Improvements:
1. **Add user authentication** (JWT, OAuth)
2. **Implement CRUD operations** for database entities
3. **Add form validation** on frontend
4. **Create proper error handling**
5. **Add unit tests** (Jest, React Testing Library)

### Advanced Features:
1. **WebSocket support** for real-time updates
2. **File upload functionality**
3. **Email notifications**
4. **Background job processing** (Redis, Bull)
5. **API documentation** (Swagger/OpenAPI)

### DevOps Enhancements:
1. **CI/CD pipeline** (GitHub Actions, GitLab CI)
2. **Container orchestration** (Kubernetes)
3. **Monitoring stack** (Prometheus + Grafana)
4. **Log aggregation** (ELK stack)
5. **Automated backups** for database

### Deployment Targets:
- **Cloud**: AWS ECS, Google Cloud Run, Azure Container Instances
- **Platform**: Heroku, Railway, Render
- **Kubernetes**: EKS, AKS, GKE, K3s

## 📚 Learning Resources

- [Docker Documentation](https://docs.docker.com/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [MySQL Reference](https://dev.mysql.com/doc/)
- [Nginx Tutorial](https://nginx.org/en/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📄 License

MIT License - Feel free to use for learning and production!

## 🆘 Support

- Check troubleshooting section
- Review Docker logs: `docker-compose logs`
- Verify network connectivity: `docker network inspect app-net`
- Test each tier independently

---

**Built with ❤️ using Docker, React, Node.js, MySQL, and Nginx**
EOF
```

