import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import './ResumeTailorPreview.css';

function ResumeTailorPreview({ result, onDownload, onReset, loading }) {
  const { token } = useAuthStore();
  const [showJson, setShowJson] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(result.template || 'modern');
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Fetch templates and generate preview on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!token) return;
      
      try {
        const response = await axios.get('http://localhost:5000/api/resume/templates', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setAvailableTemplates(response.data.templates);
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      }
    };

    fetchTemplates();
  }, [token]);

  // Generate HTML preview when template changes
  useEffect(() => {
    const generatePreview = async () => {
      if (!result?.id || !token) return;
      
      setPreviewLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:5000/api/resume/preview/${result.id}?template=${selectedTemplate}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        setPreviewHtml(response.data);
      } catch (error) {
        console.error('Failed to generate preview:', error);
        setPreviewHtml('<p>Failed to generate preview</p>');
      } finally {
        setPreviewLoading(false);
      }
    };

    generatePreview();
  }, [result?.id, selectedTemplate, token]);

  return (
    <div className="preview-container">
      <h2>Your Tailored Resume</h2>

      <div className="preview-info">
        <div className="info-item">
          <span className="info-label">Job Title:</span>
          <span className="info-value">{result.jobTitle}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Template:</span>
          <select 
            className="template-selector"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
          >
            {availableTemplates && availableTemplates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
        <div className="info-item">
          <span className="info-label">LLM Used:</span>
          <span className="info-value">{result.llmUsed}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Match Score:</span>
          <span className="info-value">
            <span className="match-score">{result.matchScore}%</span>
          </span>
        </div>
      </div>

      <div className="preview-tabs">
        <button
          className={`tab-button ${!showJson ? 'active' : ''}`}
          onClick={() => setShowJson(false)}
        >
          📄 Template Preview
        </button>
        <button
          className={`tab-button ${showJson ? 'active' : ''}`}
          onClick={() => setShowJson(true)}
        >
          📊 JSON Structure
        </button>
      </div>

      {!showJson ? (
        <div className="resume-preview">
          {previewLoading ? (
            <div className="loading-preview">Generating preview...</div>
          ) : (
            <iframe 
              srcDoc={previewHtml}
              className="preview-iframe"
              title="Resume Preview"
            />
          )}
        </div>
      ) : (
        <div className="resume-json">
          <pre>{JSON.stringify(result.tailoredJson, null, 2)}</pre>
        </div>
      )}

      {result.summary && (
        <div className="summary-box">
          <h4>📋 Changes Summary</h4>
          {result.summary.major_changes &&
            result.summary.major_changes.length > 0 && (
              <div className="summary-section">
                <strong>Major Changes:</strong>
                <ul>
                  {result.summary.major_changes.map((change, i) => (
                    <li key={i}>{change}</li>
                  ))}
                </ul>
              </div>
            )}

          {result.summary.keywords_added &&
            result.summary.keywords_added.length > 0 && (
              <div className="summary-section">
                <strong>Keywords Added:</strong>
                <div className="keywords-list">
                  {result.summary.keywords_added.map((keyword, i) => (
                    <span key={i} className="keyword-badge">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {result.summary.maintained_truth && (
            <div className="summary-section">
              <span className="badge-success">✓ Truth Maintained</span>
            </div>
          )}
        </div>
      )}

      <div className="button-group">
        <button
          className="btn btn-secondary"
          onClick={onDownload}
          disabled={loading}
        >
          {loading ? 'Generating Files...' : '⬇️ Download (Word & PDF)'}
        </button>
        <button className="btn btn-outline" onClick={onReset}>
          ← Start Over
        </button>
      </div>
    </div>
  );
}

export default ResumeTailorPreview;
