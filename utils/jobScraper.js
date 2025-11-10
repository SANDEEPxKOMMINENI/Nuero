import axios from 'axios';
import * as cheerio from 'cheerio';

class JobScraper {
  constructor() {
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
    ];
  }

  /**
   * Scrape job description from URL
   */
  async scrapeJobFromUrl(url) {
    try {
      // Determine the job platform and use appropriate scraper
      if (url.includes('linkedin.com')) {
        return await this.scrapeLinkedInJob(url);
      } else if (url.includes('indeed.com')) {
        return await this.scrapeIndeedJob(url);
      } else {
        return await this.scrapeGenericJob(url);
      }
    } catch (error) {
      throw new Error(`Failed to scrape job from URL: ${error.message}`);
    }
  }

  /**
   * Scrape LinkedIn job posting
   */
  async scrapeLinkedInJob(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgents[0],
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      const jobData = {
        title: this.cleanText($('.top-card-layout__title').text() || 
                              $('h1').first().text()),
        company: this.cleanText($('.topcard__org-name-link').text() || 
                               $('[data-test-id="company-name"]').text()),
        location: this.cleanText($('.topcard__flavor-row').text() || 
                                $('[data-test-id="job-location"]').text()),
        description: this.cleanText($('.description__text').html() || 
                                  $('.show-more-less-html__markup').html() ||
                                  $('[data-test-id="job-description"]').html()),
        requirements: [],
        responsibilities: [],
        skills: [],
        qualifications: [],
        salary: '',
        employmentType: '',
        postedDate: ''
      };

      // Parse requirements and responsibilities from description
      const descriptionText = jobData.description;
      if (descriptionText) {
        jobData.requirements = this.extractRequirements(descriptionText);
        jobData.responsibilities = this.extractResponsibilities(descriptionText);
        jobData.skills = this.extractSkills(descriptionText);
        jobData.qualifications = this.extractQualifications(descriptionText);
      }

      // Extract additional metadata
      jobData.salary = this.cleanText($('.salary-compensation-container__text').text());
      jobData.employmentType = this.cleanText($('.job-criteria__text').first().text());
      jobData.postedDate = this.cleanText($('.posted-time-ago__text').text());

      return jobData;
    } catch (error) {
      console.error('LinkedIn scraping error:', error.message);
      throw error;
    }
  }

  /**
   * Scrape Indeed job posting
   */
  async scrapeIndeedJob(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgents[1],
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      const jobData = {
        title: this.cleanText($('.jobsearch-JobInfoHeader-title').text() || 
                              $('h1').first().text()),
        company: this.cleanText($('.jobsearch-InlineCompanyRating').text() || 
                               $('[data-testid="inlineHeader-companyName"]').text()),
        location: this.cleanText($('.jobsearch-JobInfoHeader-companyLocation').text() || 
                                $('[data-testid="job-location"]').text()),
        description: this.cleanText($('#jobDescriptionText').html() || 
                                  $('.jobsearch-jobDescriptionText').html() ||
                                  $('[data-testid="jobsearch-JobComponent-description"]').html()),
        requirements: [],
        responsibilities: [],
        skills: [],
        qualifications: [],
        salary: '',
        employmentType: '',
        postedDate: ''
      };

      // Parse requirements and responsibilities from description
      const descriptionText = jobData.description;
      if (descriptionText) {
        jobData.requirements = this.extractRequirements(descriptionText);
        jobData.responsibilities = this.extractResponsibilities(descriptionText);
        jobData.skills = this.extractSkills(descriptionText);
        jobData.qualifications = this.extractQualifications(descriptionText);
      }

      // Extract additional metadata
      jobData.salary = this.cleanText($('.salary-snippet-container').text());
      jobData.employmentType = this.cleanText($('.jobsearch-JobMetadataHeader-item').first().text());
      jobData.postedDate = this.cleanText($('.jobsearch-JobMetadataFooter-item').first().text());

      return jobData;
    } catch (error) {
      console.error('Indeed scraping error:', error.message);
      throw error;
    }
  }

  /**
   * Scrape generic job posting (company career pages, etc.)
   */
  async scrapeGenericJob(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgents[2],
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Try multiple selectors for job title
      const titleSelectors = [
        'h1', '.job-title', '.position-title', '[class*="title"]',
        '.job-header h1', '.position h1', '.posting-headline h1'
      ];
      
      let title = '';
      for (const selector of titleSelectors) {
        title = this.cleanText($(selector).first().text());
        if (title && title.length > 5) break;
      }

      // Try multiple selectors for company
      const companySelectors = [
        '.company-name', '.employer', '.organization', '[class*="company"]',
        '.job-company', '.posting-company', '.company'
      ];
      
      let company = '';
      for (const selector of companySelectors) {
        company = this.cleanText($(selector).first().text());
        if (company && company.length > 2) break;
      }

      // Try multiple selectors for location
      const locationSelectors = [
        '.location', '.job-location', '.position-location', '[class*="location"]',
        '.job-location-text', '.posting-location'
      ];
      
      let location = '';
      for (const selector of locationSelectors) {
        location = this.cleanText($(selector).first().text());
        if (location && location.length > 3) break;
      }

      // Try multiple selectors for description
      const descriptionSelectors = [
        '.job-description', '.description', '.posting-description', '[class*="description"]',
        '.job-details', '.position-details', '.requirements-section',
        '.job-content', '.posting-body', '.job-main-content'
      ];
      
      let description = '';
      for (const selector of descriptionSelectors) {
        description = this.cleanText($(selector).html());
        if (description && description.length > 100) break;
      }

      const jobData = {
        title: title || this.extractTitleFromUrl(url),
        company: company || this.extractCompanyFromUrl(url),
        location: location,
        description: description,
        requirements: [],
        responsibilities: [],
        skills: [],
        qualifications: [],
        salary: '',
        employmentType: '',
        postedDate: ''
      };

      // Parse requirements and responsibilities from description
      const descriptionText = jobData.description;
      if (descriptionText) {
        jobData.requirements = this.extractRequirements(descriptionText);
        jobData.responsibilities = this.extractResponsibilities(descriptionText);
        jobData.skills = this.extractSkills(descriptionText);
        jobData.qualifications = this.extractQualifications(descriptionText);
      }

      return jobData;
    } catch (error) {
      console.error('Generic scraping error:', error.message);
      throw error;
    }
  }

  /**
   * Extract requirements from job description
   */
  extractRequirements(description) {
    const requirements = [];
    const $ = cheerio.load(description);
    
    // Look for requirement keywords
    const requirementKeywords = ['requirement', 'require', 'must have', 'needed', 'qualifications'];
    
    $('li, p').each((i, elem) => {
      const text = this.cleanText($(elem).text());
      if (requirementKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
        requirements.push(text);
      }
    });

    // If no specific requirements found, extract bullet points that might be requirements
    if (requirements.length === 0) {
      $('li').each((i, elem) => {
        const text = this.cleanText($(elem).text());
        if (text.length > 10 && text.length < 200) {
          requirements.push(text);
        }
      });
    }

    return requirements.slice(0, 10); // Limit to 10 requirements
  }

  /**
   * Extract responsibilities from job description
   */
  extractResponsibilities(description) {
    const responsibilities = [];
    const $ = cheerio.load(description);
    
    // Look for responsibility keywords
    const responsibilityKeywords = ['responsibility', 'responsible', 'you will', 'duties', 'role'];
    
    $('li, p').each((i, elem) => {
      const text = this.cleanText($(elem).text());
      if (responsibilityKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
        responsibilities.push(text);
      }
    });

    // If no specific responsibilities found, extract bullet points
    if (responsibilities.length === 0) {
      $('li').each((i, elem) => {
        const text = this.cleanText($(elem).text());
        if (text.length > 10 && text.length < 200) {
          responsibilities.push(text);
        }
      });
    }

    return responsibilities.slice(0, 10); // Limit to 10 responsibilities
  }

  /**
   * Extract skills from job description
   */
  extractSkills(description) {
    const skills = [];
    const $ = cheerio.load(description);
    const text = this.cleanText($('body').text()).toLowerCase();
    
    // Common technical skills
    const technicalSkills = [
      'javascript', 'python', 'java', 'react', 'node', 'angular', 'vue', 'docker',
      'aws', 'azure', 'gcp', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql',
      'git', 'html', 'css', 'typescript', 'nodejs', 'express', 'django', 'flask',
      'kubernetes', 'terraform', 'ci/cd', 'devops', 'linux', 'ubuntu', 'api',
      'rest', 'graphql', 'microservices', 'machine learning', 'ai', 'data science',
      'excel', 'powerpoint', 'word', 'salesforce', 'tableau', 'power bi'
    ];

    // Extract skills from text
    for (const skill of technicalSkills) {
      if (text.includes(skill)) {
        skills.push(skill);
      }
    }

    // Also look for explicit skills sections
    $('li, p').each((i, elem) => {
      const elemText = this.cleanText($(elem).text()).toLowerCase();
      if (elemText.includes('skill') || elemText.includes('experience with')) {
        // Extract individual skills from the sentence
        for (const skill of technicalSkills) {
          if (elemText.includes(skill) && !skills.includes(skill)) {
            skills.push(skill);
          }
        }
      }
    });

    return skills.slice(0, 20); // Limit to 20 skills
  }

  /**
   * Extract qualifications from job description
   */
  extractQualifications(description) {
    const qualifications = [];
    const $ = cheerio.load(description);
    
    // Look for qualification keywords
    const qualificationKeywords = [
      'qualification', 'degree', 'bachelor', 'master', 'phd', 'experience',
      'years of experience', 'background', 'education'
    ];
    
    $('li, p').each((i, elem) => {
      const text = this.cleanText($(elem).text());
      if (qualificationKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
        qualifications.push(text);
      }
    });

    return qualifications.slice(0, 8); // Limit to 8 qualifications
  }

  /**
   * Clean text by removing extra whitespace and HTML entities
   */
  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  /**
   * Extract job title from URL as fallback
   */
  extractTitleFromUrl(url) {
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    return lastPart.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Extract company name from URL as fallback
   */
  extractCompanyFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '').split('.')[0];
    } catch (error) {
      return '';
    }
  }

  /**
   * Validate if URL is a job posting
   */
  isValidJobUrl(url) {
    try {
      const urlObj = new URL(url);
      const jobUrlPatterns = [
        /linkedin\.com\/jobs\//,
        /indeed\.com\/jobs\//,
        /jobs\./,
        /careers\./,
        /job/i,
        /career/i,
        /position/i
      ];
      
      return jobUrlPatterns.some(pattern => pattern.test(url));
    } catch (error) {
      return false;
    }
  }
}

export default new JobScraper();