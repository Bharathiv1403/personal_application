import { BHARATHI_CANDIDATE_PROFILE } from '../data/candidate-profile';

export interface ChatMessage {
  id: string;
  sender: 'agent' | 'user';
  text: string;
}

export type AIProvider = 'gemini' | 'groq' | 'ollama' | 'huggingface' | 'fallback';

interface QueryOptions {
  systemPrompt?: string;
  userPrompt: string;
  history?: ChatMessage[];
  maxTokens?: number;
}

export class AIService {
  // Configuration keys
  private static geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  private static groqKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
  private static hfKey = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY || '';
  private static ollamaUrl = process.env.EXPO_PUBLIC_OLLAMA_URL || '';
  private static ollamaModel = process.env.EXPO_PUBLIC_OLLAMA_MODEL || 'llama3.2';

  /**
   * Returns list of configured and available providers
   */
  static getConfiguredProviders(): AIProvider[] {
    const list: AIProvider[] = [];
    // Prioritize Groq for ultra-fast (sub-second) responses
    if (this.isValidKey(this.groqKey)) list.push('groq');
    if (this.isValidKey(this.geminiKey)) list.push('gemini');
    if (this.ollamaUrl && this.ollamaUrl.startsWith('http')) list.push('ollama');
    if (this.isValidKey(this.hfKey)) list.push('huggingface');
    return list;
  }

  private static isValidKey(key?: string): boolean {
    return Boolean(key && key.trim().length > 5 && !key.includes('your_') && !key.includes('here'));
  }

  /**
   * Unified multi-provider runner with automatic failover (Groq -> Gemini -> Ollama -> HuggingFace)
   */
  private static async queryLLM(options: QueryOptions): Promise<string | null> {
    const providers = this.getConfiguredProviders();

    for (const provider of providers) {
      try {
        let result: string | null = null;
        switch (provider) {
          case 'groq':
            result = await this.callGroq(options);
            break;
          case 'gemini':
            result = await this.callGemini(options);
            break;
          case 'ollama':
            result = await this.callOllama(options);
            break;
          case 'huggingface':
            result = await this.callHuggingFace(options);
            break;
        }

        if (result && result.trim().length > 0) {
          return result.trim();
        }
      } catch (err) {
        console.warn(`[AIService] ${provider} call failed, trying next provider:`, err);
      }
    }

    return null;
  }

  /**
   * Provider: Google Gemini
   */
  private static async callGemini(options: QueryOptions): Promise<string | null> {
    const key = this.geminiKey;
    const models = [
      'gemini-3.8-flash',
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ];

    const contents: any[] = [];
    
    // Add history
    if (options.history && options.history.length > 0) {
      for (const msg of options.history.slice(-4)) {
        contents.push({
          role: msg.sender === 'agent' ? 'model' : 'user',
          parts: [{ text: msg.text }],
        });
      }
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: options.userPrompt }],
    });

    const bodyPayload: any = { contents };
    if (options.systemPrompt) {
      bodyPayload.systemInstruction = {
        parts: [{ text: options.systemPrompt }],
      };
    }

    for (const model of models) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        if (!response.ok) continue;
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Provider: Groq Cloud (Ultra-Fast 120B / 20B / Llama)
   */
  private static async callGroq(options: QueryOptions): Promise<string | null> {
    const key = this.groqKey;
    const models = [
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.8-27b',
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
    ];

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    if (options.history) {
      for (const msg of options.history.slice(-4)) {
        messages.push({
          role: msg.sender === 'agent' ? 'assistant' : 'user',
          content: msg.text,
        });
      }
    }

    messages.push({ role: 'user', content: options.userPrompt });

    for (const model of models) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: options.maxTokens || 1024,
            temperature: 0.7,
          }),
        });

        if (!response.ok) continue;
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text;
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Provider 3: Ollama (Local PC or Remote Tunnel)
   */
  private static async callOllama(options: QueryOptions): Promise<string | null> {
    const baseUrl = this.ollamaUrl.replace(/\/$/, '');
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    if (options.history) {
      for (const msg of options.history.slice(-4)) {
        messages.push({
          role: msg.sender === 'agent' ? 'assistant' : 'user',
          content: msg.text,
        });
      }
    }

    messages.push({ role: 'user', content: options.userPrompt });

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.ollamaModel,
          messages,
          stream: false,
        }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.message?.content || null;
    } catch {
      return null;
    }
  }

  /**
   * Provider 4: Hugging Face Serverless Inference
   */
  private static async callHuggingFace(options: QueryOptions): Promise<string | null> {
    const key = this.hfKey;
    const model = 'meta-llama/Llama-3.2-3B-Instruct';

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    if (options.history) {
      for (const msg of options.history.slice(-4)) {
        messages.push({
          role: msg.sender === 'agent' ? 'assistant' : 'user',
          content: msg.text,
        });
      }
    }

    messages.push({ role: 'user', content: options.userPrompt });

    try {
      const response = await fetch('https://router.huggingface.co/hf-inference/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: options.maxTokens || 800,
        }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    } catch {
      return null;
    }
  }

  // -------------------------------------------------------------
  // Public App Features (with Fallbacks)
  // -------------------------------------------------------------

  /**
   * 1. Interactive Life OS Agent Chat
   */
  static async generateReply(
    userMessage: string,
    history: ChatMessage[] = [],
    context?: { steps?: number; pendingLoansCount?: number; upcomingInterviewsCount?: number }
  ): Promise<string> {
    const configured = this.getConfiguredProviders();
    if (configured.length === 0) {
      return "⚠️ No Free AI Key configured.\n\nAdd your free Gemini API key (aistudio.google.com) or Groq key (console.groq.com) in .env to activate the AI Assistant.";
    }

    const systemPrompt = `You are AAYON, an intelligent executive personal assistant and life mentor inside a personal Life OS mobile app.
The user is Bharathi.
Current context:
- Today's steps: ${context?.steps ?? 'N/A'}
- Active loans to track: ${context?.pendingLoansCount ?? 0}
- Upcoming interviews: ${context?.upcomingInterviewsCount ?? 0}
Give concise, helpful, empowering answers tailored for mobile reading (use bullet points and emojis when relevant). Keep replies within 2-4 sentences unless detailed analysis is requested.`;

    const reply = await this.queryLLM({
      systemPrompt,
      userPrompt: userMessage,
      history,
    });

    if (reply) return reply;

    return "I'm having trouble connecting to the configured AI services right now. Please verify your internet connection or API keys.";
  }

  /**
   * 2. Morning Executive Daily Briefing
   */
  static async generateDailyBriefing(context: {
    steps: number;
    stepGoal: number;
    waterMl: number;
    waterGoal: number;
    activeLoanCount: number;
    nearestDueDate?: number;
    upcomingJob?: string;
  }): Promise<string> {
    const fallbackText = `Welcome back! You're at ${context.steps.toLocaleString()} steps (${Math.round(
      (context.steps / context.stepGoal) * 100
    )}% of goal). Stay hydrated with ${context.waterMl}ml and conquer your top priorities today!`;

    if (this.getConfiguredProviders().length === 0) {
      return fallbackText;
    }

    const prompt = `Generate a single short energetic morning executive summary (max 2 sentences) for Bharathi.
Metrics:
- Steps: ${context.steps} / ${context.stepGoal}
- Water: ${context.waterMl}ml / ${context.waterGoal}ml
- Loans tracking: ${context.activeLoanCount}
- Nearest due day: ${context.nearestDueDate ?? 'None'}
- Top career goal: ${context.upcomingJob || 'None'}`;

    const reply = await this.queryLLM({
      userPrompt: prompt,
      maxTokens: 150,
    });

    return reply || fallbackText;
  }

  /**
   * 3. 1-Click Tailored ATS Cover Letter
   */
  static async generateCoverLetter(company: string, role: string, tags: string[] = []): Promise<string> {
    const profile = BHARATHI_CANDIDATE_PROFILE;

    const fallbackLetter = `Dear Hiring Team at ${company},

I am writing to express my strong interest in the ${role} position. With over 2+ years of experience as a Frontend Developer & Lead at Sagasoft Technologies, I specialize in building high-performance web and mobile applications using React, React Native, Next.js, and TypeScript.

In my recent projects, I spearheaded the frontend architecture of enterprise SaaS products including the Saga Mail mobile client (Expo & Hermes push engine) and the SagaID Admin Console with OIDC security. My background aligns closely with the technical demands of ${company}${tags.length ? ` (especially in ${tags.join(', ')})` : ''}.

I look forward to discussing how my engineering background and leadership experience can contribute to your team's success.

Sincerely,
Bharathi V
${profile.email} | ${profile.phone}`;

    if (this.getConfiguredProviders().length === 0) {
      return fallbackLetter;
    }

    const prompt = `Write a compelling, concise 3-paragraph professional Cover Letter for:
Candidate: Bharathi V (${profile.title})
Current Company: Sagasoft Technologies (Frontend Team Lead, 2+ YOE)
Key Stack: React, React Native, Expo, Next.js, TypeScript, Zustand, OIDC, Enterprise SaaS
Target Role: ${role}
Target Company: ${company}
Target Tech: ${tags.join(', ')}

Tone: Confident, technical, professional, executive. Keep it under 250 words so recruiters read it fully.`;

    const letter = await this.queryLLM({
      userPrompt: prompt,
      maxTokens: 500,
    });

    return letter || fallbackLetter;
  }

  /**
   * 4. Technical & HR Interview Feedback Coach
   */
  static async evaluateInterviewAnswer(question: string, userAnswer: string): Promise<string> {
    const fallbackFeedback =
      "✅ Good attempt! Key points covered. To score 10/10, ensure you quantify results and highlight production edge-cases.";

    if (this.getConfiguredProviders().length === 0) {
      return fallbackFeedback;
    }

    const prompt = `You are a Senior Tech Hiring Bar Raiser evaluating a candidate's answer.
Question: "${question}"
Candidate Answer: "${userAnswer}"

Provide:
1. Score out of 10
2. What was strong in the answer (1-2 bullet points)
3. What was missed or how to make it senior-level (1-2 bullet points)
Keep reply under 150 words.`;

    const feedback = await this.queryLLM({
      userPrompt: prompt,
      maxTokens: 300,
    });

    return feedback || fallbackFeedback;
  }
}
