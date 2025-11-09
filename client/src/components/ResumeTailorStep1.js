import React, { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import './ResumeTailorStep.css';

function ResumeTailorStep1({ formData, setFormData, onNext }) {
  const { token } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const formDataObj = new FormData();
      formDataObj.append('resume', file);

      const response = await axios.post(
        'http://localhost:5000/api/resume/upload',
        formDataObj,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setFormData({
        ...formData,
        baseResume: response.data.resume.content,
        baseResumeName: response.data.resume.fileName,
      });
    } catch (err) {
      setError('Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const isValid = formData.baseResume.length > 0;

  return (
    <div className="step-container">
      <h2>Step 1: Upload Your Resume</h2>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group">
        <label className="form-label">Base Resume (Text or Paste)</label>
        <textarea
          className="form-textarea"
          placeholder="Paste your resume content here..."
          value={formData.baseResume}
          onChange={(e) =>
            setFormData({ ...formData, baseResume: e.target.value })
          }
          rows={10}
        />
      </div>

      <div className="divider">OR</div>

      <div className="form-group">
        <label className="form-label">Upload Resume File</label>
        <div className="file-upload">
          <input
            type="file"
            id="resume-file"
            accept=".txt,.pdf,.docx"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <label htmlFor="resume-file" className="file-label">
            {uploading ? 'Uploading...' : 'Choose file or drag & drop'}
          </label>
        </div>
        <p className="text-muted">
          Supported formats: TXT, PDF, DOCX (Max 10MB)
        </p>
      </div>

      {formData.baseResume && (
        <div className="preview-box">
          <h4>Preview</h4>
          <p>{formData.baseResume.substring(0, 300)}...</p>
        </div>
      )}

      <div className="button-group">
        <button
          className="btn btn-primary btn-full"
          onClick={onNext}
          disabled={!isValid}
        >
          Next: Enter Job Description →
        </button>
      </div>
    </div>
  );
}

export default ResumeTailorStep1;
