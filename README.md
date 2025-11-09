# AI Resume Tailor

An AI-powered resume generation and tailoring system that uses LlamaIndex and multiple LLMs to create ATS-optimized, personalized resumes for job seekers.

## Features

- 🤖 **Multi-LLM Support**: GPT-4, Claude, Gemini, Mixtral, Llama 2 with auto-fallback
- 📄 **ATS Optimization**: All resumes comply with Applicant Tracking System standards
- 🎯 **Smart Keyword Matching**: Extracts and naturally incorporates job-specific keywords
- 📋 **Multiple Formats**: Download as Word (.docx) and PDF
- 🔐 **Honest & Truthful**: Never fabricates experience, only enhances what's real
- 🎨 **Multiple Templates**: Modern, Classic, Minimal, and Technical designs
- 👥 **User Management**: Admin panel for managing users and subscriptions
- 📊 **Usage Tracking**: Tiered subscription system (Free: 3/month, Pro: 50/month, Premium: Unlimited)
- 🔍 **Version Control**: Track all resume versions and tailoring history
- 🗄️ **MongoDB Backend**: Persistent storage with audit logging

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: React + Zustand
- **Database**: MongoDB
- **LLM Integration**: LlamaIndex + OpenRouter API
- **Document Generation**: PDFKit, node-docx
- **Authentication**: JWT

## Project Structure

```
ai-resume-tailor/
├── server.js                 # Main server file
├── package.json             # Backend dependencies
├── .env.example             # Environment template
├── models/                  # MongoDB schemas
│   ├── User.js
│   ├── Resume.js
│   ├── ResumeTemplate.js
│   └── AuditLog.js
├── routes/                  # API endpoints
│   ├── auth.js
│   ├── resume.js
│   └── admin.js
├── services/                # Business logic
│   ├── llmService.js
│   ├── resumeTailorService.js
│   └── documentService.js
├── middleware/              # Express middleware
│   └── auth.js
├── scripts/                 # Utility scripts
│   └── seedDb.js
├── client/                  # React frontend
│   ├── package.json
│   ├── public/
│   ├── src/
│   │   ├── index.js
│   │   ├── App.js
│   │   ├── store/           # Zustand store
│   │   ├── pages/           # React pages
│   │   ├── components/      # React components
│   │   └── styles/          # CSS files
└── uploads/                 # Uploaded files directory
```

## Installation

### Prerequisites
- Node.js 16+
- MongoDB 4.4+
- LLM API Keys (OpenRouter, Gemini, Anthropic)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-resume-tailor
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

4. Create `.env` file:
```bash
cp .env.example .env
```

5. Update `.env` with your credentials:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-resume-tailor
JWT_SECRET=your-secret-key-here
OPENROUTER_API_KEY=your-openrouter-key
GEMINI_API_KEY=your-gemini-key
ANTHROPIC_API_KEY=your-anthropic-key
```

6. Seed the database:
```bash
node scripts/seedDb.js
```

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Demo Credentials
- Email: `demo@example.com`
- Password: `demo123`
- Admin Email: `admin@airesume.local`
- Admin Password: `admin123`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Resume Operations
- `POST /api/resume/upload` - Upload base resume
- `POST /api/resume/extract-job-keywords` - Extract keywords from job description
- `POST /api/resume/analyze-gaps` - Analyze resume gaps
- `POST /api/resume/tailor` - Generate tailored resume
- `POST /api/resume/generate-documents/:resumeId` - Generate Word/PDF
- `GET /api/resume/history` - Get resume history
- `GET /api/resume/:resumeId` - Get resume details
- `DELETE /api/resume/:resumeId` - Delete resume

### Admin Operations
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:userId` - Get user details
- `PUT /api/admin/users/:userId/subscription` - Update subscription
- `PUT /api/admin/users/:userId/status` - Activate/deactivate user
- `PUT /api/admin/users/:userId/reset-tailorings` - Reset tailoring count
- `GET /api/admin/stats/system` - System statistics
- `GET /api/admin/logs` - Audit logs

## Features Breakdown

### Resume Tailoring Process

1. **Upload Resume** - User uploads or pastes their base resume
2. **Enter Job Description** - User provides target job description
3. **Select Template & LLM** - Choose resume style and AI model
4. **AI Processing**:
   - Extract job keywords and requirements
   - Analyze resume-job fit and identify gaps
   - Generate tailored resume with keyword integration
   - Ensure ATS compliance
5. **Download** - Get tailored resume in Word and PDF formats

### LLM Integration

The system supports multiple LLMs with intelligent fallback:

```
Primary LLM selected by user
    ↓
If fails → Try GPT-4
    ↓
If fails → Try Claude
    ↓
If fails → Try Mixtral
    ↓
If all fail → Return error with fallback info
```

### ATS Compliance

All generated resumes ensure:
- Single column layout
- Standard fonts (Calibri, Arial, Times New Roman)
- No graphics or tables
- Proper heading hierarchy
- Consistent formatting
- Standard resume sections

### Subscription Tiers

| Tier | Tailorings/Month | Price |
|------|-----------------|-------|
| Free | 3 | $0 |
| Pro | 50 | $9.99 |
| Premium | Unlimited | $29.99 |

Admins have unlimited access.

## Database Schema

### User
```javascript
{
  email: String,
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: 'admin' | 'user',
  subscription: 'free' | 'pro' | 'premium',
  tailoringsUsed: Number,
  tailoringsLimit: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Resume
```javascript
{
  userId: ObjectId,
  baseResumeName: String,
  baseResumeContent: String,
  jobDescription: String,
  jobTitle: String,
  template: String,
  selectedLLM: String,
  tailoredResumeContent: String,
  tailoredResumeJson: Object,
  matchScore: Number,
  status: 'pending' | 'completed' | 'failed',
  wordDocUrl: String,
  pdfUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Monitoring & Analytics

The system logs all major actions:
- User registration and login
- Resume uploads and tailoring
- Document downloads
- Subscription changes
- Admin actions

Access audit logs via the Admin Panel.

## Customization

### Adding New Templates

Edit `scripts/seedDb.js` to add new resume templates to MongoDB.

### Changing LLM Models

Update `services/llmService.js` to add or modify LLM configurations.

### Adjusting Rate Limits

Modify subscription limits in `routes/admin.js` and `middleware/auth.js`.

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in `.env`

### LLM API Errors
- Verify API keys in `.env`
- Check API rate limits and quotas
- Fallback mechanism will activate on failure

### Frontend CORS Issues
- Ensure backend is running on port 5000
- Check FRONTEND_URL in server.js CORS configuration

## Performance Optimization

- LLM responses cached for identical job descriptions
- MongoDB indexes on userId and createdAt for faster queries
- Frontend uses Zustand for efficient state management
- Lazy loading of resume components

## Security Considerations

- Passwords hashed with bcryptjs
- JWT tokens with 30-day expiration
- Input validation on all endpoints
- Role-based access control (RBAC)
- Audit logging for all sensitive operations

## Future Enhancements

- [ ] LinkedIn profile import
- [ ] Cover letter generation
- [ ] Interview question suggestions
- [ ] Real-time collaboration
- [ ] Email notifications
- [ ] Payment integration (Stripe)
- [ ] OAuth providers (Google, GitHub)
- [ ] Resume quality scoring
- [ ] Skill endorsement system
- [ ] Job matching recommendations

## License

MIT

## Support

For issues and feature requests, please create an issue on the repository.

## Development Notes

- Ensure all new features follow existing code patterns
- Add proper error handling with user-friendly messages
- Test with all supported LLMs
- Validate ATS compliance for new resume formats
- Update documentation when adding new features
