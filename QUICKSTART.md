# Quick Start Guide

Get the AI Resume Tailor system up and running in 5 minutes.

## Prerequisites
- Node.js 16+ 
- MongoDB running locally or MongoDB Atlas account
- API keys for at least one LLM provider (OpenRouter recommended)

## Step 1: Setup Environment

```bash
# Copy example config
cp .env.example .env

# Edit .env with your values
nano .env
```

**Minimal .env for testing:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ai-resume-tailor
JWT_SECRET=dev-secret-12345
OPENROUTER_API_KEY=sk_test_your_key_here
FRONTEND_URL=http://localhost:3000
```

## Step 2: Install Dependencies

```bash
# Backend
npm install

# Frontend
cd client && npm install && cd ..
```

## Step 3: Initialize Database

```bash
npm run seed-db
```

This creates:
- Admin user: `admin@airesume.local` / `admin123`
- Demo user: `demo@example.com` / `demo123`
- Resume templates (Modern, Classic, Minimal, Technical)

## Step 4: Start the System

**Terminal 1 - Backend:**
```bash
npm run dev
```

You should see:
```
Connected to MongoDB
Server running on port 5000
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

The app opens at `http://localhost:3000`

## Step 5: Login & Test

1. Go to http://localhost:3000
2. Login with: `demo@example.com` / `demo123`
3. Click "Tailor Resume"
4. Follow the 4-step wizard

## Example Test Data

### Resume to upload:
```
JOHN SMITH
john@example.com | (555) 123-4567 | New York, NY

PROFESSIONAL SUMMARY
Experienced full-stack developer with 5 years building web applications.

CORE SKILLS
- Frontend: JavaScript, React, HTML/CSS
- Backend: Node.js, Express, Python
- Database: MongoDB, SQL
- Tools: Git, Docker, AWS

WORK EXPERIENCE

TECH STARTUP CO.
Senior Developer | Jan 2020 - Present
- Built React dashboard serving 10K+ users
- Optimized database queries improving performance by 30%
- Led team of 3 junior developers

STARTUP INC.
Frontend Developer | Jun 2018 - Dec 2019
- Developed responsive web applications
- Implemented REST APIs
- Fixed bugs and maintained codebase

EDUCATION

UNIVERSITY STATE
Bachelor of Science in Computer Science | 2018
```

### Job description to tailor for:
```
Senior Full Stack Engineer

About the Role:
We're looking for a Senior Full Stack Engineer to join our FinTech team.

Requirements:
- 5+ years of full-stack development experience
- Expert in React and Node.js
- Experience with AWS or cloud platforms
- Strong MongoDB/database design skills
- Leadership and mentoring experience
- Experience with microservices architecture

Responsibilities:
- Design and build scalable web applications
- Mentor junior engineers
- Lead technical design discussions
- Optimize application performance
- Implement CI/CD pipelines

Nice to have:
- Open source contributions
- Public speaking/conference talks
- Experience with Kubernetes
```

## After Testing

### To use in production:
1. Follow DEPLOYMENT.md for production setup
2. Update `.env` with production values
3. Setup MongoDB Atlas
4. Configure LLM API keys
5. Deploy to your hosting (Heroku, AWS, etc)

### To monetize:
1. Update subscription pricing
2. Integrate payment processor (Stripe)
3. Setup email notifications
4. Configure admin panel for managing users

### To scale:
1. Implement caching layer (Redis)
2. Use message queue (Bull, RabbitMQ)
3. Add load balancing
4. Setup database replication

## Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
mongo --eval "db.adminCommand('ping')"

# Or use MongoDB Atlas URL in .env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ai-resume-tailor
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm run dev
```

### Missing API Key
```
Error: No response from OpenRouter
→ Solution: Add OPENROUTER_API_KEY to .env
→ Get free credits at https://openrouter.ai
```

### React App Not Loading
```bash
# Clear node_modules and reinstall
cd client
rm -rf node_modules package-lock.json
npm install
npm start
```

## Next Steps

1. **Customize templates** - Edit `scripts/seedDb.js`
2. **Add more LLMs** - Edit `services/llmService.js`
3. **Adjust limits** - Modify subscription tiers in `routes/admin.js`
4. **Configure email** - Add email service for notifications
5. **Add payments** - Integrate Stripe for subscriptions

## Documentation

- **README.md** - Full feature documentation
- **DEPLOYMENT.md** - Production deployment guide
- **LLM_INTEGRATION.md** - Prompt engineering details
- **API Endpoints** - See routes/*.js files

## Support

Check error logs:
```bash
# Backend logs
tail -f npm.log

# Check database
mongo ai-resume-tailor
> db.users.find()
> db.resumes.find()
```

## Performance Tips

- Use Mixtral for faster processing (cheaper)
- Cache job descriptions to reduce API calls
- Enable MongoDB indexes for large datasets
- Use CDN for frontend assets in production

---

**You're ready!** 🚀 Start tailoring resumes with AI.
