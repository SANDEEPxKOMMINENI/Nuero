import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

class DocumentService {
  constructor() {
    this.uploadsDir = path.resolve('uploads');
    this.generatedDir = path.resolve('generated_resumes');
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
    if (!fs.existsSync(this.generatedDir)) {
      fs.mkdirSync(this.generatedDir, { recursive: true });
    }
  }

  /**
   * Generate PDF from resume text
   */
  async generatePDF(resumeText, fileName) {
    return new Promise((resolve, reject) => {
      try {
        const filePath = path.join(
          this.generatedDir,
          `${fileName}.pdf`
        );
        const doc = new PDFDocument({
          size: 'Letter',
          margin: 36,
          bufferPages: true,
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Parse resume text and format for PDF
        const lines = resumeText.split('\n');
        let currentY = 36;
        const pageHeight = 792;
        const footerDistance = 50;

        for (const line of lines) {
          if (currentY > pageHeight - footerDistance) {
            doc.addPage();
            currentY = 36;
          }

          const trimmedLine = line.trim();
          if (!trimmedLine) {
            currentY += 5;
            continue;
          }

          if (trimmedLine.match(/^\[.*\]$/)) {
            // Section header
            doc
              .fontSize(12)
              .font('Helvetica-Bold')
              .text(trimmedLine.replace(/\[|\]/g, ''), {
                width: 522,
              });
            currentY += 15;
          } else if (trimmedLine.match(/^[A-Z]/)) {
            // Likely a job title or company name
            doc
              .fontSize(11)
              .font('Helvetica-Bold')
              .text(trimmedLine, {
                width: 522,
              });
            currentY += 12;
          } else {
            // Regular text
            doc
              .fontSize(10)
              .font('Helvetica')
              .text(trimmedLine, {
                width: 522,
              });
            currentY += 10;
          }
        }

        doc.end();

        stream.on('finish', () => {
          resolve({
            filePath,
            fileName: `${fileName}.pdf`,
            url: `/downloads/${fileName}.pdf`,
          });
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate DOCX from resume text
   * Using a simple template-based approach
   */
  async generateDOCX(resumeText, fileName) {
    return new Promise((resolve, reject) => {
      try {
        // This is a simplified DOCX generation
        // For production, consider using 'docx' npm package
        const filePath = path.join(
          this.generatedDir,
          `${fileName}.docx`
        );

        // Convert to DOCX XML (simplified)
        const docxContent = this.generateDocxXml(resumeText);

        fs.writeFileSync(filePath, docxContent);

        resolve({
          filePath,
          fileName: `${fileName}.docx`,
          url: `/downloads/${fileName}.docx`,
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate basic DOCX XML structure
   */
  generateDocxXml(text) {
    // This is a very simplified version
    // For production, use proper DOCX library
    const lines = text.split('\n');
    let paragraphs = '';

    for (const line of lines) {
      if (!line.trim()) {
        paragraphs += '<w:p/>';
        continue;
      }

      const isBold = line.match(/^\[.*\]$/) || line.match(/^[A-Z]/);
      const content = line.replace(/\[|\]/g, '');

      paragraphs += `<w:p>
        <w:pPr>${isBold ? '<w:b/>' : ''}</w:pPr>
        <w:r>
          <w:rPr>${isBold ? '<w:b/>' : ''}</w:rPr>
          <w:t>${this.escapeXml(content)}</w:t>
        </w:r>
      </w:p>`;
    }

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs}
  </w:body>
</w:document>`;
  }

  escapeXml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Generate HTML for preview
   */
  generateHTML(resumeJson) {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Calibri, Arial, sans-serif; margin: 20px; line-height: 1.4; }
    h1 { margin: 0; font-size: 18px; text-align: center; }
    h2 { margin-top: 12px; margin-bottom: 4px; font-size: 12px; border-bottom: 1px solid #000; }
    .contact-info { text-align: center; font-size: 9px; margin-bottom: 10px; }
    .section { margin: 8px 0; }
    .job-title { font-weight: bold; }
    .company { font-weight: bold; }
    ul { margin: 4px 0; padding-left: 20px; }
    li { margin: 2px 0; }
  </style>
</head>
<body>
  <h1>${resumeJson.contactInfo?.name || 'Your Name'}</h1>
  <div class="contact-info">
    ${resumeJson.contactInfo?.email ? resumeJson.contactInfo.email + ' | ' : ''}
    ${resumeJson.contactInfo?.phone ? resumeJson.contactInfo.phone + ' | ' : ''}
    ${resumeJson.contactInfo?.location || ''}
  </div>
  
  ${resumeJson.headline ? `<p><strong>${resumeJson.headline}</strong></p>` : ''}
  
  ${resumeJson.professionalSummary ? `
    <h2>PROFESSIONAL SUMMARY</h2>
    <p>${resumeJson.professionalSummary}</p>
  ` : ''}
  
  ${
    resumeJson.coreSkills && resumeJson.coreSkills.length > 0
      ? `
    <h2>CORE SKILLS</h2>
    <p>${resumeJson.coreSkills.join(' • ')}</p>
  `
      : ''
  }
  
  ${
    resumeJson.workExperience && resumeJson.workExperience.length > 0
      ? `
    <h2>WORK EXPERIENCE</h2>
    ${resumeJson.workExperience
      .map(
        (exp) => `
      <div class="section">
        <div class="company">${exp.company}</div>
        <div class="job-title">${exp.position}</div>
        <div>${exp.startDate} - ${exp.endDate}</div>
        <ul>
          ${exp.bullets.map((bullet) => `<li>${bullet}</li>`).join('')}
        </ul>
      </div>
    `
      )
      .join('')}
  `
      : ''
  }
  
  ${
    resumeJson.education && resumeJson.education.length > 0
      ? `
    <h2>EDUCATION</h2>
    ${resumeJson.education
      .map(
        (edu) => `
      <div class="section">
        <div class="company">${edu.school}</div>
        <div>${edu.degree} in ${edu.field}</div>
        <div>${edu.year}</div>
      </div>
    `
      )
      .join('')}
  `
      : ''
  }
</body>
</html>`;
  }

  /**
   * Cleanup old generated files
   */
  cleanupOldFiles(maxAgeHours = 24) {
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;

    try {
      const files = fs.readdirSync(this.generatedDir);
      files.forEach((file) => {
        const filePath = path.join(this.generatedDir, file);
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
        }
      });
    } catch (error) {
      console.error('Error cleaning up old files:', error);
    }
  }
}

export default new DocumentService();
