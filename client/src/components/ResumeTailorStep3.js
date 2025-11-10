import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

function ResumeTailorStep3({
  formData,
  setFormData,
  onBack,
  onTailor,
  loading,
}) {
  const { token } = useAuthStore();
  const [availableModels, setAvailableModels] = useState(null);
  const [availableTemplates, setAvailableTemplates] = useState(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState('');

  // Fetch available models and templates on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      
      setModelsLoading(true);
      setModelsError('');
      
      try {
        // Fetch models
        const modelsResponse = await axios.get('http://localhost:5000/api/resume/models', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Fetch templates
        const templatesResponse = await axios.get('http://localhost:5000/api/resume/templates', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setAvailableModels(modelsResponse.data.models);
        setAvailableTemplates(templatesResponse.data.templates);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setModelsError('Failed to load available models and templates');
      } finally {
        setModelsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Get available templates from API or use fallback
  const getAvailableTemplates = () => {
    if (availableTemplates) {
      return availableTemplates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description
      }));
    }
    
    // Fallback templates
    return [
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
  };

  const templates = getAvailableTemplates();

  // Fallback LLMs if API call fails
  const fallbackLLMs = [
    { id: 'gpt4', name: 'GPT-4', description: 'Most advanced, best for complex tasks' },
    { id: 'claude', name: 'Claude', description: 'Balanced performance and safety' },
    { id: 'gemini', name: 'Gemini', description: 'Good performance, multimodal' },
    { id: 'mixtral', name: 'Mixtral', description: 'Open-source, cost-effective' },
    { id: 'llama2', name: 'Llama 2', description: 'Meta open-source model' },
  ];

  // Get available LLMs from API or use fallback
  const getAvailableLLMs = () => {
    if (availableModels) {
      // Flatten all models from all providers
      const allModels = [];
      Object.entries(availableModels).forEach(([provider, models]) => {
        models.forEach(model => {
          allModels.push({
            id: model.id,
            name: model.name,
            description: `${model.provider} - ${model.name}`,
            provider: model.provider
          });
        });
      });
      return allModels;
    }
    return fallbackLLMs;
  };

  const llms = getAvailableLLMs();

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
        
        {modelsLoading && (
          <div className="loading-message">Loading available models...</div>
        )}
        
        {modelsError && (
          <div className="error-message">{modelsError}</div>
        )}
        
        {!modelsLoading && !modelsError && (
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
                {llm.provider && (
                  <div className="llm-provider">{llm.provider}</div>
                )}
              </div>
            ))}
          </div>
        )}
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
