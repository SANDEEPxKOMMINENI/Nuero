# Deployment Guide

## Local Development Setup

### 1. MongoDB Setup

#### Option A: Local MongoDB
```bash
# Install MongoDB (macOS with Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Install MongoDB (Linux - Ubuntu/Debian)
sudo apt-get install -y mongodb

# Test connection
mongo --eval "db.adminCommand('ping')"
```

#### Option B: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update MONGODB_URI in `.env`

### 2. API Keys Setup

1. **OpenRouter** (for GPT-4, Mixtral, Llama 2):
   - Sign up at https://openrouter.ai
   - Get API key from dashboard
   - Add to OPENROUTER_API_KEY

2. **Google Gemini**:
   - Get key from https://makersuite.google.com/app/apikey
   - Add to GEMINI_API_KEY

3. **Anthropic Claude**:
   - Get key from https://console.anthropic.com/
   - Add to ANTHROPIC_API_KEY

### 3. Environment Configuration

Create `.env` file in project root:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ai-resume-tailor

# JWT
JWT_SECRET=dev-secret-change-in-production-$(date +%s)

# API Keys
OPENROUTER_API_KEY=sk_test_...
GEMINI_API_KEY=AIzaSy...
ANTHROPIC_API_KEY=sk-ant-...

# Frontend
FRONTEND_URL=http://localhost:3000
```

### 4. Initialize Database

```bash
# Run seed script to create admin user and templates
npm run seed-db
```

### 5. Start Development Server

```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend (new terminal)
cd client && npm start
```

## Production Deployment

### Option 1: Heroku + MongoDB Atlas

#### Backend Deployment

1. **Install Heroku CLI**:
```bash
npm install -g heroku
heroku login
```

2. **Prepare for Deployment**:
```bash
# Create Procfile
echo "web: node server.js" > Procfile

# Create .gitignore if not exists
# (already provided)

git add .
git commit -m "Ready for Heroku deployment"
```

3. **Deploy**:
```bash
heroku create your-app-name
heroku config:set MONGODB_URI=your-atlas-connection-string
heroku config:set JWT_SECRET=your-production-secret
heroku config:set OPENROUTER_API_KEY=your-key
heroku config:set GEMINI_API_KEY=your-key
heroku config:set ANTHROPIC_API_KEY=your-key
git push heroku main
```

4. **Verify**:
```bash
heroku logs --tail
heroku open
```

#### Frontend Deployment (Vercel)

```bash
# In client directory
npm install -g vercel
vercel
```

### Option 2: AWS + RDS

#### Backend on EC2

1. **Launch EC2 Instance**:
   - Use Ubuntu 20.04 LTS AMI
   - Security group: Allow ports 22, 80, 443, 5000

2. **Setup Node.js**:
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Deploy Application**:
```bash
git clone your-repo
cd ai-resume-tailor
npm install
npm run seed-db
npm start
```

4. **Setup Nginx Reverse Proxy**:
```bash
sudo apt-get install nginx
# Edit /etc/nginx/sites-available/default
# Configure upstream to http://localhost:5000
sudo systemctl restart nginx
```

#### Database on RDS

1. Create RDS instance with MongoDB Atlas (recommended) or AWS DocumentDB
2. Get connection string
3. Update MONGODB_URI environment variable

#### Frontend on S3 + CloudFront

```bash
cd client
npm run build
aws s3 sync build/ s3://your-bucket-name
```

### Option 3: Docker + Docker Compose

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy backend
COPY package*.json ./
RUN npm ci --only=production

COPY server.js ./
COPY models/ ./models/
COPY routes/ ./routes/
COPY services/ ./services/
COPY middleware/ ./middleware/
COPY scripts/ ./scripts/

# Copy frontend build
COPY client/build/ ./public/

EXPOSE 5000

CMD ["node", "server.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: password

  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      MONGODB_URI: mongodb://root:password@mongodb:27017/ai-resume-tailor?authSource=admin
      JWT_SECRET: your-secret
      OPENROUTER_API_KEY: your-key
    depends_on:
      - mongodb

volumes:
  mongo-data:
```

Deploy:
```bash
docker-compose up -d
```

## Performance Optimization

### Backend

1. **Enable Compression**:
```javascript
import compression from 'compression';
app.use(compression());
```

2. **Add Caching Headers**:
```javascript
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600');
  next();
});
```

3. **Database Indexes**:
```javascript
// Already configured in models
resumeSchema.index({ userId: 1, createdAt: -1 });
```

### Frontend

1. **Build Optimization**:
```bash
cd client
npm run build
# Analyze bundle
npx source-map-explorer 'build/static/js/*.js'
```

2. **Code Splitting**:
Already implemented with React.lazy() for routes

## Monitoring & Logging

### Backend Monitoring

```javascript
// Add request logging
import morgan from 'morgan';
app.use(morgan('combined'));

// Add error tracking
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

### Database Monitoring

MongoDB Atlas provides built-in monitoring:
- View query performance
- Monitor replication lag
- Check resource utilization

## Backup Strategy

### MongoDB Atlas
- Automatic backups every 6 hours (free tier)
- Manual snapshots available
- Point-in-time restore up to 7 days

### Application Data
```bash
# Manual backup
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/ai-resume-tailor"

# Restore
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net/ai-resume-tailor" dump/
```

## SSL/TLS Setup

### Using Let's Encrypt with Nginx

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
sudo certbot renew --dry-run
```

### Update Nginx config
```nginx
listen 443 ssl http2;
ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
```

## Environment-Specific Configurations

### Development
```env
NODE_ENV=development
DEBUG=true
FRONTEND_URL=http://localhost:3000
```

### Staging
```env
NODE_ENV=staging
DEBUG=false
FRONTEND_URL=https://staging.your-domain.com
```

### Production
```env
NODE_ENV=production
DEBUG=false
FRONTEND_URL=https://your-domain.com
```

## Scaling Considerations

### Horizontal Scaling
1. Use load balancer (AWS ALB, Nginx)
2. Run multiple API instances
3. Use MongoDB replica set for high availability

### Vertical Scaling
1. Upgrade EC2/Heroku dyno size
2. Increase MongoDB RAM for better performance
3. Use CDN for static assets

## Common Issues & Solutions

### Issue: MongoDB Connection Timeout
```bash
# Solution: Check firewall rules and IP whitelist in MongoDB Atlas
# Increase connection timeout in .env
MONGODB_TIMEOUT=30000
```

### Issue: LLM API Rate Limits
```bash
# Solution: Implement rate limiting
npm install express-rate-limit

import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);
```

### Issue: Memory Leaks
```bash
# Monitor with
node --inspect server.js
# Open chrome://inspect
```

## Rollback Procedure

### Heroku
```bash
heroku releases
heroku rollback v123
```

### Git-based deployment
```bash
git revert <commit-hash>
git push origin main
```

## Maintenance

### Regular Tasks
- [ ] Update dependencies monthly: `npm update`
- [ ] Review security advisories: `npm audit`
- [ ] Check database logs weekly
- [ ] Monitor error rates daily
- [ ] Backup data weekly
- [ ] Review user feedback monthly

### Security Updates
```bash
npm audit fix
npm update
npm run build
# Test thoroughly before deploying
```

## Support & Monitoring Tools

- **Monitoring**: New Relic, DataDog, or Prometheus
- **Error Tracking**: Sentry
- **Logging**: LogRocket, Loggly
- **APM**: Datadog, New Relic
- **Status Page**: StatusPage.io

## Disaster Recovery

### RTO (Recovery Time Objective): 1 hour
### RPO (Recovery Point Objective): 30 minutes

1. Automated backups to S3
2. Database snapshots every 6 hours
3. Application code in Git with tags
4. Runbooks for common failures
5. Regular disaster recovery drills

Refer to README.md for general documentation and API details.
