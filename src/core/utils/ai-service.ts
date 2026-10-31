export interface ChatMessage {
  id: string;
  sender: 'agent' | 'user';
  text: string;
}

export type AIProvider = 'gemini' | 'groq' | 'openrouter' | 'pollinations' | 'ollama' | 'huggingface' | 'fallback';

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
  private static openrouterKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
  private static hfKey = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY || '';
  private static ollamaUrl = process.env.EXPO_PUBLIC_OLLAMA_URL || '';
  private static ollamaModel = process.env.EXPO_PUBLIC_OLLAMA_MODEL || 'llama3.2';

  /**
   * Dynamically loads the active user and candidate profile for prompt tailoring
   */
  private static getActiveUserProfile() {
    try {
      const { useCandidateProfileStore } = require('../../features/career/state/candidate-profile-store');
      const { useAuthStore } = require('../../features/auth/state/auth-store');
      const candidate = useCandidateProfileStore.getState();
      const authUser = useAuthStore.getState().user;
      const name = candidate.name || authUser?.name || 'Applicant';
      const email = candidate.email || authUser?.email || '';
      const phone = candidate.phone || '';
      const title = candidate.targetRole || 'Software Engineer';
      const yearsOfExperience = candidate.yearsOfExperience || '2+ years';
      const skills = candidate.skills?.length ? candidate.skills : ['React', 'React Native', 'TypeScript', 'Node.js'];
      const githubUrl = candidate.githubUrl || '';
      const linkedinUrl = candidate.linkedinUrl || '';
      const portfolioUrl = candidate.portfolioUrl || '';
      return { name, email, phone, title, yearsOfExperience, skills, githubUrl, linkedinUrl, portfolioUrl };
    } catch {
      return {
        name: 'Applicant',
        email: '',
        phone: '',
        title: 'Software Engineer',
        yearsOfExperience: '2+ years',
        skills: ['React', 'React Native', 'TypeScript', 'Node.js'],
        githubUrl: '',
        linkedinUrl: '',
        portfolioUrl: '',
      };
    }
  }

  /**
   * Returns active Gemini Key from user config or environment
   */
  static getGeminiKey(): string {
    try {
      const { useAiConfigStore } = require('../state/ai-config-store');
      const userKey = useAiConfigStore.getState().geminiKey;
      if (this.isValidKey(userKey)) return userKey.trim();
    } catch {}
    return process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  }

  /**
   * Returns active Groq Key from user config or environment
   */
  static getGroqKey(): string {
    try {
      const { useAiConfigStore } = require('../state/ai-config-store');
      const userKey = useAiConfigStore.getState().groqKey;
      if (this.isValidKey(userKey)) return userKey.trim();
    } catch {}
    return process.env.EXPO_PUBLIC_GROQ_API_KEY || this.groqKey;
  }

  /**
   * Returns active OpenRouter Key from user config or environment
   */
  static getOpenRouterKey(): string {
    try {
      const { useAiConfigStore } = require('../state/ai-config-store');
      const userKey = useAiConfigStore.getState().openrouterKey;
      if (this.isValidKey(userKey)) return userKey.trim();
    } catch {}
    return process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
  }

  /**
   * Returns list of configured and available providers
   */
  static getConfiguredProviders(): AIProvider[] {
    const list: AIProvider[] = [];
    let preferred = 'auto';
    try {
      const { useAiConfigStore } = require('../state/ai-config-store');
      preferred = useAiConfigStore.getState().preferredProvider;
    } catch {}

    const hasGroq = this.isValidKey(this.getGroqKey());
    const hasGemini = this.isValidKey(this.getGeminiKey());
    const hasOpenRouter = this.isValidKey(this.getOpenRouterKey());

    if (preferred === 'openrouter' && hasOpenRouter) {
      list.push('openrouter');
      if (hasGroq) list.push('groq');
      if (hasGemini) list.push('gemini');
    } else if (preferred === 'gemini' && hasGemini) {
      list.push('gemini');
      if (hasGroq) list.push('groq');
      if (hasOpenRouter) list.push('openrouter');
    } else if (preferred === 'groq' && hasGroq) {
      list.push('groq');
      if (hasGemini) list.push('gemini');
      if (hasOpenRouter) list.push('openrouter');
    } else {
      if (hasOpenRouter) list.push('openrouter');
      if (hasGemini) list.push('gemini');
      if (hasGroq) list.push('groq');
    }

    // Zero-Key Public AI (Pollinations.ai)
    list.push('pollinations');

    // Default backup developer fallback if needed
    if (hasGroq && !list.includes('groq')) {
      list.push('groq');
    }

    if (this.ollamaUrl && this.ollamaUrl.startsWith('http')) list.push('ollama');
    if (this.isValidKey(this.hfKey)) list.push('huggingface');
    return list;
  }

  static hasConfiguredKey(): boolean {
    return true; // Always true: Pollinations Zero-Key AI is always available without any setup!
  }

  static isValidKey(key?: string): boolean {
    return Boolean(key && key.trim().length > 5 && !key.includes('your_') && !key.includes('here'));
  }

  /**
   * Unified multi-provider runner with automatic failover (OpenRouter -> Gemini -> Groq -> Pollinations -> Ollama)
   */
  private static async queryLLM(options: QueryOptions): Promise<string | null> {
    const providers = this.getConfiguredProviders();

    for (const provider of providers) {
      try {
        let result: string | null = null;
        switch (provider) {
          case 'openrouter':
            result = await this.callOpenRouter(options);
            break;
          case 'gemini':
            result = await this.callGemini(options);
            break;
          case 'groq':
            result = await this.callGroq(options);
            break;
          case 'pollinations':
            result = await this.callPollinations(options);
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
    const key = this.getGeminiKey();
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
    const key = this.getGroqKey();
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
   * Provider: OpenRouter (DeepSeek R1, Llama 3.3 70B, Free Models)
   */
  private static async callOpenRouter(options: QueryOptions): Promise<string | null> {
    const key = this.getOpenRouterKey();
    const models = [
      'deepseek/deepseek-r1:free',
      'meta-llama/llama-3.3-70b-instruct:free',
      'google/gemini-2.0-flash-exp:free',
      'qwen/qwen-2.5-72b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
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
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 9000);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
            'HTTP-Referer': 'https://aayon.app',
            'X-Title': 'AAYON Personal OS',
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: options.maxTokens || 1024,
            temperature: 0.7,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

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
   * Provider: Pollinations.ai (Zero-Key Public AI, 100% Free, No Account Needed)
   */
  private static async callPollinations(options: QueryOptions): Promise<string | null> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    if (options.history) {
      for (const msg of options.history.slice(-3)) {
        messages.push({
          role: msg.sender === 'agent' ? 'assistant' : 'user',
          content: msg.text,
        });
      }
    }

    messages.push({ role: 'user', content: options.userPrompt });

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);

      const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          model: 'openai-fast',
          seed: Math.floor(Math.random() * 100000),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) return null;
      const text = await response.text();
      if (!text || text.includes('Free limit reached') || text.includes('"error":')) {
        return null;
      }
      return text.trim();
    } catch {
      return null;
    }
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

    const user = this.getActiveUserProfile();
    const systemPrompt = `You are AAYON, an intelligent executive personal assistant and life mentor inside a personal Life OS mobile app.
The user is ${user.name}.
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

    const user = this.getActiveUserProfile();
    const prompt = `Generate a single short energetic morning executive summary (max 2 sentences) for ${user.name}.
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
    const profile = this.getActiveUserProfile();

    const fallbackLetter = `Dear Hiring Team at ${company},

I am writing to express my strong interest in the ${role} position. With over ${profile.yearsOfExperience} of experience as a ${profile.title}, I specialize in building high-performance, scalable applications using ${profile.skills.slice(0, 4).join(', ')}.

In my recent projects, I spearheaded technical architecture and full-lifecycle delivery of mission-critical features with high performance and security standards. My engineering background aligns closely with the technical demands of ${company}${tags.length ? ` (especially in ${tags.join(', ')})` : ''}.

I look forward to discussing how my engineering background and track record of delivering results can contribute to your team's success.

Sincerely,
${profile.name}
${profile.email ? profile.email : ''}${profile.phone ? ` | ${profile.phone}` : ''}`;

    if (this.getConfiguredProviders().length === 0) {
      return fallbackLetter;
    }

    const prompt = `Write a compelling, concise 3-paragraph professional Cover Letter for:
Candidate: ${profile.name} (${profile.title})
Experience: ${profile.yearsOfExperience}
Key Stack: ${profile.skills.join(', ')}
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

  /**
   * 5. Multi-Channel Cold Outreach & Referral Pitch Generator
   */
  static async generateOutreachPitch(
    type: 'linkedin_connect' | 'referral_request' | 'recruiter_inmail' | 'follow_up_checkin',
    company: string,
    role: string,
    recruiterName?: string,
    tags: string[] = []
  ): Promise<string> {
    const profile = this.getActiveUserProfile();
    const greeting = recruiterName ? `Hi ${recruiterName},` : 'Hi there,';

    let fallbackText = '';
    switch (type) {
      case 'linkedin_connect':
        fallbackText = `${greeting} noticed the ${role} opening at ${company}. As a ${profile.title} (${profile.yearsOfExperience}) building high-perf apps, I'd love to connect & explore how my tech background aligns. Best, ${profile.name}.`;
        break;
      case 'referral_request':
        fallbackText = `Hi [Name],\n\nI came across the ${role} opening at ${company} and was really impressed by your team's engineering work.\n\nI'm a ${profile.title} (${profile.yearsOfExperience}) specializing in ${profile.skills.slice(0, 3).join(', ')}. Given my background, I believe I'd be a great fit.\n\nWould you be open to putting in a referral for me?${profile.githubUrl ? ` GitHub: ${profile.githubUrl}` : ''}\n\nThank you!\n${profile.name}\n${profile.email}`;
        break;
      case 'recruiter_inmail':
        fallbackText = `Subject: Application Inquiry: ${role} - ${profile.name}\n\n${greeting}\n\nI'm reaching out regarding the ${role} position at ${company}. With ${profile.yearsOfExperience} in ${profile.title}, I specialize in ${profile.skills.slice(0, 4).join(', ')}.\n\nI'd welcome a brief conversation to discuss how I can contribute to ${company}'s roadmap.\n\n${profile.portfolioUrl || profile.githubUrl ? `Portfolio: ${profile.portfolioUrl || profile.githubUrl}\n` : ''}${profile.phone ? `Phone: ${profile.phone}\n` : ''}\nBest regards,\n${profile.name}`;
        break;
      case 'follow_up_checkin':
        fallbackText = `Subject: Gentle Follow-up: ${role} Application - ${profile.name}\n\n${greeting}\n\nI hope you are having a productive week.\n\nI am following up on my application for the ${role} role at ${company}. I remain very enthusiastic about your team's mission and would love to check if there are any updates regarding the next steps.\n\nPlease let me know if you need any additional details or references from my end.\n\nWarm regards,\n${profile.name}`;
        break;
    }

    if (this.getConfiguredProviders().length === 0) {
      return fallbackText;
    }

    let prompt = '';
    if (type === 'linkedin_connect') {
      prompt = `Write a LinkedIn Connection Note under STRICT 280 characters for:
Candidate: ${profile.name} (${profile.title}, ${profile.yearsOfExperience})
Target: ${role} at ${company}
Recruiter: ${recruiterName || 'Team member'}
CRITICAL CONSTRAINT: MUST BE UNDER 280 CHARACTERS. Polite, professional, no fluff.`;
    } else if (type === 'referral_request') {
      prompt = `Write a polite, high-converting 1-on-1 Referral Request message to an employee at ${company} for the ${role} role.
Candidate: ${profile.name} (${profile.title}, ${profile.skills.join(', ')}, ${profile.yearsOfExperience})
Tags: ${tags.join(', ')}
Include polite request for internal referral, brief proof of work, and GitHub profile mention. Under 180 words.`;
    } else if (type === 'recruiter_inmail') {
      prompt = `Write an executive Cold Outreach InMail to a talent recruiter (${recruiterName || 'HR'}) at ${company} for ${role}.
Candidate: ${profile.name} (${profile.yearsOfExperience}, ${profile.title}, ${profile.skills.join(', ')})
Include punchy subject line, value proposition, and call to action. Under 200 words.`;
    } else {
      prompt = `Write a courteous, professional follow-up email checking in on a job application submitted 7 days ago for ${role} at ${company}.
Recipient: ${recruiterName || 'Hiring Team'}
Candidate: ${profile.name}
Tone: Respectful, enthusiastic, professional. Under 150 words.`;
    }

    const reply = await this.queryLLM({
      userPrompt: prompt,
      maxTokens: 350,
    });

    return reply || fallbackText;
  }

  /**
   * 6. AI Resume Tailor & Quantifiable Bullet Generator (ATS Gap Closer)
   */
  static async generateResumeOptimizationBullets(jobDescription: string, resumeSkills: string[]): Promise<string[]> {
    const fallbackBullets = [
      "Architected responsive, cross-platform mobile modules utilizing React Native and TypeScript, optimizing render speeds by 35% and reducing bundle size by 20%.",
      "Engineered automated CI/CD and unit testing pipelines with Jest, increasing code coverage to 85% and cutting regression cycles from 2 days to 3 hours.",
      "Spearheaded real-time state synchronization using Zustand and WebSockets, supporting 10,000+ daily concurrent user sessions with 99.9% crash-free rate."
    ];

    if (this.getConfiguredProviders().length === 0) {
      return fallbackBullets;
    }

    const prompt = `You are a Principal Technical Resume Architect.
Review this Job Description and the candidate's core skills:
Candidate Skills: ${resumeSkills.join(', ')}
Target Job Description:
"""${jobDescription.slice(0, 1500)}"""

Generate exactly 3 high-impact, quantifiable resume achievement bullet points (starting with strong action verbs like 'Architected', 'Spearheaded', 'Engineered') tailored directly to win this ATS screening.
Output ONLY a JSON array of 3 strings: ["bullet 1", "bullet 2", "bullet 3"].`;

    const raw = await this.queryLLM({
      userPrompt: prompt,
      maxTokens: 400,
    });

    if (raw) {
      try {
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.slice(0, 3).map((b) => String(b));
          }
        }
      } catch {
        // fallback
      }
    }

    return fallbackBullets;
  }

  /**
   * 7. Executive Counter-Offer Salary Negotiation Email
   */
  static async generateCounterOfferLetter(
    company: string,
    role: string,
    currentOfferLPA: number,
    desiredLPA: number,
    notes?: string
  ): Promise<string> {
    const profile = this.getActiveUserProfile();
    const fallbackLetter = `Subject: Acceptance & Discussion regarding Offer for ${role} - ${profile.name}

Dear Hiring Team at ${company},

Thank you very much for extending the offer for the ${role} position. I am genuinely thrilled about the team, the engineering vision, and the opportunity to contribute to ${company}.

I would like to discuss the compensation package. The current offer is ₹${currentOfferLPA} LPA. Based on my technical background and track record of building production systems, combined with standard market benchmarks for this role${notes ? ` (${notes})` : ''}, I am seeking a base CTC closer to ₹${desiredLPA} LPA.

I am confident that my contributions will provide immediate value to the team. If we can reach an agreement near ₹${desiredLPA} LPA, I would be prepared to sign and accept the offer immediately.

Thank you once again for your flexibility and support. I look forward to your thoughts.

Sincerely,
${profile.name}${profile.phone ? `\nPhone: ${profile.phone}` : ''}`;

    if (this.getConfiguredProviders().length === 0) {
      return fallbackLetter;
    }

    const prompt = `Write a courteous, highly strategic salary counter-offer negotiation email.
Company: ${company}
Role: ${role}
Candidate: ${profile.name} (${profile.title}, ${profile.yearsOfExperience})
Current Offer: ₹${currentOfferLPA} LPA
Target Desired Compensation: ₹${desiredLPA} LPA
Additional Leverage / Context: ${notes || 'Strong technical leadership, competing prospects, market benchmark'}

Tone: Extremely polite, enthusiastic about joining, confident in business value, professional leverage. Under 200 words.`;

    const letter = await this.queryLLM({
      userPrompt: prompt,
      maxTokens: 450,
    });

    return letter || fallbackLetter;
  }
}
