import React, { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import ResumeTailorStep1 from '../components/ResumeTailorStep1';
import ResumeTailorStep2 from '../components/ResumeTailorStep2';
import ResumeTailorStep3 from '../components/ResumeTailorStep3';
import ResumeTailorPreview from '../components/ResumeTailorPreview';
import './ResumeTailorPage.css';

function ResumeTailorPage() {
  const { token, user, updateTailorings } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    baseResume: '',
    baseResumeName: 'base_resume',
    jobDescription: '',
    jobTitle: '',
    template: 'modern',
    llmType: 'gpt4',
  });

  const [result, setResult] = useState(null);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
      setError('');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleTailor = async () => {
    if (
      !formData.baseResume ||
      !formData.jobDescription ||
      !formData.jobTitle
    ) {
      setError('Please fill in all required fields');
      return;
    }

    if (user.role !== 'admin' && user.tailoringsUsed >= user.tailoringsLimit) {
      setError(
        'You have reached your monthly tailoring limit. Upgrade your subscription.'
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        'http://localhost:5000/api/resume/tailor',
        {
          baseResume: formData.baseResume,
          baseResumeName: formData.baseResumeName,
          jobDescription: formData.jobDescription,
          jobTitle: formData.jobTitle,
          template: formData.template,
          llmType: formData.llmType,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setResult(response.data.resume);
      updateTailorings(
        response.data.tailoringsUsed,
        response.data.tailoringsRemaining
      );
      setStep(4);
      setSuccess('Resume tailored successfully!');
    } catch (err) {
      setError(
        err.response?.data?.error || 'Failed to tailor resume. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDocuments = async () => {
    if (!result?.id) return;

    setLoading(true);

    try {
      const response = await axios.post(
        `http://localhost:5000/api/resume/generate-documents/${result.id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Download files
      const pdfUrl = response.data.documents.pdf.url;
      const docxUrl = response.data.documents.docx.url;

      // Open download links
      window.open(`http://localhost:5000${pdfUrl}`, '_blank');
      window.open(`http://localhost:5000${docxUrl}`, '_blank');

      setSuccess('Documents generated and downloaded!');
    } catch (err) {
      setError('Failed to generate documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFormData({
      baseResume: '',
      baseResumeName: 'base_resume',
      jobDescription: '',
      jobTitle: '',
      template: 'modern',
      llmType: 'gpt4',
    });
    setResult(null);
    setError('');
    setSuccess('');
  };

  return (
    <div className="tailor-container">
      <div className="tailor-header">
        <h1>Tailor Your Resume</h1>
        <p>Step {step} of 4</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <div className="step-indicator">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`step ${s === step ? 'active' : ''} ${
              s < step ? 'completed' : ''
            }`}
          >
            {s < step ? '✓' : s}
          </div>
        ))}
      </div>

      <div className="step-content">
        {step === 1 && (
          <ResumeTailorStep1
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
          />
        )}

        {step === 2 && (
          <ResumeTailorStep2
            formData={formData}
            setFormData={setFormData}
            onBack={handleBack}
            onNext={handleNext}
          />
        )}

        {step === 3 && (
          <ResumeTailorStep3
            formData={formData}
            setFormData={setFormData}
            onBack={handleBack}
            onTailor={handleTailor}
            loading={loading}
          />
        )}

        {step === 4 && result && (
          <ResumeTailorPreview
            result={result}
            onDownload={handleGenerateDocuments}
            onReset={handleReset}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}

export default ResumeTailorPage;
