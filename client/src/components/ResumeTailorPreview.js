import React, { useState } from 'react';
import './ResumeTailorPreview.css';

function ResumeTailorPreview({ result, onDownload, onReset, loading }) {
  const [showJson, setShowJson] = useState(false);

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
          <span className="info-value capitalize">{result.template}</span>
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
          📄 Preview
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
          <pre>{result.tailoredContent}</pre>
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
