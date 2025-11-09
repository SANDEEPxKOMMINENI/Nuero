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

class LLMService {
  constructor() {
    this.openRouterKey = process.env.OPENROUTER_API_KEY;
    this.geminiKey = process.env.GEMINI_API_KEY;
    this.claudeKey = process.env.ANTHROPIC_API_KEY;
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
   * Call individual LLM
   */
  async callLLM(llmType, prompt) {
    const config = LLM_CONFIGS[llmType];
    if (!config) {
      throw new Error(`Unknown LLM type: ${llmType}`);
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
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: config.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: config.maxTokens,
      },
      {
        headers: {
          Authorization: `Bearer ${this.openRouterKey}`,
          'HTTP-Referer': 'https://ai-resume-tailor.local',
          'X-Title': 'AI Resume Tailor',
        },
      }
    );

    if (!response.data.choices || response.data.choices.length === 0) {
      throw new Error('No response from OpenRouter');
    }

    return {
      content: response.data.choices[0].message.content,
      tokensUsed: response.data.usage?.total_tokens || 0,
    };
  }

  async callGemini(config, prompt) {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${this.geminiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }
    );

    if (
      !response.data.candidates ||
      response.data.candidates.length === 0
    ) {
      throw new Error('No response from Gemini');
    }

    return {
      content:
        response.data.candidates[0].content.parts[0].text,
      tokensUsed: 0,
    };
  }

  async callClaude(config, prompt) {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: config.model,
        max_tokens: config.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          'x-api-key': this.claudeKey,
          'anthropic-version': '2023-06-01',
        },
      }
    );

    if (!response.data.content || response.data.content.length === 0) {
      throw new Error('No response from Claude');
    }

    return {
      content: response.data.content[0].text,
      tokensUsed: response.data.usage?.input_tokens || 0,
    };
  }
}

export default new LLMService();
