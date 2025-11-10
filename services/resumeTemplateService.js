class ResumeTemplateService {
  constructor() {
    this.templates = {
      modern: {
        name: 'Modern Professional',
        description: 'Clean, contemporary design with clear visual hierarchy',
        format: {
          font: 'Calibri',
          fontSize: 11,
          margins: 0.5,
          lineHeight: 1.15,
          sectionSpacing: 12,
          bulletStyle: 'circle'
        },
        styling: {
          headerStyle: 'bold, uppercase, 14pt',
          companyStyle: 'bold, 11pt',
          titleStyle: 'italic, 11pt',
          dateStyle: 'right-aligned, 10pt'
        }
      },
      classic: {
        name: 'Classic Traditional',
        description: 'Traditional format with horizontal lines and conservative styling',
        format: {
          font: 'Times New Roman',
          fontSize: 12,
          margins: 0.75,
          lineHeight: 1.2,
          sectionSpacing: 18,
          bulletStyle: 'disc'
        },
        styling: {
          headerStyle: 'bold, underline, 12pt',
          companyStyle: 'bold, 12pt',
          titleStyle: 'regular, 12pt',
          dateStyle: 'italic, 11pt'
        }
      },
      minimal: {
        name: 'Minimal Clean',
        description: 'Minimalist design with subtle visual elements',
        format: {
          font: 'Arial',
          fontSize: 10,
          margins: 0.6,
          lineHeight: 1.1,
          sectionSpacing: 10,
          bulletStyle: 'dash'
        },
        styling: {
          headerStyle: 'bold, 11pt',
          companyStyle: 'bold, 10pt',
          titleStyle: 'regular, 10pt',
          dateStyle: 'regular, 9pt'
        }
      },
      executive: {
        name: 'Executive Elite',
        description: 'Premium design for senior professionals with enhanced formatting',
        format: {
          font: 'Georgia',
          fontSize: 11,
          margins: 0.7,
          lineHeight: 1.25,
          sectionSpacing: 16,
          bulletStyle: 'square'
        },
        styling: {
          headerStyle: 'bold, uppercase, small-caps, 13pt',
          companyStyle: 'bold, 11pt',
          titleStyle: 'italic, bold, 11pt',
          dateStyle: 'right-aligned, italic, 10pt'
        }
      },
      creative: {
        name: 'Creative Modern',
        description: 'Modern design with creative elements for design/tech roles',
        format: {
          font: 'Helvetica',
          fontSize: 10.5,
          margins: 0.55,
          lineHeight: 1.18,
          sectionSpacing: 14,
          bulletStyle: 'arrow'
        },
        styling: {
          headerStyle: 'bold, 12pt, bottom-border',
          companyStyle: 'bold, 10.5pt',
          titleStyle: 'regular, 10.5pt',
          dateStyle: 'right-aligned, 9.5pt'
        }
      },
      technical: {
        name: 'Technical Professional',
        description: 'Optimized for technical roles with clear skill sections',
        format: {
          font: 'Consolas',
          fontSize: 10,
          margins: 0.5,
          lineHeight: 1.1,
          sectionSpacing: 11,
          bulletStyle: 'technical'
        },
        styling: {
          headerStyle: 'bold, uppercase, 11pt',
          companyStyle: 'bold, 10pt',
          titleStyle: 'regular, 10pt',
          dateStyle: 'right-aligned, 9pt'
        }
      }
    };
  }

  /**
   * Get all available templates
   */
  getAvailableTemplates() {
    return Object.keys(this.templates).map(key => ({
      id: key,
      name: this.templates[key].name,
      description: this.templates[key].description
    }));
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId) {
    return this.templates[templateId] || this.templates.modern;
  }

  /**
   * Format resume text according to template
   */
  formatResumeText(resumeData, templateId = 'modern') {
    const template = this.getTemplate(templateId);
    const { format, styling } = template;
    
    let formattedText = '';
    
    // Contact Information
    if (resumeData.contactInfo) {
      formattedText += this.formatContactInfo(resumeData.contactInfo, format);
    }
    
    // Professional Summary
    if (resumeData.professionalSummary) {
      formattedText += '\n\n' + this.formatSectionHeader('PROFESSIONAL SUMMARY', styling);
      formattedText += '\n' + resumeData.professionalSummary;
    }
    
    // Core Skills
    if (resumeData.coreSkills && resumeData.coreSkills.length > 0) {
      formattedText += '\n\n' + this.formatSectionHeader('CORE SKILLS', styling);
      formattedText += '\n' + resumeData.coreSkills.join(' • ');
    }
    
    // Work Experience
    if (resumeData.workExperience && resumeData.workExperience.length > 0) {
      formattedText += '\n\n' + this.formatSectionHeader('WORK EXPERIENCE', styling);
      formattedText += '\n' + this.formatWorkExperience(resumeData.workExperience, format, styling);
    }
    
    // Education
    if (resumeData.education && resumeData.education.length > 0) {
      formattedText += '\n\n' + this.formatSectionHeader('EDUCATION', styling);
      formattedText += '\n' + this.formatEducation(resumeData.education, format, styling);
    }
    
    // Skills
    if (resumeData.skills) {
      formattedText += '\n\n' + this.formatSectionHeader('TECHNICAL SKILLS', styling);
      formattedText += '\n' + this.formatSkills(resumeData.skills, format);
    }
    
    // Certifications
    if (resumeData.certifications && resumeData.certifications.length > 0) {
      formattedText += '\n\n' + this.formatSectionHeader('CERTIFICATIONS', styling);
      formattedText += '\n' + this.formatCertifications(resumeData.certifications, format);
    }
    
    return formattedText.trim();
  }

  /**
   * Format contact information
   */
  formatContactInfo(contactInfo, format) {
    let contact = '';
    
    if (contactInfo.name) {
      contact += contactInfo.name.toUpperCase() + '\n';
    }
    
    const contactParts = [];
    if (contactInfo.email) contactParts.push(contactInfo.email);
    if (contactInfo.phone) contactParts.push(contactInfo.phone);
    if (contactInfo.location) contactParts.push(contactInfo.location);
    if (contactInfo.linkedin) contactParts.push(contactInfo.linkedin);
    
    if (contactParts.length > 0) {
      contact += contactParts.join(' | ');
    }
    
    // Add hyperlinks if available
    if (contactInfo.hyperlinks && contactInfo.hyperlinks.length > 0) {
      contact += '\n' + contactInfo.hyperlinks.join(' | ');
    }
    
    return contact;
  }

  /**
   * Format section header
   */
  formatSectionHeader(title, styling) {
    return `[${title}]`;
  }

  /**
   * Format work experience
   */
  formatWorkExperience(experiences, format, styling) {
    return experiences.map(exp => {
      let expText = '';
      
      if (exp.company) {
        expText += exp.company.toUpperCase();
      }
      
      if (exp.position) {
        expText += expText ? ' - ' + exp.position : exp.position;
      }
      
      if (exp.startDate || exp.endDate) {
        const dates = `${exp.startDate || ''} - ${exp.endDate || 'Present'}`;
        expText += expText ? ' | ' + dates : dates;
      }
      
      if (exp.bullets && exp.bullets.length > 0) {
        expText += '\n' + exp.bullets.map(bullet => `• ${bullet}`).join('\n');
      }
      
      return expText;
    }).join('\n\n');
  }

  /**
   * Format education
   */
  formatEducation(education, format, styling) {
    return education.map(edu => {
      let eduText = '';
      
      if (edu.school) {
        eduText += edu.school;
      }
      
      if (edu.degree) {
        eduText += eduText ? ' - ' + edu.degree : edu.degree;
      }
      
      if (edu.field) {
        eduText += eduText ? ' in ' + edu.field : edu.field;
      }
      
      if (edu.year || edu.gpa) {
        const details = [edu.year, edu.gpa ? `GPA: ${edu.gpa}` : null].filter(Boolean);
        eduText += eduText ? ' | ' + details.join(', ') : details.join(', ');
      }
      
      return eduText;
    }).join('\n');
  }

  /**
   * Format skills
   */
  formatSkills(skills, format) {
    const skillSections = [];
    
    if (skills.technical && skills.technical.length > 0) {
      skillSections.push(`Technical: ${skills.technical.join(', ')}`);
    }
    
    if (skills.tools && skills.tools.length > 0) {
      skillSections.push(`Tools: ${skills.tools.join(', ')}`);
    }
    
    if (skills.soft && skills.soft.length > 0) {
      skillSections.push(`Soft Skills: ${skills.soft.join(', ')}`);
    }
    
    if (skills.languages && skills.languages.length > 0) {
      skillSections.push(`Languages: ${skills.languages.join(', ')}`);
    }
    
    return skillSections.join('\n');
  }

  /**
   * Format certifications
   */
  formatCertifications(certifications, format) {
    return certifications.map(cert => {
      let certText = cert.name;
      
      if (cert.issuer) {
        certText += ` - ${cert.issuer}`;
      }
      
      if (cert.year) {
        certText += ` (${cert.year})`;
      }
      
      return certText;
    }).join('\n');
  }

  /**
   * Generate HTML preview with template styling
   */
  generateHTMLPreview(resumeData, templateId = 'modern') {
    const template = this.getTemplate(templateId);
    const { format, styling } = template;
    
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${resumeData.contactInfo?.name || 'Resume'} - Resume</title>
  <style>
    body { 
      font-family: ${format.font}, Arial, sans-serif; 
      font-size: ${format.fontSize}pt; 
      line-height: ${format.lineHeight};
      margin: ${format.margins}in;
      color: #333;
      max-width: 8.5in;
    }
    .header { text-align: center; margin-bottom: 20px; }
    .name { font-size: 16pt; font-weight: bold; margin-bottom: 5px; }
    .contact { font-size: 9pt; margin-bottom: 10px; }
    .section-header { 
      font-weight: bold; 
      font-size: 12pt; 
      margin-top: ${format.sectionSpacing}px; 
      margin-bottom: 6px;
      ${templateId === 'executive' ? 'text-transform: uppercase; font-variant: small-caps;' : ''}
      ${templateId === 'creative' ? 'border-bottom: 2px solid #333; padding-bottom: 2px;' : ''}
      ${templateId === 'classic' ? 'text-decoration: underline;' : ''}
    }
    .job { margin-bottom: 12px; }
    .company { font-weight: bold; }
    .title { ${templateId === 'executive' ? 'font-style: italic; font-weight: bold;' : templateId === 'modern' ? 'font-style: italic;' : ''} }
    .date { float: right; font-style: italic; font-size: 9pt; }
    .bullets { margin: 6px 0 6px 20px; }
    .bullet { margin: 2px 0; }
    .skills-section { margin: 8px 0; }
    .skills-category { font-weight: bold; }
    .clear { clear: both; }
    @media print {
      body { margin: 0.5in; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="name">${resumeData.contactInfo?.name || 'YOUR NAME'}</div>
    <div class="contact">
      ${resumeData.contactInfo?.email || ''}${resumeData.contactInfo?.email && resumeData.contactInfo?.phone ? ' | ' : ''}${resumeData.contactInfo?.phone || ''}${(resumeData.contactInfo?.email || resumeData.contactInfo?.phone) && resumeData.contactInfo?.location ? ' | ' : ''}${resumeData.contactInfo?.location || ''}
    </div>
    ${resumeData.contactInfo?.linkedin ? `<div class="contact">${resumeData.contactInfo.linkedin}</div>` : ''}
    ${resumeData.contactInfo?.hyperlinks && resumeData.contactInfo.hyperlinks.length > 0 ? `<div class="contact">${resumeData.contactInfo.hyperlinks.join(' | ')}</div>` : ''}
  </div>
  
  ${resumeData.professionalSummary ? `
    <div class="section-header">PROFESSIONAL SUMMARY</div>
    <div>${resumeData.professionalSummary}</div>
  ` : ''}
  
  ${resumeData.coreSkills && resumeData.coreSkills.length > 0 ? `
    <div class="section-header">CORE SKILLS</div>
    <div>${resumeData.coreSkills.join(' • ')}</div>
  ` : ''}
  
  ${resumeData.workExperience && resumeData.workExperience.length > 0 ? `
    <div class="section-header">WORK EXPERIENCE</div>
    ${resumeData.workExperience.map(exp => `
      <div class="job">
        <div class="company">${exp.company}</div>
        <div class="title">${exp.position}</div>
        <div class="date">${exp.startDate || ''} - ${exp.endDate || 'Present'}</div>
        <div class="clear"></div>
        ${exp.bullets && exp.bullets.length > 0 ? `
          <div class="bullets">
            ${exp.bullets.map(bullet => `<div class="bullet">• ${bullet}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('')}
  ` : ''}
  
  ${resumeData.education && resumeData.education.length > 0 ? `
    <div class="section-header">EDUCATION</div>
    ${resumeData.education.map(edu => `
      <div>
        <div class="company">${edu.school}</div>
        <div>${edu.degree}${edu.field ? ` in ${edu.field}` : ''}</div>
        <div>${edu.year || ''}${edu.year && edu.gpa ? ' | ' : ''}${edu.gpa ? `GPA: ${edu.gpa}` : ''}</div>
      </div>
    `).join('')}
  ` : ''}
  
  ${resumeData.skills ? `
    <div class="section-header">TECHNICAL SKILLS</div>
    <div class="skills-section">
      ${resumeData.skills.technical && resumeData.skills.technical.length > 0 ? `
        <div><span class="skills-category">Technical:</span> ${resumeData.skills.technical.join(', ')}</div>
      ` : ''}
      ${resumeData.skills.tools && resumeData.skills.tools.length > 0 ? `
        <div><span class="skills-category">Tools:</span> ${resumeData.skills.tools.join(', ')}</div>
      ` : ''}
      ${resumeData.skills.soft && resumeData.skills.soft.length > 0 ? `
        <div><span class="skills-category">Soft Skills:</span> ${resumeData.skills.soft.join(', ')}</div>
      ` : ''}
      ${resumeData.skills.languages && resumeData.skills.languages.length > 0 ? `
        <div><span class="skills-category">Languages:</span> ${resumeData.skills.languages.join(', ')}</div>
      ` : ''}
    </div>
  ` : ''}
  
  ${resumeData.certifications && resumeData.certifications.length > 0 ? `
    <div class="section-header">CERTIFICATIONS</div>
    ${resumeData.certifications.map(cert => `
      <div>${cert.name}${cert.issuer ? ` - ${cert.issuer}` : ''}${cert.year ? ` (${cert.year})` : ''}</div>
    `).join('')}
  ` : ''}
</body>
</html>`;
    
    return html;
  }
}

export default new ResumeTemplateService();