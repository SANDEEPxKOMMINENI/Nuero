# LLM Integration & Prompt Engineering

## Overview

This document describes how the AI Resume Tailor system integrates with multiple Large Language Models (LLMs) and the prompt engineering strategies used for resume tailoring.

## Supported LLMs

### 1. **GPT-4** (OpenRouter)
- **Provider**: OpenAI via OpenRouter
- **Model ID**: `openai/gpt-4-turbo-preview`
- **Tier**: Premium (best quality, highest cost)
- **Best For**: Complex analysis, nuanced rewrites
- **Token Limit**: 2000 (configurable)
- **Cost**: ~$0.01-0.03 per 1K tokens

### 2. **Claude** (Anthropic)
- **Provider**: Anthropic
- **Model ID**: `claude-3-opus-20240229`
- **Tier**: Premium
- **Best For**: Safety, detailed explanations
- **Token Limit**: 2000
- **Cost**: ~$0.015-0.03 per 1K tokens

### 3. **Gemini** (Google)
- **Provider**: Google
- **Model ID**: `gemini-pro`
- **Tier**: Standard
- **Best For**: Fast responses, multimodal capable
- **Token Limit**: 2000
- **Cost**: Free tier available

### 4. **Mixtral** (MistralAI via OpenRouter)
- **Provider**: MistralAI via OpenRouter
- **Model ID**: `mistralai/mixtral-8x7b-instruct`
- **Tier**: Standard (cost-effective)
- **Best For**: Fast processing, good quality
- **Token Limit**: 2000
- **Cost**: ~$0.0024 per 1K tokens

### 5. **Llama 2** (Meta via OpenRouter)
- **Provider**: Meta via OpenRouter
- **Model ID**: `meta-llama/llama-2-70b-chat`
- **Tier**: Standard
- **Best For**: Open-source alternative, local deployment possible
- **Token Limit**: 2000
- **Cost**: ~$0.004 per 1K tokens

## Auto-Fallback Mechanism

The system implements intelligent fallback logic to ensure resume generation never fails:

```javascript
// Fallback chain (priority order)
const FALLBACK_CHAIN = [
  'gpt4',      // Primary: Best quality
  'claude',    // Fallback 1: Alternative premium
  'mixtral',   // Fallback 2: Cost-effective
  'gemini',    // Fallback 3: Fast & free
  'llama2'     // Fallback 4: Open-source
];
```

**Fallback Triggers**:
- API rate limit exceeded
- API authentication failure
- Network timeout
- Service unavailable (5xx errors)
- Invalid response format

**Example Flow**:
```
User selects: GPT-4
    ↓
GPT-4 API call fails (rate limited)
    ↓
Automatically tries Claude
    ↓
Claude fails (auth error)
    ↓
Automatically tries Mixtral
    ↓
Mixtral succeeds ✓
    ↓
Returns result with fallback info:
{
  content: "Generated resume...",
  modelUsed: "mixtral",
  fallbackUsed: true
}
```

## Prompt Engineering Strategy

### Core Principles

1. **Honesty First**: Never fabricate experience
2. **Natural Language**: No keyword stuffing, maintain readability
3. **Context Awareness**: Understand job requirements deeply
4. **Metric-Focused**: Emphasize achievements with numbers
5. **ATS Compliance**: Maintain proper formatting

### Prompt Templates

#### 1. Job Keywords Extraction

```
You are a resume expert. Extract the following from this job description:
1. job_title: The main job title
2. required_skills: Array of hard and soft skills (separate by importance)
3. key_responsibilities: Main job duties
4. keywords: Technical terms, frameworks, tools mentioned
5. experience_level: Years/level of experience required
6. industry: Industry or domain

Job Description:
{JOB_DESCRIPTION}

Return ONLY valid JSON with these exact keys. No explanation.
```

**Response Example**:
```json
{
  "job_title": "Senior Full Stack Engineer",
  "required_skills": [
    "React", "Node.js", "MongoDB", "AWS",
    "Leadership", "System Design"
  ],
  "key_responsibilities": [
    "Build scalable web applications",
    "Mentor junior engineers",
    "Design system architecture"
  ],
  "keywords": ["MERN", "microservices", "CI/CD", "Kubernetes"],
  "experience_level": "5-7 years",
  "industry": "FinTech"
}
```

#### 2. Resume Gap Analysis

```
Compare this resume to the job requirements. Identify:
1. alignment_score: 0-100 match score
2. aligned_sections: What matches well
3. gaps: Missing skills/experience
4. suggestions: Honest enhancements (not fabrications)
5. keywords_to_add: Job terms to naturally incorporate
6. concern_areas: Experience level concerns, if any

Resume:
{RESUME}

Job Requirements:
{JOB_KEYWORDS}

Return JSON with these keys. Be thorough but honest.
```

**Response Example**:
```json
{
  "alignment_score": 72,
  "aligned_sections": [
    "Frontend experience with React",
    "Backend API development",
    "Database design"
  ],
  "gaps": [
    "AWS experience (job requires it)",
    "Leadership/mentoring experience",
    "Microservices architecture"
  ],
  "suggestions": [
    "Reframe existing projects using AWS services mentioned",
    "Highlight any team coordination experiences",
    "Detail system design thinking in past projects"
  ],
  "keywords_to_add": [
    "REST APIs", "Performance optimization",
    "Agile/Scrum", "Code review"
  ],
  "concern_areas": "Experience level aligns well (5 years vs 5-7 required)"
}
```

#### 3. Resume Tailoring & Rewriting

```
You are an expert resume writer. Tailor this resume to match a specific job posting.

Requirements:
- NEVER fabricate experience
- Use action verbs (Built, Designed, Optimized, etc.)
- Include quantifiable metrics where possible
- Naturally incorporate job keywords
- Maintain ATS compliance (single column, no graphics)
- Keep resume to 1-2 pages
- Reorder bullet points to emphasize most relevant first

Original Resume:
{RESUME}

Target Job Title: {JOB_TITLE}

Job Keywords: {KEYWORDS}

Key Responsibilities: {RESPONSIBILITIES}

Skills to Emphasize: {SKILLS}

Template Format: {TEMPLATE_INSTRUCTIONS}

Generate the tailored resume in this structure:
[CONTACT INFO]
[HEADLINE - Include job title, top 3 keywords, value statement]
[PROFESSIONAL SUMMARY - 2-3 sentences, emphasize match to role]
[CORE SKILLS - Bullet points, include job keywords naturally]
[WORK EXPERIENCE - Reordered bullets, metric-focused]
[EDUCATION]
[CERTIFICATIONS]
[PROJECTS]

Each bullet should:
- Start with strong action verb
- Include quantifiable result
- Use 1-2 job keywords naturally
- Be truthful to original experience

Generate ONLY the resume text, no meta-commentary.
```

#### 4. Resume Parsing to JSON

```
Parse this resume into structured JSON:

Resume Text:
{RESUME_TEXT}

Return JSON with this exact structure:
{
  "contactInfo": {
    "name": "Full Name",
    "email": "email@domain.com",
    "phone": "123-456-7890",
    "location": "City, State",
    "linkedIn": "url (if present)",
    "website": "url (if present)"
  },
  "headline": "Brief professional headline",
  "professionalSummary": "2-3 sentence summary",
  "coreSkills": ["skill1", "skill2", ...],
  "workExperience": [
    {
      "company": "Company Name",
      "position": "Job Title",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY or Present",
      "bullets": ["Achievement 1", "Achievement 2", ...]
    }
  ],
  "education": [
    {
      "school": "University Name",
      "degree": "B.S. or M.S. etc",
      "field": "Computer Science",
      "year": "YYYY"
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "year": "YYYY"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "What was built",
      "technologies": ["Tech1", "Tech2"],
      "link": "url (if available)"
    }
  ]
}

Return ONLY valid JSON.
```

#### 5. Change Summary & Transparency

```
Compare the original and tailored resumes. Summarize changes:

Original Resume:
{ORIGINAL_RESUME}

Tailored Resume:
{TAILORED_RESUME}

Return JSON:
{
  "major_changes": [
    "Specific change description",
    ...
  ],
  "section_updates": [
    {
      "section": "Work Experience",
      "change": "Reordered bullets, added metrics",
      "reason": "To emphasize relevant achievements"
    }
  ],
  "keywords_added": ["keyword1", "keyword2"],
  "keywords_removed": ["dated_keyword"],
  "maintained_truth": true/false,
  "integrity_notes": "Assessment of whether changes maintain honesty"
}

Be specific about what changed and why. Include concerns about accuracy.
```

## Template Format Instructions

### Modern Template
```
Clean, contemporary format:
- 0.5" margins, single line spacing
- 10-11pt Calibri or Arial
- Bold section headers (WORK EXPERIENCE, EDUCATION, etc.)
- Bold company names and job titles
- Minimalist design with clear hierarchy
```

### Classic Template
```
Traditional, timeless format:
- 0.75" margins, single line spacing  
- 11pt Times New Roman
- Centered name and section headers
- Horizontal lines separating sections
- Professional, conservative appearance
```

### Minimal Template
```
Minimalist, scannable format:
- 0.5" margins, tight spacing
- 10pt Arial or Helvetica
- Left-aligned, minimal formatting
- Maximum density while maintaining readability
- Focus on content over design
```

### Technical Template
```
Engineer/developer-focused:
- Emphasize technical skills and projects
- Programming languages prominently listed
- Technical stack clearly shown
- GitHub links, portfolio links
- Open-source contributions highlighted
```

## Performance Optimization

### Token Management
```javascript
// Estimate tokens to stay within limits
function estimateTokens(text) {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

// Set limits per LLM
const TOKEN_LIMITS = {
  gpt4: 2000,
  claude: 2000,
  gemini: 2000,
  mixtral: 2000,
  llama2: 2000
};
```

### Prompt Caching
```javascript
// Cache identical job descriptions to reduce API calls
const jobKeywordsCache = new Map();

function getCachedKeywords(jobDesc) {
  const hash = crypto.createHash('sha256')
    .update(jobDesc)
    .digest('hex');
  return jobKeywordsCache.get(hash);
}
```

### Parallel Processing
```javascript
// Run multiple LLM tasks in parallel
Promise.all([
  extractJobKeywords(jobDesc),
  analyzeResumeGaps(resume, jobDesc),
  parseResumeJson(resume)
]).then(([keywords, gaps, json]) => {
  // All done
});
```

## Error Handling

### LLM Error Codes
```javascript
const LLM_ERRORS = {
  401: 'Invalid API key',
  429: 'Rate limit exceeded - will fallback',
  500: 'Service error - will fallback',
  503: 'Service unavailable - will fallback',
  TIMEOUT: 'Request timeout - will fallback',
  PARSE_ERROR: 'Invalid JSON response - will retry'
};
```

### Retry Logic
```javascript
async function callLLMWithRetry(llmType, prompt, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await callLLM(llmType, prompt);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      // Exponential backoff
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

## Cost Optimization

### Estimated Costs per Resume
- **GPT-4**: ~$0.05-0.10
- **Claude**: ~$0.04-0.08
- **Mixtral**: ~$0.01-0.02
- **Gemini**: ~Free (with limits)
- **Llama 2**: ~$0.01-0.02

### Cost Reduction Strategies
1. Use Mixtral for initial analysis (cheaper)
2. Fall back to Claude if Mixtral fails
3. Cache job descriptions to avoid re-extraction
4. Batch similar requests
5. Use Gemini free tier for non-critical tasks

### Monitoring Cost
```javascript
// Track LLM usage
async function trackLLMUsage(llmType, tokensUsed, cost) {
  await UsageLog.create({
    llmType,
    tokensUsed,
    estimatedCost: cost,
    timestamp: new Date()
  });
}
```

## Quality Assurance

### Testing Prompts

1. **Accuracy Testing**: Does extracted keywords match job posting?
2. **Honesty Testing**: Are any skills falsely attributed?
3. **Readability Testing**: Does resume read naturally?
4. **ATS Testing**: Does formatting pass ATS scanners?
5. **Completeness Testing**: Are all sections properly filled?

### QA Checklist
- [ ] No fabricated experience
- [ ] Keywords naturally integrated
- [ ] Metrics included where possible
- [ ] Action verbs used
- [ ] Proper formatting maintained
- [ ] No graphics or tables
- [ ] Single column layout
- [ ] Standard fonts used
- [ ] Contact info present
- [ ] Professional tone

## Advanced Techniques

### Few-Shot Prompting
Provide examples of good resume rewrites to guide the LLM:

```
Example 1:
Original: "Worked on web development"
Tailored: "Architected and deployed scalable React applications serving 100K+ users"

Example 2:
Original: "Responsible for database work"
Tailored: "Designed and optimized MongoDB schemas reducing query time by 40%"

Now, rewrite this bullet...
```

### Chain-of-Thought Prompting
Ask LLM to show its reasoning:

```
Let's think through this step by step:
1. What is the job asking for?
2. What in this resume matches?
3. How can we reframe existing work?
4. What should we emphasize?

Given this analysis, rewrite the bullet...
```

### Prompt Optimization
Iterate on prompts to improve results:

```javascript
const PROMPT_VERSIONS = {
  v1: "Extract skills from job description",
  v2: "Extract hard and soft skills separately",
  v3: "Extract skills with proficiency levels",
  v4: "Extract skills with categories and priority"
};
```

## Troubleshooting

### Issue: LLM Returns Invalid JSON
**Solution**: Validate response, request re-formatting
```javascript
try {
  return JSON.parse(response);
} catch (error) {
  // Ask LLM to reformat
  const reformatPrompt = `This JSON is invalid: ${response}\n\nPlease fix it.`;
  return callLLM(llmType, reformatPrompt);
}
```

### Issue: Keywords Not Naturally Integrated
**Solution**: Use specific instruction
```
Important: Keywords should appear naturally in context.
- Don't list skills without context
- Weave terms into achievements
- Use keywords only when truthfully applicable
```

### Issue: Resume Too Long
**Solution**: Compression strategy
```
If resume exceeds 2 pages:
1. Remove less relevant projects
2. Shorten less relevant positions
3. Combine similar skills
4. Use more concise language
```

## Future LLM Integrations

Planned additions:
- [ ] Local LLMs (Ollama, LM Studio)
- [ ] Specialized resume models (fine-tuned)
- [ ] Multimodal models for analysis
- [ ] Real-time streaming responses
- [ ] Batch processing APIs

---

See README.md for general documentation and setup instructions.
