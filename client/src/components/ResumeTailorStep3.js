import React from 'react';

function ResumeTailorStep3({
  formData,
  setFormData,
  onBack,
  onTailor,
  loading,
}) {
  const templates = [
    {
      id: 'modern',
      name: 'Modern',
      description: 'Clean and contemporary design',
    },
    {
      id: 'classic',
      name: 'Classic',
      description: 'Traditional and timeless',
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Simple and minimalist',
    },
    {
      id: 'technical',
      name: 'Technical',
      description: 'Optimized for engineers',
    },
  ];

  const llms = [
    { id: 'gpt4', name: 'GPT-4', description: 'Most advanced, best for complex tasks' },
    { id: 'claude', name: 'Claude', description: 'Balanced performance and safety' },
    { id: 'gemini', name: 'Gemini', description: 'Good performance, multimodal' },
    { id: 'mixtral', name: 'Mixtral', description: 'Open-source, cost-effective' },
    { id: 'llama2', name: 'Llama 2', description: 'Meta open-source model' },
  ];

  return (
    <div className="step-container">
      <h2>Step 3: Select Template & LLM</h2>

      <div className="form-group">
        <label className="form-label">Resume Template</label>
        <div className="template-grid">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`template-option ${
                formData.template === template.id ? 'active' : ''
              }`}
              onClick={() =>
                setFormData({ ...formData, template: template.id })
              }
            >
              <div className="template-name">{template.name}</div>
              <div className="template-description">{template.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">AI Model (with auto-fallback)</label>
        <div className="llm-grid">
          {llms.map((llm) => (
            <div
              key={llm.id}
              className={`llm-option ${
                formData.llmType === llm.id ? 'active' : ''
              }`}
              onClick={() =>
                setFormData({ ...formData, llmType: llm.id })
              }
            >
              <div className="llm-name">{llm.name}</div>
              <div className="llm-description">{llm.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="info-box">
        <p>
          ℹ️ <strong>Auto-Fallback:</strong> If your selected model is unavailable,
          we'll automatically fallback to another high-quality model.
        </p>
      </div>

      <div className="button-group">
        <button className="btn btn-outline" onClick={onBack}>
          ← Back
        </button>
        <button
          className="btn btn-primary"
          onClick={onTailor}
          disabled={loading}
        >
          {loading ? 'Tailoring Resume...' : 'Generate Tailored Resume →'}
        </button>
      </div>
    </div>
  );
}

export default ResumeTailorStep3;
