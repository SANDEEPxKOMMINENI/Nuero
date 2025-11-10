import llmService from './llmService.js';
import pdfParser from '../utils/pdfParser.js';
import jobScraper from '../utils/jobScraper.js';

class ResumeTailorService {
  
  /**
   * Clean JSON response from LLM by removing markdown code blocks
   */
  cleanJsonResponse(content) {
    if (!content || typeof content !== 'string') {
      return content;
    }
    
    // Remove markdown code blocks (```json ... ```)
    let cleaned = content.replace(/```json\s*/i, '').replace(/```\s*$/, '');
    
    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();
    
    return cleaned;
  }

  /**
   * Parse resume from PDF file
   */
  async parseResumeFromPDF(filePath) {
    try {
      const structuredResume = await pdfParser.parseResumeFromPDF(filePath);
      return {
        success: true,
        data: structuredResume,
        text: this.formatResumeAsText(structuredResume)
      };
    } catch (error) {
      console.error('PDF parsing error:', error);
      return {
        success: false,
        error: error.message,
        data: null,
        text: ''
      };
    }
  }

  /**
   * Scrape job description from URL
   */
  async scrapeJobFromUrl(url) {
    try {
      if (!jobScraper.isValidJobUrl(url)) {
        throw new Error('Invalid job posting URL. Please use LinkedIn, Indeed, or company career page URLs.');
      }

      const jobData = await jobScraper.scrapeJobFromUrl(url);
      
      // Format the scraped data into a coherent job description
      const formattedDescription = this.formatJobDescription(jobData);
      
      return {
        success: true,
        data: jobData,
        description: formattedDescription
      };
    } catch (error) {
      console.error('Job scraping error:', error);
      return {
        success: false,
        error: error.message,
        data: null,
        description: ''
      };
    }
  }

  /**
   * Format structured resume as text
   */
  formatResumeAsText(resume) {
    let text = '';
    
    // Contact info
    if (resume.contactInfo) {
      text += `CONTACT INFO:\n`;
      text += `Name: ${resume.contactInfo.name || ''}\n`;
      text += `Email: ${resume.contactInfo.email || ''}\n`;
      text += `Phone: ${resume.contactInfo.phone || ''}\n`;
      text += `Location: ${resume.contactInfo.location || ''}\n`;
      text += `LinkedIn: ${resume.contactInfo.linkedin || ''}\n\n`;
    }

    // Professional summary
    if (resume.professionalSummary) {
      text += `PROFESSIONAL SUMMARY:\n${resume.professionalSummary}\n\n`;
    }

    // Work experience
    if (resume.workExperience && resume.workExperience.length > 0) {
      text += `WORK EXPERIENCE:\n`;
      resume.workExperience.forEach(exp => {
        text += `${exp.position || ''} at ${exp.company || ''}\n`;
        text += `${exp.startDate || ''} - ${exp.endDate || ''}\n`;
        if (exp.bullets && exp.bullets.length > 0) {
          exp.bullets.forEach(bullet => {
            text += `• ${bullet}\n`;
          });
        }
        text += '\n';
      });
    }

    // Education
    if (resume.education && resume.education.length > 0) {
      text += `EDUCATION:\n`;
      resume.education.forEach(edu => {
        text += `${edu.degree || ''} at ${edu.school || ''}\n`;
        text += `${edu.year || ''}${edu.gpa ? ` (GPA: ${edu.gpa})` : ''}\n\n`;
      });
    }

    // Skills
    if (resume.skills) {
      text += `SKILLS:\n`;
      if (resume.skills.technical && resume.skills.technical.length > 0) {
        text += `Technical: ${resume.skills.technical.join(', ')}\n`;
      }
      if (resume.skills.tools && resume.skills.tools.length > 0) {
        text += `Tools: ${resume.skills.tools.join(', ')}\n`;
      }
      if (resume.skills.soft && resume.skills.soft.length > 0) {
        text += `Soft Skills: ${resume.skills.soft.join(', ')}\n`;
      }
      if (resume.skills.languages && resume.skills.languages.length > 0) {
        text += `Languages: ${resume.skills.languages.join(', ')}\n`;
      }
      text += '\n';
    }

    // Certifications
    if (resume.certifications && resume.certifications.length > 0) {
      text += `CERTIFICATIONS:\n`;
      resume.certifications.forEach(cert => {
        text += `${cert.name || ''}${cert.year ? ` (${cert.year})` : ''}\n`;
      });
      text += '\n';
    }

    // Projects
    if (resume.projects && resume.projects.length > 0) {
      text += `PROJECTS:\n`;
      resume.projects.forEach(project => {
        text += `${project.name || ''}\n`;
        if (project.description) {
          text += `${project.description}\n`;
        }
        if (project.technologies && project.technologies.length > 0) {
          text += `Technologies: ${project.technologies.join(', ')}\n`;
        }
        text += '\n';
      });
    }

    return text;
  }

  /**
   * Format scraped job data into description
   */
  formatJobDescription(jobData) {
    let description = '';
    
    if (jobData.title) {
      description += `Job Title: ${jobData.title}\n\n`;
    }
    
    if (jobData.company) {
      description += `Company: ${jobData.company}\n\n`;
    }
    
    if (jobData.location) {
      description += `Location: ${jobData.location}\n\n`;
    }
    
    if (jobData.description) {
      description += `Job Description:\n${jobData.description}\n\n`;
    }
    
    if (jobData.responsibilities && jobData.responsibilities.length > 0) {
      description += `Key Responsibilities:\n`;
      jobData.responsibilities.forEach(resp => {
        description += `• ${resp}\n`;
      });
      description += '\n';
    }
    
    if (jobData.requirements && jobData.requirements.length > 0) {
      description += `Requirements:\n`;
      jobData.requirements.forEach(req => {
        description += `• ${req}\n`;
      });
      description += '\n';
    }
    
    if (jobData.skills && jobData.skills.length > 0) {
      description += `Required Skills:\n${jobData.skills.join(', ')}\n\n`;
    }
    
    if (jobData.qualifications && jobData.qualifications.length > 0) {
      description += `Qualifications:\n`;
      jobData.qualifications.forEach(qual => {
        description += `• ${qual}\n`;
      });
      description += '\n';
    }
    
    if (jobData.salary) {
      description += `Salary: ${jobData.salary}\n\n`;
    }
    
    if (jobData.employmentType) {
      description += `Employment Type: ${jobData.employmentType}\n\n`;
    }
    
    return description;
  }

  /**
   * Extract key information from job description
   */
  async extractJobKeywords(jobDescription, llmType = 'gpt4') {
    const prompt = `You are an expert ATS (Applicant Tracking System) analyst. Extract and categorize key information from this job description. Return as JSON:

{
  "job_title": "The exact job title",
  "seniority_level": "Entry, Mid, Senior, Lead, Principal, etc.",
  "required_skills": {
    "technical": ["Programming languages, frameworks, tools"],
    "soft": ["Communication, leadership, teamwork"],
    "certifications": ["Required certifications if any"]
  },
  "key_responsibilities": ["Main duties and responsibilities"],
  "keywords": {
    "technical_terms": ["Industry-specific jargon, technologies"],
    "action_verbs": ["Action verbs used in description"],
    "qualifications": ["Degree, experience requirements"]
  },
  "experience_requirements": {
    "years_min": "Minimum years if specified",
    "years_preferred": "Preferred years if specified",
    "specific_experience": ["Specific types of experience needed"]
  },
  "company_values": ["Company culture, values mentioned"],
  "nice_to_have": ["Bonus skills or qualifications"]
}

Job Description:
${jobDescription}

Return ONLY valid JSON, no other text. Be thorough and extract all relevant information that would help tailor a resume.`;

    const response = await llmService.callLLMWithFallback(
      llmType,
      prompt,
      ['gpt4', 'claude', 'mixtral']
    );

    try {
      const cleanedContent = this.cleanJsonResponse(response.content);
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error('Failed to parse job keywords JSON', error);
      return {
        job_title: 'Position',
        seniority_level: 'Mid',
        required_skills: { technical: [], soft: [], certifications: [] },
        key_responsibilities: [],
        keywords: { technical_terms: [], action_verbs: [], qualifications: [] },
        experience_requirements: { years_min: '', years_preferred: '', specific_experience: [] },
        company_values: [],
        nice_to_have: []
      };
    }
  }

  /**
   * Compare base resume with job description and identify gaps
   */
  async analyzeResumeGaps(baseResume, jobDescription, llmType = 'gpt4') {
    const prompt = `You are an expert career coach and ATS specialist. Analyze this resume against the job description and provide detailed gap analysis. Return as JSON:

{
  "alignment_score": {
    "overall": 0-100,
    "skills_match": 0-100,
    "experience_match": 0-100,
    "qualifications_match": 0-100
  },
  "aligned_sections": {
    "skills": ["Matching skills found in resume"],
    "experience": ["Relevant experience"],
    "education": ["Matching educational background"]
  },
  "critical_gaps": {
    "missing_skills": ["Skills mentioned in job but not in resume"],
    "missing_experience": ["Experience requirements not met"],
    "missing_qualifications": ["Qualifications not found"]
  },
  "enhancement_opportunities": {
    "bullet_point_improvements": ["Specific suggestions to improve bullets"],
    "skills_to_emphasize": ["Skills to highlight more prominently"],
    "experience_rephrasing": ["How to better frame existing experience"]
  },
  "keywords_to_naturally_add": {
    "technical": ["Technical keywords to incorporate"],
    "action_verbs": ["Action verbs from job description"],
    "industry_terms": ["Industry-specific terminology"]
  },
  "honesty_guidelines": {
    "can_claim": ["What can be honestly claimed"],
    "cannot_claim": ["What to avoid claiming"],
    "rephrasing_suggestions": ["How to rephrase existing truth"]
  },
  "priority_improvements": ["Top 3-5 priority areas to address"]
}

Base Resume:
${baseResume}

Job Description:
${jobDescription}

Return ONLY valid JSON, no other text. Focus on actionable, honest improvements that maintain integrity while optimizing for ATS.`;

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
        alignment_score: { overall: 50, skills_match: 50, experience_match: 50, qualifications_match: 50 },
        aligned_sections: { skills: [], experience: [], education: [] },
        critical_gaps: { missing_skills: [], missing_experience: [], missing_qualifications: [] },
        enhancement_opportunities: { bullet_point_improvements: [], skills_to_emphasize: [], experience_rephrasing: [] },
        keywords_to_naturally_add: { technical: [], action_verbs: [], industry_terms: [] },
        honesty_guidelines: { can_claim: [], cannot_claim: [], rephrasing_suggestions: [] },
        priority_improvements: []
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

    const prompt = `You are an elite resume writer and ATS optimization expert. Create a perfectly tailored resume that maximizes interview chances while maintaining 100% honesty.

BASE RESUME:
${baseResume}

TARGET JOB DESCRIPTION:
${jobDescription}

EXTRACTED JOB KEYWORDS:
${JSON.stringify(jobKeywords, null, 2)}

TEMPLATE REQUIREMENTS:
${templateFormat}

CRITICAL INSTRUCTIONS:

1. HONESTY & INTEGRITY:
   - NEVER fabricate experience, skills, or achievements
   - Only enhance and rephrase existing truthful information
   - If something doesn't exist, don't mention it
   - Focus on better presentation of actual experience

2. ATS OPTIMIZATION:
   - Use exact keywords from job description naturally
   - Include action verbs from the job posting
   - Match terminology used by the company
   - Standard section names for ATS parsing
   - Single column, simple formatting only

3. BULLET POINT EXCELLENCE:
   - Start every bullet with strong action verbs
   - Include quantifiable metrics when possible (%, $, numbers)
   - Use STAR method (Situation, Task, Action, Result)
   - Keep bullets to 1-2 lines maximum
   - Focus on impact and achievements, not just duties

4. PROFESSIONAL SUMMARY:
   - 3-4 lines maximum
   - Include the exact job title from posting
   - Mention 2-3 key skills from requirements
   - Highlight years of relevant experience
   - Include one major achievement

5. SKILLS SECTION:
   - Group skills by category (Technical, Tools, Soft Skills)
   - Prioritize skills mentioned in job description
   - Include proficiency levels if appropriate
   - Use exact terminology from job posting

6. EXPERIENCE REFRAMING:
   - Emphasize responsibilities that match job requirements
   - Rephrase achievements using job description language
   - Highlight transferable skills
   - Quantify results whenever possible

RESUME STRUCTURE (return in this exact format):

[CONTACT INFO]
Name | Email | Phone | Location | LinkedIn URL

[HEADLINE]
[Job Title from posting] | [Years of experience] | [2-3 key specializations]

[PROFESSIONAL SUMMARY]
3-4 lines tailored summary

[CORE SKILLS]
Technical: [List 8-10 relevant technical skills]
Tools: [List 5-7 relevant tools]
Soft Skills: [List 4-6 relevant soft skills]

[WORK EXPERIENCE]
[Most Recent Position]
Company | Location
Start Date – End Date
• [Achievement with metric]
• [Responsibility matching job requirement]
• [Skill demonstration with result]
• [Quantifiable impact]

[Previous Position]
Company | Location  
Start Date – End Date
• [Relevant achievement]
• [Transferable skill highlight]
• [Quantifiable result]

[EDUCATION]
Degree | University | Year
[Relevant coursework or achievements]

[CERTIFICATIONS]
[Certification Name] | [Issuing Organization] | [Year]

[PROJECTS] (if applicable)
[Project Name] | [Technologies used]
• [Brief description with impact]

Return ONLY the complete formatted resume text, no explanations.`;

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
      const cleanedContent = this.cleanJsonResponse(response.content);
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error('Failed to parse resume JSON', error);
      return null;
    }
  }

  /**
   * Create a summary of what changed
   */
  async generateChangeSummary(baseResume, tailoredResume, llmType = 'gpt4') {
    const prompt = `You are an expert resume analyst. Compare these two resumes and provide a detailed analysis of improvements made. Return as JSON:

{
  "overall_improvements": {
    "ats_optimization_score": 0-100,
    "keyword_integration": 0-100,
    "impact_framing": 0-100,
    "readability_score": 0-100
  },
  "major_changes": [
    {
      "section": "Professional Summary/Experience/Etc",
      "change_type": "addition/rewriting/reordering",
      "specific_change": "What was changed",
      "improvement_reason": "Why this helps",
      "ats_impact": "How this affects ATS parsing"
    }
  ],
  "keyword_improvements": {
    "added_from_job": ["Keywords incorporated from job description"],
    "action_verbs_added": ["Strong action verbs introduced"],
    "technical_terms": ["Technical terminology added"],
    "industry_jargon": ["Industry-specific terms included"]
  },
  "bullet_point_enhancements": {
    "total_bullets_improved": 0,
    "metrics_added": 0,
    "action_verbs_added": 0,
    "quantified_results": 0
  },
  "section_analysis": {
    "summary_improvement": "How summary was enhanced",
    "skills_alignment": "How skills better match job",
    "experience_reframing": "How experience was better presented",
    "format_improvements": "ATS-friendly format changes"
  },
  "honesty_verification": {
    "maintained_truth": true,
    "enhanced_without_fabrication": "How truth was maintained while improving",
    "no_false_claims": "Confirmation of honesty"
  },
  "interview_readiness": {
    "strengths_highlighted": ["Key strengths now emphasized"],
    "gaps_addressed": ["How potential gaps were handled"],
    "story_coherence": "How resume tells a compelling story"
  }
}

ORIGINAL RESUME:
${baseResume}

TAILORED RESUME:
${tailoredResume}

Return ONLY valid JSON, no other text. Focus on specific, actionable improvements that increase interview chances.`;

    const response = await llmService.callLLMWithFallback(
      llmType,
      prompt,
      ['gpt4', 'claude']
    );

    try {
      const cleanedContent = this.cleanJsonResponse(response.content);
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error('Failed to parse change summary', error);
      return {
        overall_improvements: { ats_optimization_score: 50, keyword_integration: 50, impact_framing: 50, readability_score: 50 },
        major_changes: [],
        keyword_improvements: { added_from_job: [], action_verbs_added: [], technical_terms: [], industry_jargon: [] },
        bullet_point_enhancements: { total_bullets_improved: 0, metrics_added: 0, action_verbs_added: 0, quantified_results: 0 },
        section_analysis: { summary_improvement: '', skills_alignment: '', experience_reframing: '', format_improvements: '' },
        honesty_verification: { maintained_truth: true, enhanced_without_fabrication: '', no_false_claims: '' },
        interview_readiness: { strengths_highlighted: [], gaps_addressed: [], story_coherence: '' }
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
