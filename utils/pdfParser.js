import fs from 'fs';
import pdfParse from 'pdf-parse';

class PDFParser {
  /**
   * Extract text content from PDF file
   */
  async extractTextFromPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  /**
   * Parse structured resume data from PDF text
   */
  async parseResumeFromPDF(filePath) {
    try {
      const text = await this.extractTextFromPDF(filePath);
      
      // Check if text is valid
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('PDF contains no readable text or is corrupted');
      }
      
      return this.extractResumeStructure(text);
    } catch (error) {
      throw new Error(`Failed to parse resume from PDF: ${error.message}`);
    }
  }

  /**
   * Extract structured resume data from text
   */
  extractResumeStructure(text) {
    // Check if text is valid
    if (!text || typeof text !== 'string') {
      return {
        contactInfo: { name: '', email: '', phone: '', location: '', linkedin: '' },
        professionalSummary: '',
        workExperience: [],
        education: [],
        skills: { technical: [], tools: [], soft: [], languages: [] },
        certifications: [],
        projects: []
      };
    }

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Check if we have any lines after processing
    if (!lines || lines.length === 0) {
      return {
        contactInfo: { name: '', email: '', phone: '', location: '', linkedin: '' },
        professionalSummary: '',
        workExperience: [],
        education: [],
        skills: { technical: [], tools: [], soft: [], languages: [] },
        certifications: [],
        projects: []
      };
    }
    
    const resume = {
      contactInfo: this.extractContactInfo(lines),
      professionalSummary: this.extractProfessionalSummary(lines),
      workExperience: this.extractWorkExperience(lines),
      education: this.extractEducation(lines),
      skills: this.extractSkills(lines),
      certifications: this.extractCertifications(lines),
      projects: this.extractProjects(lines)
    };

    return resume;
  }

  /**
   * Extract contact information
   */
  extractContactInfo(lines) {
    const contactInfo = {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: ''
    };

    // Check if lines is valid
    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return contactInfo;
    }

    // Usually the first few lines contain contact info
    const contactLines = lines.slice(0, 5);
    
    for (const line of contactLines) {
      // Check if line is valid
      if (!line || typeof line !== 'string') {
        continue;
      }

      // Email extraction
      const emailMatch = line.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
      if (emailMatch && emailMatch[0] && !contactInfo.email) {
        contactInfo.email = emailMatch[0];
      }

      // Phone extraction
      const phoneMatch = line.match(/(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
      if (phoneMatch && phoneMatch[0] && !contactInfo.phone) {
        contactInfo.phone = phoneMatch[0];
      }

      // LinkedIn extraction
      const linkedinMatch = line.match(/linkedin\.com\/in\/[\w-]+/i);
      if (linkedinMatch && linkedinMatch[0] && !contactInfo.linkedin) {
        contactInfo.linkedin = linkedinMatch[0];
      }

      // Name extraction (usually first line without email/phone)
      if (!contactInfo.name && !emailMatch && !phoneMatch && !linkedinMatch && line.length < 50) {
        contactInfo.name = line;
      }

      // Location extraction
      if (!contactInfo.location && line.includes(',') && !emailMatch && !phoneMatch && !linkedinMatch) {
        const possibleLocation = line.match(/([A-Za-z\s]+,\s*[A-Za-z\s]+)/);
        if (possibleLocation && possibleLocation[1]) {
          contactInfo.location = possibleLocation[1];
        }
      }
    }

    return contactInfo;
  }

  /**
   * Extract professional summary
   */
  extractProfessionalSummary(lines) {
    // Check if lines is valid
    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return '';
    }

    const summaryKeywords = ['summary', 'objective', 'profile', 'about', 'overview'];
    let summary = '';
    let summaryStarted = false;
    let summaryEnded = false;

    for (let i = 0; i < lines.length; i++) {
      // Check if current line is valid
      if (!lines[i] || typeof lines[i] !== 'string') {
        continue;
      }

      const line = lines[i].toLowerCase();
      
      if (summaryKeywords.some(keyword => line.includes(keyword)) && !summaryStarted) {
        summaryStarted = true;
        continue;
      }

      if (summaryStarted && !summaryEnded) {
        // Stop at next section header
        if (this.isSectionHeader(lines[i])) {
          summaryEnded = true;
          break;
        }
        
        if (lines[i].length > 10) {
          summary += (summary ? ' ' : '') + lines[i];
        }
      }
    }

    return summary;
  }

  /**
   * Extract work experience
   */
  extractWorkExperience(lines) {
    // Check if lines is valid
    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return [];
    }

    const experiences = [];
    let currentExperience = null;
    let inExperienceSection = false;

    const experienceKeywords = ['experience', 'work', 'employment', 'career', 'professional'];

    for (let i = 0; i < lines.length; i++) {
      // Check if current line is valid
      if (!lines[i] || typeof lines[i] !== 'string') {
        continue;
      }

      const line = lines[i].toLowerCase();
      
      // Check if we're entering experience section
      if (experienceKeywords.some(keyword => line.includes(keyword))) {
        inExperienceSection = true;
        continue;
      }

      // Check if we've left experience section
      if (inExperienceSection && this.isSectionHeader(lines[i]) && 
          !experienceKeywords.some(keyword => line.includes(keyword))) {
        if (currentExperience) {
          experiences.push(currentExperience);
          currentExperience = null;
        }
        inExperienceSection = false;
        continue;
      }

      if (inExperienceSection) {
        // Check for company/title line (usually contains dates)
        const dateMatch = lines[i].match(/(\d{1,2}\/\d{4}|\d{4}|\d{1,2}\/\d{2}|\d{2}\/\d{4}|present|current)/i);
        
        if (dateMatch || (lines[i].includes('–') || lines[i].includes('-'))) {
          // Save previous experience if exists
          if (currentExperience) {
            experiences.push(currentExperience);
          }

          // Extract company, title, and dates
          const parts = lines[i].split(/[\–\-\t]/);
          currentExperience = {
            company: '',
            position: '',
            startDate: '',
            endDate: '',
            bullets: []
          };

          // Try to parse dates
          const dateLine = lines[i];
          const dates = this.extractDates(dateLine);
          if (dates) {
            currentExperience.startDate = dates.start || '';
            currentExperience.endDate = dates.end || '';
          }

          // Extract company and position from the line
          const nonDateParts = lines[i].replace(dateMatch ? dateMatch[0] : '', '').trim();
          if (nonDateParts) {
            // Usually format is "Position at Company" or "Company - Position"
            if (nonDateParts.toLowerCase().includes(' at ')) {
              const [position, company] = nonDateParts.split(' at ');
              if (position) currentExperience.position = position.trim();
              if (company) currentExperience.company = company.trim();
            } else if (nonDateParts.includes(' – ') || nonDateParts.includes(' - ')) {
              const [company, position] = nonDateParts.split(/[\–\-\s]+/);
              if (company) currentExperience.company = company.trim();
              if (position) currentExperience.position = position.trim();
            } else {
              currentExperience.company = nonDateParts;
            }
          }
        } else if (currentExperience && (lines[i].startsWith('•') || 
                   lines[i].startsWith('-') || 
                   lines[i].startsWith('*') ||
                   lines[i].match(/^\d+\./))) {
          // Bullet point
          const bullet = lines[i].replace(/^[•\-\*\d\.]\s*/, '');
          if (bullet && bullet.length > 5) {
            currentExperience.bullets.push(bullet);
          }
        } else if (currentExperience && lines[i].length > 20 && !this.isSectionHeader(lines[i])) {
          // Regular text that might be a bullet
          currentExperience.bullets.push(lines[i]);
        }
      }
    }

    // Add last experience if exists
    if (currentExperience) {
      experiences.push(currentExperience);
    }

    return experiences;
  }

  /**
   * Extract education information
   */
  extractEducation(lines) {
    // Check if lines is valid
    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return [];
    }

    const education = [];
    let inEducationSection = false;
    let currentEducation = null;

    const educationKeywords = ['education', 'academic', 'university', 'college', 'degree'];

    for (let i = 0; i < lines.length; i++) {
      // Check if current line is valid
      if (!lines[i] || typeof lines[i] !== 'string') {
        continue;
      }

      const line = lines[i].toLowerCase();
      
      if (educationKeywords.some(keyword => line.includes(keyword))) {
        inEducationSection = true;
        continue;
      }

      if (inEducationSection && this.isSectionHeader(lines[i]) && 
          !educationKeywords.some(keyword => line.includes(keyword))) {
        if (currentEducation) {
          education.push(currentEducation);
          currentEducation = null;
        }
        inEducationSection = false;
        continue;
      }

      if (inEducationSection) {
        // Look for degree patterns
        const degreePattern = /(bachelor|master|phd|associate|doctorate|b\.s\.|m\.s\.|b\.a\.|m\.a\.)/i;
        
        if (degreePattern.test(lines[i]) || lines[i].toLowerCase().includes('university') || 
            lines[i].toLowerCase().includes('college')) {
          
          if (currentEducation) {
            education.push(currentEducation);
          }

          currentEducation = {
            school: '',
            degree: '',
            field: '',
            year: '',
            gpa: ''
          };

          // Extract year
          const yearMatch = lines[i].match(/\b(19|20)\d{2}\b/);
          if (yearMatch && yearMatch[0]) {
            currentEducation.year = yearMatch[0];
          }

          // Extract GPA
          const gpaMatch = lines[i].match(/gpa[:\s]*([0-9]\.[0-9]+)/i);
          if (gpaMatch && gpaMatch[1]) {
            currentEducation.gpa = gpaMatch[1];
          }

          // Extract school name
          const schoolPattern = /(university|college|institute|school of|academy)/i;
          if (schoolPattern.test(lines[i])) {
            currentEducation.school = lines[i];
          }

          // Extract degree
          if (degreePattern.test(lines[i])) {
            currentEducation.degree = lines[i];
          }
        } else if (currentEducation && lines[i].length > 10) {
          // Additional education details
          if (lines[i].toLowerCase().includes('major') || lines[i].toLowerCase().includes('field')) {
            currentEducation.field = lines[i];
          }
        }
      }
    }

    if (currentEducation) {
      education.push(currentEducation);
    }

    return education;
  }

  /**
   * Extract skills section
   */
  extractSkills(lines) {
    // Check if lines is valid
    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return {
        technical: [],
        tools: [],
        soft: [],
        languages: []
      };
    }

    const skills = {
      technical: [],
      tools: [],
      soft: [],
      languages: []
    };

    let inSkillsSection = false;
    const skillsKeywords = ['skills', 'technical', 'technologies', 'competencies', 'abilities'];

    for (let i = 0; i < lines.length; i++) {
      // Check if current line is valid
      if (!lines[i] || typeof lines[i] !== 'string') {
        continue;
      }

      const line = lines[i].toLowerCase();
      
      if (skillsKeywords.some(keyword => line.includes(keyword))) {
        inSkillsSection = true;
        continue;
      }

      if (inSkillsSection && this.isSectionHeader(lines[i])) {
        inSkillsSection = false;
        continue;
      }

      if (inSkillsSection && lines[i].length > 0) {
        // Split by common separators
        const skillList = lines[i].split(/[,;•\-\n]/).map(skill => skill.trim()).filter(skill => skill.length > 0);
        
        for (const skill of skillList) {
          // Categorize skills
          if (this.isTechnicalSkill(skill)) {
            skills.technical.push(skill);
          } else if (this.isTool(skill)) {
            skills.tools.push(skill);
          } else if (this.isLanguage(skill)) {
            skills.languages.push(skill);
          } else {
            skills.soft.push(skill);
          }
        }
      }
    }

    return skills;
  }

  /**
   * Extract certifications
   */
  extractCertifications(lines) {
    // Check if lines is valid
    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return [];
    }

    const certifications = [];
    let inCertSection = false;
    const certKeywords = ['certification', 'certificate', 'licensed', 'credential'];

    for (let i = 0; i < lines.length; i++) {
      // Check if current line is valid
      if (!lines[i] || typeof lines[i] !== 'string') {
        continue;
      }

      const line = lines[i].toLowerCase();
      
      if (certKeywords.some(keyword => line.includes(keyword))) {
        inCertSection = true;
        continue;
      }

      if (inCertSection && this.isSectionHeader(lines[i])) {
        inCertSection = false;
        continue;
      }

      if (inCertSection && lines[i].length > 10) {
        const yearMatch = lines[i].match(/\b(19|20)\d{2}\b/);
        certifications.push({
          name: lines[i],
          issuer: '',
          year: yearMatch ? yearMatch[0] : ''
        });
      }
    }

    return certifications;
  }

  /**
   * Extract projects
   */
  extractProjects(lines) {
    // Check if lines is valid
    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return [];
    }

    const projects = [];
    let inProjectsSection = false;
    let currentProject = null;
    const projectKeywords = ['project', 'portfolio', 'work'];

    for (let i = 0; i < lines.length; i++) {
      // Check if current line is valid
      if (!lines[i] || typeof lines[i] !== 'string') {
        continue;
      }

      const line = lines[i].toLowerCase();
      
      if (projectKeywords.some(keyword => line.includes(keyword))) {
        inProjectsSection = true;
        continue;
      }

      if (inProjectsSection && this.isSectionHeader(lines[i]) && 
          !projectKeywords.some(keyword => line.includes(keyword))) {
        if (currentProject) {
          projects.push(currentProject);
          currentProject = null;
        }
        inProjectsSection = false;
        continue;
      }

      if (inProjectsSection) {
        if (lines[i].length > 5 && !lines[i].startsWith('•') && 
            !lines[i].startsWith('-') && !lines[i].startsWith('*')) {
          if (currentProject) {
            projects.push(currentProject);
          }
          currentProject = {
            name: lines[i],
            description: '',
            technologies: []
          };
        } else if (currentProject && (lines[i].startsWith('•') || lines[i].startsWith('-'))) {
          const bullet = lines[i].replace(/^[•\-\*]\s*/, '');
          if (bullet && this.isTechnicalSkill(bullet)) {
            currentProject.technologies.push(bullet);
          } else if (bullet) {
            currentProject.description += (currentProject.description ? ' ' : '') + bullet;
          }
        }
      }
    }

    if (currentProject) {
      projects.push(currentProject);
    }

    return projects;
  }

  /**
   * Helper methods
   */
  isSectionHeader(line) {
    // Check if line is valid
    if (!line || typeof line !== 'string') {
      return false;
    }

    const sectionHeaders = [
      'experience', 'education', 'skills', 'projects', 'certifications',
      'summary', 'objective', 'profile', 'contact', 'references'
    ];
    return sectionHeaders.some(header => line.toLowerCase().includes(header)) && 
           line.length < 50 && line === line.toUpperCase();
  }

  extractDates(text) {
    // Check if text is valid
    if (!text || typeof text !== 'string') {
      return null;
    }

    // Match various date formats
    const datePatterns = [
      /(\d{1,2}\/\d{4})\s*[–\-–]\s*(\d{1,2}\/\d{4})/,  // MM/YYYY - MM/YYYY
      /(\d{4})\s*[–\-–]\s*(\d{4})/,                    // YYYY - YYYY
      /(\d{1,2}\/\d{2})\s*[–\-–]\s*(present|current)/i, // MM/YY - Present
      /(\d{4})\s*[–\-–]\s*(present|current)/i           // YYYY - Present
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return {
          start: match[1],
          end: match[2] || ''
        };
      }
    }

    return null;
  }

  isTechnicalSkill(skill) {
    // Check if skill is valid
    if (!skill || typeof skill !== 'string') {
      return false;
    }

    const techKeywords = [
      'javascript', 'python', 'java', 'react', 'node', 'angular', 'vue', 'docker',
      'aws', 'azure', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'git',
      'html', 'css', 'typescript', 'nodejs', 'express', 'django', 'flask',
      'kubernetes', 'terraform', 'ci/cd', 'devops', 'linux', 'ubuntu', 'api',
      'rest', 'graphql', 'microservices', 'machine learning', 'ai', 'data science'
    ];
    return techKeywords.some(keyword => skill.toLowerCase().includes(keyword));
  }

  isTool(skill) {
    // Check if skill is valid
    if (!skill || typeof skill !== 'string') {
      return false;
    }

    const toolKeywords = [
      'excel', 'powerpoint', 'word', 'slack', 'jira', 'trello', 'figma', 'photoshop',
      'illustrator', 'sketch', 'tableau', 'power bi', 'salesforce', 'hubspot'
    ];
    return toolKeywords.some(keyword => skill.toLowerCase().includes(keyword));
  }

  isLanguage(skill) {
    // Check if skill is valid
    if (!skill || typeof skill !== 'string') {
      return false;
    }

    const langKeywords = [
      'english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'korean',
      'portuguese', 'russian', 'arabic', 'hindi'
    ];
    return langKeywords.some(keyword => skill.toLowerCase().includes(keyword));
  }
}

export default new PDFParser();