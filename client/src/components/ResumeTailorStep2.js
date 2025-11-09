import React from 'react';

function ResumeTailorStep2({ formData, setFormData, onBack, onNext }) {
  const handleJobTitleChange = (e) => {
    setFormData({ ...formData, jobTitle: e.target.value });
  };

  const handleJobDescriptionChange = (e) => {
    setFormData({ ...formData, jobDescription: e.target.value });
  };

  const isValid = formData.jobTitle && formData.jobDescription;

  return (
    <div className="step-container">
      <h2>Step 2: Enter Job Description</h2>

      <div className="form-group">
        <label className="form-label">Target Job Title *</label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g., Senior AI/ML Engineer, Full Stack Developer"
          value={formData.jobTitle}
          onChange={handleJobTitleChange}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Job Description *</label>
        <textarea
          className="form-textarea"
          placeholder="Paste the full job description here..."
          value={formData.jobDescription}
          onChange={handleJobDescriptionChange}
          rows={12}
        />
      </div>

      <div className="job-description-tips">
        <h4>💡 Pro Tips:</h4>
        <ul>
          <li>Include the full job posting for best results</li>
          <li>Include responsibilities, requirements, and nice-to-haves</li>
          <li>The more detail provided, the better the tailoring</li>
        </ul>
      </div>

      <div className="button-group">
        <button className="btn btn-outline" onClick={onBack}>
          ← Back
        </button>
        <button
          className="btn btn-primary"
          onClick={onNext}
          disabled={!isValid}
        >
          Next: Select Template & LLM →
        </button>
      </div>
    </div>
  );
}

export default ResumeTailorStep2;
