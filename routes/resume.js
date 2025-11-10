import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { authenticateToken, checkTailoringLimit } from '../middleware/auth.js';
import Resume from '../models/Resume.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import resumeTailorService from '../services/resumeTailorService.js';
import documentService from '../services/documentService.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve('uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

/**
 * Upload base resume (with improved PDF parsing)
 */
router.post('/upload', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let content = '';
    let structuredData = null;
    let parseSuccess = true;

    // Handle different file types
    if (req.file.mimetype === 'application/pdf') {
      // Use advanced PDF parsing
      const parseResult = await resumeTailorService.parseResumeFromPDF(req.file.path);
      if (parseResult.success) {
        content = parseResult.text;
        structuredData = parseResult.data;
      } else {
        parseSuccess = false;
        // Fallback to basic text extraction
        try {
          content = fs.readFileSync(req.file.path, 'utf-8');
        } catch (pdfError) {
          return res.status(400).json({ 
            error: 'Failed to parse PDF file. Please ensure it\'s a valid resume PDF.',
            details: parseResult.error 
          });
        }
      }
    } else if (req.file.mimetype === 'text/plain') {
      content = fs.readFileSync(req.file.path, 'utf-8');
    } else {
      // For DOCX files, we'll need a different approach
      return res.status(400).json({ 
        error: 'DOCX parsing not yet supported. Please upload a PDF or text file.' 
      });
    }

    // Log the upload
    await AuditLog.create({
      userId: req.user.id,
      action: 'resume_upload',
      details: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        parseSuccess,
        structuredDataAvailable: !!structuredData
      },
      success: true,
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      message: 'Resume uploaded successfully',
      resume: {
        fileName: req.file.originalname,
        content,
        structuredData,
        fileType: req.file.mimetype,
        parseSuccess,
        uploadedAt: new Date(),
      },
    });
  } catch (error) {
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * Scrape job description from URL
 */
router.post('/scrape-job-url', authenticateToken, async (req, res) => {
  try {
    const { jobUrl } = req.body;

    if (!jobUrl) {
      return res.status(400).json({
        error: 'Job URL is required',
      });
    }

    // Validate URL format
    try {
      new URL(jobUrl);
    } catch (urlError) {
      return res.status(400).json({
        error: 'Invalid URL format. Please provide a valid job posting URL.',
      });
    }

    const scrapeResult = await resumeTailorService.scrapeJobFromUrl(jobUrl);

    if (!scrapeResult.success) {
      return res.status(400).json({
        error: scrapeResult.error,
        suggestion: 'Please use LinkedIn, Indeed, or direct company career page URLs'
      });
    }

    // Log the scraping
    await AuditLog.create({
      userId: req.user.id,
      action: 'job_scrape',
      details: {
        jobUrl,
        jobTitle: scrapeResult.data.title,
        company: scrapeResult.data.company,
        success: true
      },
      success: true,
    });

    res.json({
      message: 'Job description scraped successfully',
      jobData: scrapeResult.data,
      jobDescription: scrapeResult.description,
      source: 'url_scrape'
    });
  } catch (error) {
    // Log failed scraping
    await AuditLog.create({
      userId: req.user.id,
      action: 'job_scrape',
      details: {
        jobUrl: req.body.jobUrl,
        success: false,
        error: error.message
      },
      success: false,
    });

    res.status(500).json({ 
      error: 'Failed to scrape job description',
      details: error.message,
      suggestion: 'Please copy and paste the job description manually if scraping fails'
    });
  }
});

/**
 * Extract job keywords from job description
 */
router.post('/extract-job-keywords', authenticateToken, async (req, res) => {
  try {
    const { jobDescription, llmType = 'gpt4' } = req.body;

    if (!jobDescription) {
      return res.status(400).json({
        error: 'Job description is required',
      });
    }

    const keywords = await resumeTailorService.extractJobKeywords(
      jobDescription,
      llmType
    );

    res.json({
      keywords,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Analyze resume gaps
 */
router.post('/analyze-gaps', authenticateToken, async (req, res) => {
  try {
    const { baseResume, jobDescription, llmType = 'gpt4' } = req.body;

    if (!baseResume || !jobDescription) {
      return res.status(400).json({
        error: 'Base resume and job description are required',
      });
    }

    const analysis = await resumeTailorService.analyzeResumeGaps(
      baseResume,
      jobDescription,
      llmType
    );

    res.json({
      analysis,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate tailored resume
 */
router.post('/tailor', authenticateToken, checkTailoringLimit, async (req, res) => {
  try {
    const {
      baseResume,
      baseResumeName,
      jobDescription,
      jobTitle,
      template = 'modern',
      llmType = 'gpt4',
    } = req.body;

    if (!baseResume || !jobDescription || !jobTitle) {
      return res.status(400).json({
        error: 'Base resume, job description, and job title are required',
      });
    }

    // Extract job keywords
    const jobKeywords = await resumeTailorService.extractJobKeywords(
      jobDescription,
      llmType
    );

    // Generate tailored resume
    const tailoredResult = await resumeTailorService.generateTailoredResume(
      baseResume,
      jobDescription,
      jobKeywords,
      template,
      llmType
    );

    // Parse to JSON structure
    const resumeJson = await resumeTailorService.parseResumeToJson(
      tailoredResult.content
    );

    // Generate change summary
    const changeSummary = await resumeTailorService.generateChangeSummary(
      baseResume,
      tailoredResult.content,
      llmType
    );

    // Create resume record
    const resume = new Resume({
      userId: req.user.id,
      baseResumeName: baseResumeName || 'base_resume',
      baseResumeContent: baseResume,
      jobDescription,
      jobTitle,
      template,
      selectedLLM: tailoredResult.modelUsed,
      llmModel: llmType,
      tailoredResumeContent: tailoredResult.content,
      tailoredResumeJson: resumeJson,
      summary: changeSummary,
      extractedJobKeywords: jobKeywords.keywords?.technical_terms || [],
      matchScore: changeSummary.overall_improvements?.ats_optimization_score || changeSummary.alignment_score?.overall || 0,
      promptVariant: tailoredResult.modelUsed,
      status: 'completed',
    });

    await resume.save();

    // Update user tailoring count
    const user = await User.findById(req.user.id);
    user.tailoringsUsed += 1;
    await user.save();

    // Log the action
    await AuditLog.create({
      userId: req.user.id,
      action: 'resume_tailor',
      resumeId: resume._id,
      details: {
        jobTitle,
        template,
        llmUsed: tailoredResult.modelUsed,
        fallbackUsed: tailoredResult.fallbackUsed,
      },
      success: true,
    });

    res.json({
      message: 'Resume tailored successfully',
      resume: {
        id: resume._id,
        jobTitle: resume.jobTitle,
        template: resume.template,
        llmUsed: resume.selectedLLM,
        tailoredContent: resume.tailoredResumeContent,
        tailoredJson: resume.tailoredResumeJson,
        summary: resume.summary,
        matchScore: resume.matchScore,
      },
      tailoringsUsed: user.tailoringsUsed,
      tailoringsRemaining: user.tailoringsLimit - user.tailoringsUsed,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate PDF and DOCX downloads
 */
router.post('/generate-documents/:resumeId', authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.resumeId);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    if (resume.userId.toString() !== req.user.id) {
      return res.status(403).json({
        error: 'Not authorized to access this resume',
      });
    }

    const baseFileName = `resume_${resume._id}_${Date.now()}`;

    // Generate PDF
    const pdfResult = await documentService.generatePDF(
      resume.tailoredResumeContent,
      baseFileName
    );

    // Generate DOCX
    const docxResult = await documentService.generateDOCX(
      resume.tailoredResumeContent,
      baseFileName
    );

    // Update resume with document URLs
    resume.pdfUrl = pdfResult.url;
    resume.wordDocUrl = docxResult.url;
    await resume.save();

    // Log download
    await AuditLog.create({
      userId: req.user.id,
      action: 'resume_download',
      resumeId: resume._id,
      success: true,
    });

    res.json({
      message: 'Documents generated successfully',
      documents: {
        pdf: pdfResult,
        docx: docxResult,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get resume history
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id })
      .select('-baseResumeContent -tailoredResumeContent')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      resumes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get resume details
 */
router.get('/:resumeId', authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.resumeId);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    if (resume.userId.toString() !== req.user.id) {
      return res.status(403).json({
        error: 'Not authorized to access this resume',
      });
    }

    res.json({
      resume,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete resume
 */
router.delete('/:resumeId', authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.resumeId);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    if (resume.userId.toString() !== req.user.id) {
      return res.status(403).json({
        error: 'Not authorized to delete this resume',
      });
    }

    await Resume.findByIdAndDelete(req.params.resumeId);

    res.json({
      message: 'Resume deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
