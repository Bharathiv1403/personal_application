import { BHARATHI_CANDIDATE_PROFILE } from '../data/candidate-profile';

export interface ChatMessage {
  id: string;
  sender: 'agent' | 'user';
  text: string;
}

export class AIService {
  private static apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

  static async generateReply(
    userMessage: string,
    history: ChatMessage[] = [],
    context?: { steps?: number; pendingLoansCount?: number; upcomingInterviewsCount?: number }
  ): Promise<string> {
    const key = this.apiKey;
    if (!key || key.includes('your_gemini_api_key_here')) {
      return "⚠️ Gemini API Key not configured. Please add your EXPO_PUBLIC_GEMINI_API_KEY in the .env file.";
    }

    const systemPrompt = `You are AAYON, an intelligent executive personal assistant and life mentor inside a personal Life OS mobile app.
The user is Bharathi.
Current context:
- Today's steps: ${context?.steps ?? 'N/A'}
- Active loans to track: ${context?.pendingLoansCount ?? 0}
- Upcoming interviews: ${context?.upcomingInterviewsCount ?? 0}
Give concise, helpful, empowering answers tailored for mobile reading (use bullet points and emojis when relevant). Keep replies within 2-4 sentences unless detailed analysis is requested.`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nConversation history:\n${history.slice(-4).map(h => `${h.sender}: ${h.text}`).join('\n')}\n\nUser: ${userMessage}` }]
      }
    ];

    const modelsToTry = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-1.5-flash'];

    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ contents }),
          }
        );

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      } catch (err) {
        console.warn(`[AI Service] Network error with ${model}:`, err);
      }
    }

    return "I'm having trouble connecting to the AI service right now. Please check your network connection and try again.";
  }

  static async generateDailyBriefing(context: {
    steps: number;
    stepGoal: number;
    waterMl: number;
    waterGoal: number;
    activeLoanCount: number;
    nearestDueDate?: number;
    upcomingJob?: string;
  }): Promise<string> {
    const key = this.apiKey;
    if (!key || key.includes('your_gemini_api_key_here')) {
      return `Welcome back! You're at ${context.steps} steps (${Math.round((context.steps / context.stepGoal) * 100)}% of goal). Stay hydrated and focus on today's priorities!`;
    }

    try {
      const prompt = `Generate a single short energetic morning executive summary (max 2 sentences) for Bharathi.
Metrics:
- Steps: ${context.steps} / ${context.stepGoal}
- Water: ${context.waterMl}ml / ${context.waterGoal}ml
- Loans tracking: ${context.activeLoanCount}
- Nearest due day: ${context.nearestDueDate ?? 'None'}
- Top career goal: ${context.upcomingJob || 'None'}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
    } catch {
      // Fallback
    }

    return `Welcome back! You have walked ${context.steps.toLocaleString()} steps today. Stay hydrated and conquer your key priorities!`;
  }

  /**
   * Generates a 1-click tailored ATS cover letter for a specific job application
   */
  static async generateCoverLetter(company: string, role: string, tags: string[] = []): Promise<string> {
    const key = this.apiKey;
    const profile = BHARATHI_CANDIDATE_PROFILE;

    const fallbackLetter = `Dear Hiring Team at ${company},

I am writing to express my strong interest in the ${role} position. With over 2+ years of experience as a Frontend Developer & Lead at Sagasoft Technologies, I specialize in building high-performance web and mobile applications using React, React Native, Next.js, and TypeScript.

In my recent projects, I spearheaded the frontend architecture of enterprise SaaS products including the Saga Mail mobile client (Expo & Hermes push engine) and the SagaID Admin Console with OIDC security. My background aligns closely with the technical demands of ${company}${tags.length ? ` (especially in ${tags.join(', ')})` : ''}.

I look forward to discussing how my engineering background and leadership experience can contribute to your team's success.

Sincerely,
Bharathi V
${profile.email} | ${profile.phone}`;

    if (!key || key.includes('your_gemini_api_key_here')) {
      return fallbackLetter;
    }

    try {
      const prompt = `Write a compelling, concise 3-paragraph professional Cover Letter for:
Candidate: Bharathi V (${profile.title})
Current Company: Sagasoft Technologies (Frontend Team Lead, 2+ YOE)
Key Stack: React, React Native, Expo, Next.js, TypeScript, Zustand, OIDC, Enterprise SaaS
Target Role: ${role}
Target Company: ${company}
Target Tech: ${tags.join(', ')}

Tone: Confident, technical, professional, executive. Keep it under 250 words so recruiters read it fully.`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
    } catch (err) {
      console.warn('Cover letter AI generation error:', err);
    }

    return fallbackLetter;
  }

  /**
   * Evaluates an interview answer and provides score + feedback
   */
  static async evaluateInterviewAnswer(question: string, userAnswer: string): Promise<string> {
    const key = this.apiKey;
    if (!key || key.includes('your_gemini_api_key_here')) {
      return "✅ Good attempt! Key points covered. To score 10/10, ensure you highlight real-world production metrics and edge cases.";
    }

    try {
      const prompt = `You are a Senior Tech Hiring Bar Raiser evaluating a candidate's answer.
Question: "${question}"
Candidate Answer: "${userAnswer}"

Provide:
1. Score out of 10
2. What was strong in the answer (1-2 bullet points)
3. What was missed or how to make it senior-level (1-2 bullet points)
Keep reply under 150 words.`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
    } catch {
      // fallback
    }

    return "Good structure! Remember to quantify results and mention architectural trade-offs to stand out.";
  }
}
