import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import './DashboardPage.css';

function DashboardPage() {
  const { user } = useAuthStore();

  const getLimitColor = () => {
    if (!user) return 'text-muted';
    if (user.role === 'admin') return 'text-muted';
    const usage = user.tailoringsUsed / user.tailoringsLimit;
    if (usage >= 1) return 'danger';
    if (usage >= 0.8) return 'warning';
    return 'success';
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.firstName}! 👋</h1>
        <p>Start tailoring your resume to match any job description</p>
      </div>

      <div className="grid grid-2">
        {/* Quick Stats */}
        <div className="card">
          <h2>Your Subscription</h2>
          <div className="stat">
            <span className="stat-label">Plan:</span>
            <span className="stat-value capitalize">{user?.subscription}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Tailorings Used:</span>
            <span className={`stat-value ${getLimitColor()}`}>
              {user?.tailoringsUsed} / {user?.tailoringsLimit}
            </span>
          </div>
          {user?.role !== 'admin' && user?.tailoringsUsed >= user?.tailoringsLimit && (
            <div className="alert alert-warning mt-2">
              You've reached your monthly limit. Upgrade to continue!
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="card cta-card">
          <h2>Ready to Tailor?</h2>
          <p>Upload your resume and enter a job description to get started</p>
          <Link to="/tailor" className="btn btn-primary btn-full mt-2">
            Start Tailoring →
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="features-section">
        <h2>How It Works</h2>
        <div className="grid grid-3">
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>Upload Resume</h3>
            <p>Share your base resume or career history</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Enter Job Description</h3>
            <p>Paste or link the job posting you're targeting</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✨</div>
            <h3>Get Tailored Resume</h3>
            <p>AI-powered resume optimized for ATS and keywords</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧪</div>
            <h3>Choose LLM</h3>
            <p>Select your preferred AI model (GPT-4, Claude, Gemini)</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>Select Template</h3>
            <p>Pick from modern, classic, minimal, or technical formats</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⬇️</div>
            <h3>Download</h3>
            <p>Export as Word (.docx) or PDF instantly</p>
          </div>
        </div>
      </div>

      {/* Features Highlight */}
      <div className="features-highlight">
        <h2>Why AI Resume Tailor?</h2>
        <div className="highlight-grid">
          <div className="highlight-item">
            <span className="highlight-icon">✓</span>
            <h4>ATS-Optimized</h4>
            <p>All resumes are optimized for Applicant Tracking Systems</p>
          </div>
          <div className="highlight-item">
            <span className="highlight-icon">✓</span>
            <h4>Honest & Truthful</h4>
            <p>We never fabricate experience - only enhance what's real</p>
          </div>
          <div className="highlight-item">
            <span className="highlight-icon">✓</span>
            <h4>Multi-LLM Support</h4>
            <p>Choose from GPT-4, Claude, Gemini, and more with auto-fallback</p>
          </div>
          <div className="highlight-item">
            <span className="highlight-icon">✓</span>
            <h4>Keyword Matching</h4>
            <p>Extract and naturally incorporate job-specific keywords</p>
          </div>
          <div className="highlight-item">
            <span className="highlight-icon">✓</span>
            <h4>Multiple Formats</h4>
            <p>Download in Word, PDF, or view as HTML</p>
          </div>
          <div className="highlight-item">
            <span className="highlight-icon">✓</span>
            <h4>Version Control</h4>
            <p>Track all resume versions and tailoring history</p>
          </div>
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="card admin-banner">
          <h3>🔧 Admin Panel</h3>
          <p>You have access to admin controls</p>
          <Link to="/admin" className="btn btn-primary">
            Go to Admin Panel
          </Link>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
