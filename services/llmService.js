import axios from 'axios';

const LLM_CONFIGS = {
  gpt4: {
    provider: 'openrouter',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    maxTokens: 2000,
  },
  gemini: {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    maxTokens: 2000,
  },
  claude: {
    provider: 'openrouter',
    model: 'mistralai/mistral-small-3.2-24b-instruct:free',
    maxTokens: 2000,
  },
  mixtral: {
    provider: 'openrouter',
    model: 'deepseek/deepseek-chat-v3.1:free',
    maxTokens: 2000,
  },
  llama2: {
    provider: 'openrouter',
    model: 'openrouter/polaris-alpha',
    maxTokens: 2000,
  },
};

// Extended model configurations for model picker
const ALL_LLM_MODELS = {
  openrouter: [
    { id: 'kwaipilot/kat-coder-pro:free', name: 'Kwaipilot: Kat Coder Pro (Free)', provider: 'OpenRouter' },
    { id: 'openrouter/polaris-alpha', name: 'Polaris Alpha (Free)', provider: 'OpenRouter' },
    { id: 'nvidia/nemotron-nano-12b-v2-vl:free', name: 'NVIDIA: Nemotron Nano 12B V2 VL (Free)', provider: 'OpenRouter' },
    { id: 'minimax/minimax-m2:free', name: 'MiniMax: MiniMax M2 (Free)', provider: 'OpenRouter' },
    { id: 'alibaba/tongyi-deepresearch-30b-a3b:free', name: 'Tongyi DeepResearch 30B A3B (Free)', provider: 'OpenRouter' },
    { id: 'meituan/longcat-flash-chat:free', name: 'Meituan: LongCat Flash Chat (Free)', provider: 'OpenRouter' },
    { id: 'deepseek/deepseek-chat-v3.1:free', name: 'DeepSeek: DeepSeek V3.1 (Free)', provider: 'OpenRouter' },
    { id: 'openai/gpt-oss-20b:free', name: 'OpenAI: GPT OSS 20B (Free)', provider: 'OpenRouter' },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Meta: Llama 3.3 70B Instruct (Free)', provider: 'OpenRouter' },
    { id: 'mistralai/mistral-small-3.2-24b-instruct:free', name: 'Mistral: Mistral Small 3.2 24B (Free)', provider: 'OpenRouter' },
    { id: 'meta-llama/llama-3.3-8b-instruct:free', name: 'Meta: Llama 3.3 8B Instruct (Free)', provider: 'OpenRouter' },
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Google: Gemini 2.0 Flash Experimental (Free)', provider: 'OpenRouter' },
    { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek: DeepSeek R1 (Free)', provider: 'OpenRouter' },
    { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen2.5 72B Instruct (Free)', provider: 'OpenRouter' },
    { id: 'nousresearch/hermes-3-llama-3.1-405b:free', name: 'Nous: Hermes 3 405B Instruct (Free)', provider: 'OpenRouter' },
    { id: 'mistralai/mistral-nemo:free', name: 'Mistral: Mistral Nemo (Free)', provider: 'OpenRouter' },
  ],
  gemini: [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
    { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', provider: 'Google' },
    { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite Latest', provider: 'Google' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'Google' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google' },
    { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', provider: 'Google' },
  ],
  anthropic: [],
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
    
    // Debug environment variables
    console.log('LLM Service - Environment Variables Check:');
    console.log('- OpenRouter Key exists:', !!this.openRouterKey);
    console.log('- Gemini Key exists:', !!this.geminiKey);
    
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

    switch (config.provider) {
      case 'openrouter':
        return this.callOpenRouter(config, prompt);
      case 'gemini':
        return this.callGemini(config, prompt);
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
}

export default new LLMService();
