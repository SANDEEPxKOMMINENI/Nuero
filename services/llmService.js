import axios from 'axios';

const LLM_CONFIGS = {
  gpt4: {
    provider: 'openrouter',
    model: 'openai/gpt-4-turbo-preview',
    maxTokens: 2000,
  },
  gemini: {
    provider: 'gemini',
    model: 'gemini-pro',
    maxTokens: 2000,
  },
  claude: {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    maxTokens: 2000,
  },
  mixtral: {
    provider: 'openrouter',
    model: 'mistralai/mixtral-8x7b-instruct',
    maxTokens: 2000,
  },
  llama2: {
    provider: 'openrouter',
    model: 'meta-llama/llama-2-70b-chat',
    maxTokens: 2000,
  },
};

// Extended model configurations for model picker
const ALL_LLM_MODELS = {
  openrouter: [
    { id: 'openai/gpt-4-turbo-preview', name: 'GPT-4 Turbo', provider: 'OpenRouter' },
    { id: 'openai/gpt-4', name: 'GPT-4', provider: 'OpenRouter' },
    { id: 'anthropic/claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'OpenRouter' },
    { id: 'anthropic/claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'OpenRouter' },
    { id: 'google/gemini-pro', name: 'Gemini Pro', provider: 'OpenRouter' },
    { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B', provider: 'OpenRouter' },
    { id: 'mistralai/mixtral-8x7b-instruct', name: 'Mixtral 8x7B', provider: 'OpenRouter' },
    { id: 'meta-llama/llama-2-70b-chat', name: 'Llama 2 70B', provider: 'OpenRouter' },
  ],
  gemini: [
    { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google' },
    { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', provider: 'Google' },
  ],
  anthropic: [
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'Anthropic' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'Anthropic' },
  ],
};

class LLMService {
  constructor() {
    // Initialize keys - they will be checked when needed
    this._keysChecked = false;
  }

  _checkEnvironmentVariables() {
    if (this._keysChecked) return;
    
    this.openRouterKey = process.env.OPENROUTER_API_KEY;
    this.geminiKey = process.env.GEMINI_API_KEY;
    this.claudeKey = process.env.ANTHROPIC_API_KEY;
    
    // Debug environment variables
    console.log('LLM Service - Environment Variables Check:');
    console.log('- OpenRouter Key exists:', !!this.openRouterKey);
    console.log('- Gemini Key exists:', !!this.geminiKey);
    console.log('- Claude Key exists:', !!this.claudeKey);
    console.log('- Claude Key is placeholder:', this.claudeKey === 'your-anthropic-api-key');
    
    this._keysChecked = true;
  }

  /**
   * Call LLM with fallback logic
   * @param {String} llmType - Type of LLM (gpt4, gemini, claude, etc.)
   * @param {String} prompt - The prompt to send
   * @param {Array} fallbackLLMs - Fallback LLM types if primary fails
   * @returns {Promise<Object>} - Response with content and model used
   */
  async callLLMWithFallback(llmType, prompt, fallbackLLMs = []) {
    let llmOrder = [llmType, ...fallbackLLMs];
    let lastError = null;

    for (const llm of llmOrder) {
      try {
        const response = await this.callLLM(llm, prompt);
        return {
          ...response,
          modelUsed: llm,
          fallbackUsed: llm !== llmType,
        };
      } catch (error) {
        lastError = error;
        console.error(
          `Failed with ${llm}, trying next LLM. Error:`,
          error.message
        );
        continue;
      }
    }

    throw new Error(
      `All LLMs failed. Last error: ${lastError.message}`
    );
  }

  /**
   * Get all available models
   */
  getAvailableModels() {
    this._checkEnvironmentVariables();
    return ALL_LLM_MODELS;
  }

  /**
   * Call individual LLM
   */
  async callLLM(llmType, prompt) {
    this._checkEnvironmentVariables();
    
    const config = LLM_CONFIGS[llmType];
    if (!config) {
      throw new Error(`Unknown LLM type: ${llmType}`);
    }

    // Check API key availability
    if (config.provider === 'openrouter' && (!this.openRouterKey || this.openRouterKey === 'your-openrouter-api-key')) {
      throw new Error('OpenRouter API key is missing or not configured');
    }
    if (config.provider === 'gemini' && (!this.geminiKey || this.geminiKey === 'your-gemini-api-key')) {
      throw new Error('Gemini API key is missing or not configured');
    }
    if (config.provider === 'anthropic' && (!this.claudeKey || this.claudeKey === 'your-anthropic-api-key')) {
      throw new Error('Anthropic API key is missing or not configured');
    }

    switch (config.provider) {
      case 'openrouter':
        return this.callOpenRouter(config, prompt);
      case 'gemini':
        return this.callGemini(config, prompt);
      case 'anthropic':
        return this.callClaude(config, prompt);
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }

  async callOpenRouter(config, prompt) {
    try {
      console.log(`Calling OpenRouter with model: ${config.model}`);
      
      const requestData = {
        model: config.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: config.maxTokens,
      };

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        requestData,
        {
          headers: {
            Authorization: `Bearer ${this.openRouterKey}`,
            'HTTP-Referer': 'https://ai-resume-tailor.local',
            'X-Title': 'AI Resume Tailor',
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (!response.data || !response.data.choices || response.data.choices.length === 0) {
        throw new Error('Invalid response format from OpenRouter');
      }

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenRouter response');
      }

      return {
        content: content,
        tokensUsed: response.data.usage?.total_tokens || 0,
      };
    } catch (error) {
      console.error('OpenRouter API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        throw new Error('OpenRouter API key is invalid or expired. Please check your API key.');
      } else if (error.response?.status === 400) {
        throw new Error(`OpenRouter request error: ${error.response?.data?.error?.message || 'Invalid request'}`);
      } else if (error.response?.status === 429) {
        throw new Error('OpenRouter rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`OpenRouter API error: ${error.message}`);
      }
    }
  }

  async callGemini(config, prompt) {
    try {
      console.log(`Calling Gemini with model: ${config.model}`);
      
      const requestData = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: config.maxTokens,
        },
      };

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${this.geminiKey}`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
        throw new Error('Invalid response format from Gemini');
      }

      const candidate = response.data.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('No content in Gemini response');
      }

      const content = candidate.content.parts[0].text;
      if (!content) {
        throw new Error('Empty text in Gemini response');
      }

      return {
        content: content,
        tokensUsed: response.data.usageMetadata?.totalTokenCount || 0,
      };
    } catch (error) {
      console.error('Gemini API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 400) {
        const errorDetails = error.response?.data?.error?.details || [];
        const errorMessage = errorDetails.length > 0 ? errorDetails[0]?.description : error.response?.data?.error?.message;
        throw new Error(`Gemini request error: ${errorMessage || 'Invalid request'}`);
      } else if (error.response?.status === 401) {
        throw new Error('Gemini API key is invalid or expired. Please check your API key.');
      } else if (error.response?.status === 429) {
        throw new Error('Gemini rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Gemini API error: ${error.message}`);
      }
    }
  }

  async callClaude(config, prompt) {
    try {
      console.log(`Calling Claude with model: ${config.model}`);
      
      const requestData = {
        model: config.model,
        max_tokens: config.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      };

      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        requestData,
        {
          headers: {
            'x-api-key': this.claudeKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (!response.data || !response.data.content || response.data.content.length === 0) {
        throw new Error('Invalid response format from Claude');
      }

      const content = response.data.content[0]?.text;
      if (!content) {
        throw new Error('No content in Claude response');
      }

      return {
        content: content,
        tokensUsed: response.data.usage?.input_tokens || 0,
      };
    } catch (error) {
      console.error('Claude API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        throw new Error('Claude API key is invalid or expired. Please check your API key.');
      } else if (error.response?.status === 400) {
        throw new Error(`Claude request error: ${error.response?.data?.error?.message || 'Invalid request'}`);
      } else if (error.response?.status === 429) {
        throw new Error('Claude rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Claude API error: ${error.message}`);
      }
    }
  }
}

export default new LLMService();
