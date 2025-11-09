import llmService from './llmService.js';

class ResumeTailorService {
  /**
   * Extract key information from job description
   */
  async extractJobKeywords(jobDescription, llmType = 'gpt4') {
    const prompt = `Extract the following from this job description and return as JSON:
1. job_title: The main job title
2. required_skills: Array of hard and soft skills required
3. key_responsibilities: Array of main responsibilities
4. keywords: Array of important keywords and technical terms

Job Description:
${jobDescription}

Return ONLY valid JSON, no other text.`;

    const response = await llmService.callLLMWithFallback(
      llmType,
      prompt,
      ['gpt4', 'claude', 'mixtral']
    );

    try {
      return JSON.parse(response.content);
    } catch (error) {
      console.error('Failed to parse job keywords JSON', error);
      return {
        job_title: 'Position',
        required_skills: [],
        key_responsibilities: [],
        keywords: [],
      };
    }
  }

  /**
   * Compare base resume with job description and identify gaps
   */
  async analyzeResumeGaps(baseResume, jobDescription, llmType = 'gpt4') {
    const prompt = `Analyze the resume against the job description. Return a JSON object with:
1. alignment_score: 0-100 score of how well the resume matches the job
2. aligned_sections: Array of resume sections that match the job
3. gaps: Array of skills/experience the resume lacks
4. suggestions: Array of honest enhancement suggestions (no false claims)
5. keywords_to_add: Keywords from job posting that could be naturally incorporated

Base Resume:
${baseResume}

Job Description:
${jobDescription}

Return ONLY valid JSON, no other text.`;

    const response = await llmService.callLLMWithFallback(
      llmType,
      prompt,
      ['gpt4', 'claude', 'mixtral']
    );

    try {
      return JSON.parse(response.content);
    } catch (error) {
      console.error('Failed to parse gap analysis JSON', error);
      return {
        alignment_score: 50,
        aligned_sections: [],
        gaps: [],
        suggestions: [],
        keywords_to_add: [],
      };
    }
  }

  /**
   * Generate tailored resume
   */
  async generateTailoredResume(
    baseResume,
    jobDescription,
    jobKeywords,
    template = 'modern',
    llmType = 'gpt4'
  ) {
    const templateFormat = this.getTemplateInstructions(template);

    const prompt = `You are an expert resume writer. Generate a tailored resume based on:

Base Resume:
${baseResume}

Job Description:
${jobDescription}

Job Keywords Extracted:
${JSON.stringify(jobKeywords, null, 2)}

Template Format Requirements:
${templateFormat}

Important constraints:
1. NEVER create false claims or exaggerate
2. Use action verbs and metrics in work experience
3. Naturally incorporate keywords from the job posting
4. Keep the resume to 1-2 pages
5. Maintain ATS compliance: single column, no graphics, standard fonts
6. Format according to the template format
7. Start each work experience bullet with strong action verbs

Generate the tailored resume in plain text format following these sections in order:
[CONTACT INFO]
[HEADLINE]
[PROFESSIONAL SUMMARY]
[CORE SKILLS]
[WORK EXPERIENCE]
[EDUCATION]
[CERTIFICATIONS]
[PROJECTS]

Return the complete formatted resume text.`;

    const response = await llmService.callLLMWithFallback(
      llmType,
      prompt,
      ['gpt4', 'claude', 'mixtral']
    );

    return {
      content: response.content,
      modelUsed: response.modelUsed,
      fallbackUsed: response.fallbackUsed,
    };
  }

  /**
   * Generate JSON structure of resume for frontend rendering
   */
  async parseResumeToJson(resumeText) {
    const prompt = `Parse this resume text into a structured JSON object with sections:
{
  "contactInfo": { "name": "", "email": "", "phone": "", "location": "" },
  "headline": "",
  "professionalSummary": "",
  "coreSkills": [],
  "workExperience": [{ "company": "", "position": "", "startDate": "", "endDate": "", "bullets": [] }],
  "education": [{ "school": "", "degree": "", "field": "", "year": "" }],
  "certifications": [{ "name": "", "issuer": "", "year": "" }],
  "projects": [{ "name": "", "description": "", "technologies": [] }]
}

Resume Text:
${resumeText}

Return ONLY valid JSON, no other text.`;

    const response = await llmService.callLLMWithFallback(
      'gpt4',
      prompt,
      ['gpt4', 'claude']
    );

    try {
      return JSON.parse(response.content);
    } catch (error) {
      console.error('Failed to parse resume JSON', error);
      return null;
    }
  }

  /**
   * Create a summary of what changed
   */
  async generateChangeSummary(baseResume, tailoredResume, llmType = 'gpt4') {
    const prompt = `Compare these two resumes and provide a JSON summary of changes:
{
  "major_changes": [],
  "section_updates": [{ "section": "", "change": "", "reason": "" }],
  "keywords_added": [],
  "maintained_truth": true
}

Original Resume:
${baseResume}

Tailored Resume:
${tailoredResume}

Return ONLY valid JSON, no other text.`;

    const response = await llmService.callLLMWithFallback(
      llmType,
      prompt,
      ['gpt4', 'claude']
    );

    try {
      return JSON.parse(response.content);
    } catch (error) {
      console.error('Failed to parse change summary', error);
      return {
        major_changes: [],
        section_updates: [],
        keywords_added: [],
        maintained_truth: true,
      };
    }
  }

  /**
   * Template format instructions
   */
  getTemplateInstructions(template) {
    const templates = {
      modern: `Use a modern, clean format with clear section headers (bold, uppercase). 
      Spacing: 0.5" margins, single line spacing, 10-11pt font (Calibri or Arial).
      Bold all headers and company names.`,
      classic: `Use a traditional format with horizontal lines separating sections.
      Spacing: 0.75" margins, single line spacing, 11pt font (Times New Roman).
      Centered name and section headers.`,
      minimal: `Use a minimalist format with subtle visual hierarchy.
      Spacing: 0.5" margins, 1pt line spacing, 10pt font (Helvetica or Arial).
      Left-aligned, minimal formatting.`,
      technical: `Use a technical resume format optimized for engineers.
      Emphasis on technical skills, projects, and achievements.
      Include programming languages, frameworks, and tools prominently.`,
    };

    return templates[template] || templates.modern;
  }
}

export default new ResumeTailorService();
