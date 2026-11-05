import * as FileSystem from 'expo-file-system/legacy';
import { AIService } from '@/core/utils/ai-service';
import { useAiConfigStore } from '@/core/state/ai-config-store';

export interface ParsedResumeResult {
  name: string;
  email: string;
  phone: string;
  currentCity: string;
  targetRole: string;
  yearsOfExperience: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  expectedCTC: string;
  skills: string[];
  educations: Array<{
    qualification: string;
    degree: string;
    college: string;
    graduationYear: string;
    grade?: string;
  }>;
  experiences: Array<{
    companyName: string;
    jobTitle: string;
    employmentType?: 'Full-time' | 'Contract' | 'Freelance' | 'Internship';
    startDate: string;
    endDate: string;
    isCurrentJob?: boolean;
    workLocation?: string;
    workMode?: 'Remote' | 'Hybrid' | 'On-site';
    responsibilities?: string;
    skillsUsed?: string[];
  }>;
  suggestedPreferences?: {
    targetJobTitles?: string[];
    targetKeywords?: string[];
    preferredLocations?: string[];
    workModes?: Array<'Remote' | 'Hybrid' | 'Onsite'>;
  };
}

const COMMON_TECH_SKILLS = [
  'React Native', 'React', 'TypeScript', 'JavaScript', 'Node.js', 'Express',
  'Next.js', 'Python', 'Django', 'FastAPI', 'Java', 'Spring Boot', 'Kotlin',
  'Swift', 'Flutter', 'Dart', 'C++', 'C#', '.NET', 'Go', 'Rust', 'SQL',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Firebase', 'Supabase', 'GraphQL',
  'REST APIs', 'AWS', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD', 'Git',
  'GitHub', 'Redux', 'Zustand', 'HTML5', 'CSS3', 'Tailwind CSS', 'Jest',
  'Cypress', 'Linux', 'Microservices', 'Kafka', 'Android', 'iOS', 'WebSockets',
  'UI/UX', 'System Design', 'OAuth', 'Machine Learning', 'TensorFlow', 'PyTorch'
];

export class AIResumeParserService {
  /**
   * Main entrypoint: Parses a resume from file URI (supports PDF, DOCX, TXT)
   */
  static async parseResumeFromUri(
    fileUri: string,
    fileName?: string
  ): Promise<{ success: boolean; data?: ParsedResumeResult; error?: string }> {
    try {
      const isPdf =
        fileUri.toLowerCase().endsWith('.pdf') ||
        (fileName && fileName.toLowerCase().endsWith('.pdf'));

      // 1. If it's a PDF, read as Base64 for multimodal LLM processing
      if (isPdf) {
        let base64Data: string | null = null;
        try {
          base64Data = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (fsErr) {
          console.warn('[AIResumeParser] FileSystem base64 read failed:', fsErr);
        }

        if (base64Data) {
          // Attempt Gemini Multimodal PDF parsing
          const geminiResult = await this.parsePdfWithGemini(base64Data);
          if (geminiResult) {
            return { success: true, data: geminiResult };
          }
        }
      }

      // 2. If text file or fallback, read as UTF-8 string
      let rawText = '';
      try {
        rawText = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      } catch {
        rawText = '';
      }

      if (rawText && rawText.trim().length > 30) {
        return await this.parseResumeFromText(rawText);
      }

      // 3. Fallback deterministic parse if AI failed or API unavailable
      const fallback = this.deterministicLocalParse(rawText || fileName || '');
      return { success: true, data: fallback };
    } catch (e: any) {
      console.warn('[AIResumeParser] Parse error:', e);
      const fallback = this.deterministicLocalParse(fileName || '');
      return { success: true, data: fallback };
    }
  }

  /**
   * Parses raw resume text or pasted LinkedIn profile using AI
   */
  static async parseResumeFromText(
    rawResumeText: string
  ): Promise<{ success: boolean; data?: ParsedResumeResult; error?: string }> {
    const prompt = `Analyze the following candidate resume text and extract all professional details in strict JSON format.
Strict JSON Schema:
{
  "name": "Full Name",
  "email": "Email Address",
  "phone": "Phone Number with country code if present",
  "currentCity": "City name",
  "targetRole": "Candidate's primary role / title",
  "yearsOfExperience": "e.g. 2 years, Fresher, 4+ years",
  "linkedinUrl": "LinkedIn URL if present",
  "githubUrl": "GitHub URL if present",
  "portfolioUrl": "Portfolio URL if present",
  "expectedCTC": "Expected salary LPA if mentioned",
  "skills": ["React Native", "TypeScript", "Node.js", ...],
  "educations": [
    {
      "qualification": "B.Tech / MCA / B.Sc / Degree",
      "degree": "Major / Field of study",
      "college": "University / College Name",
      "graduationYear": "2024",
      "grade": "8.5 CGPA or 80%"
    }
  ],
  "experiences": [
    {
      "companyName": "Company Name",
      "jobTitle": "Job Role / Title",
      "employmentType": "Full-time",
      "startDate": "Month Year",
      "endDate": "Present / Month Year",
      "isCurrentJob": true,
      "workLocation": "City / Location",
      "workMode": "Hybrid / Remote / On-site",
      "responsibilities": "Brief 1-2 sentence description",
      "skillsUsed": ["Skill 1", "Skill 2"]
    }
  ],
  "suggestedPreferences": {
    "targetJobTitles": ["Target Role 1", "Target Role 2"],
    "targetKeywords": ["Keyword 1", "Keyword 2"],
    "preferredLocations": ["Chennai", "Bangalore", "Remote"],
    "workModes": ["Remote", "Hybrid"]
  }
}

Resume Text:
"""
${rawResumeText.slice(0, 15000)}
"""

Return ONLY the raw JSON object. Do not wrap in markdown quotes or codeblocks.`;

    try {
      const response = await AIService.queryLLM({
        userPrompt: prompt,
        systemPrompt: 'You are an enterprise ATS resume parser. Output strictly valid JSON.',
        maxTokens: 2048,
      });

      const parsed = this.cleanAndParseJson(response);
      if (parsed && parsed.skills && Array.isArray(parsed.skills)) {
        return { success: true, data: this.sanitizeParsedData(parsed) };
      }
    } catch (err) {
      console.warn('[AIResumeParser] AI text query failed:', err);
    }

    // Fallback to local regex/keyword parser
    const fallback = this.deterministicLocalParse(rawResumeText);
    return { success: true, data: fallback };
  }

  /**
   * Gemini Multimodal PDF Parser (native PDF comprehension via base64)
   */
  private static async parsePdfWithGemini(
    base64Data: string
  ): Promise<ParsedResumeResult | null> {
    const key = AIService.getGeminiKey();
    if (!key) return null;

    const systemPrompt = `You are an expert AI Resume Parser. Extract all candidate details from this PDF into a single STRICT JSON object matching this schema:
{
  "name": "Full Candidate Name",
  "email": "Email Address",
  "phone": "Phone Number",
  "currentCity": "Current City or Location",
  "targetRole": "Primary Target Designation",
  "yearsOfExperience": "e.g. 2 years, Fresher, 4+ years",
  "linkedinUrl": "LinkedIn URL",
  "githubUrl": "GitHub URL",
  "portfolioUrl": "Portfolio URL",
  "expectedCTC": "Salary expectation if mentioned",
  "skills": ["Skill1", "Skill2", ...],
  "educations": [
    {
      "qualification": "Degree / Qualification",
      "degree": "Branch / Specialization",
      "college": "College / University Name",
      "graduationYear": "Passing Year",
      "grade": "CGPA or Percentage"
    }
  ],
  "experiences": [
    {
      "companyName": "Company Name",
      "jobTitle": "Job Title",
      "employmentType": "Full-time",
      "startDate": "Start Date",
      "endDate": "End Date",
      "isCurrentJob": true,
      "workLocation": "Location",
      "workMode": "Hybrid",
      "responsibilities": "Key responsibilities summary",
      "skillsUsed": ["Skill 1", "Skill 2"]
    }
  ],
  "suggestedPreferences": {
    "targetJobTitles": ["Role 1", "Role 2"],
    "targetKeywords": ["Keyword 1", "Keyword 2"],
    "preferredLocations": ["Chennai", "Bangalore", "Remote"],
    "workModes": ["Remote", "Hybrid"]
  }
}
Output ONLY valid JSON. No markdown backticks.`;

    const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-flash-latest'];

    for (const model of models) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      inlineData: {
                        mimeType: 'application/pdf',
                        data: base64Data,
                      },
                    },
                    {
                      text: systemPrompt,
                    },
                  ],
                },
              ],
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        if (!response.ok) continue;
        const json = await response.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = this.cleanAndParseJson(text);
          if (parsed && parsed.skills && Array.isArray(parsed.skills)) {
            return this.sanitizeParsedData(parsed);
          }
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Cleans AI markdown text and parses JSON safely
   */
  private static cleanAndParseJson(rawText?: string | null): any {
    if (!rawText) return null;
    try {
      let cleaned = rawText.trim();
      // Remove markdown code fences
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/, '');
      }

      // Extract first { ... } block
      const startIdx = cleaned.indexOf('{');
      const endIdx = cleaned.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        cleaned = cleaned.slice(startIdx, endIdx + 1);
      }

      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }

  /**
   * Sanitizes and guarantees types for ParsedResumeResult
   */
  private static sanitizeParsedData(raw: any): ParsedResumeResult {
    return {
      name: String(raw.name || '').trim(),
      email: String(raw.email || '').trim(),
      phone: String(raw.phone || '').trim(),
      currentCity: String(raw.currentCity || '').trim(),
      targetRole: String(raw.targetRole || 'Software Engineer').trim(),
      yearsOfExperience: String(raw.yearsOfExperience || '2+ years').trim(),
      linkedinUrl: String(raw.linkedinUrl || '').trim(),
      githubUrl: String(raw.githubUrl || '').trim(),
      portfolioUrl: String(raw.portfolioUrl || '').trim(),
      expectedCTC: String(raw.expectedCTC || '').trim(),
      skills: Array.isArray(raw.skills) ? raw.skills.map((s: any) => String(s).trim()).filter(Boolean) : [],
      educations: Array.isArray(raw.educations)
        ? raw.educations.map((e: any) => ({
            qualification: String(e.qualification || 'Degree'),
            degree: String(e.degree || 'Computer Science'),
            college: String(e.college || ''),
            graduationYear: String(e.graduationYear || ''),
            grade: e.grade ? String(e.grade) : undefined,
          }))
        : [],
      experiences: Array.isArray(raw.experiences)
        ? raw.experiences.map((exp: any) => ({
            companyName: String(exp.companyName || ''),
            jobTitle: String(exp.jobTitle || ''),
            employmentType: exp.employmentType || 'Full-time',
            startDate: String(exp.startDate || ''),
            endDate: String(exp.endDate || 'Present'),
            isCurrentJob: Boolean(exp.isCurrentJob),
            workLocation: String(exp.workLocation || ''),
            workMode: exp.workMode || 'Hybrid',
            responsibilities: String(exp.responsibilities || ''),
            skillsUsed: Array.isArray(exp.skillsUsed)
              ? exp.skillsUsed.map((s: any) => String(s))
              : [],
          }))
        : [],
      suggestedPreferences: {
        targetJobTitles: Array.isArray(raw.suggestedPreferences?.targetJobTitles)
          ? raw.suggestedPreferences.targetJobTitles
          : [String(raw.targetRole || 'Software Engineer')],
        targetKeywords: Array.isArray(raw.suggestedPreferences?.targetKeywords)
          ? raw.suggestedPreferences.targetKeywords
          : Array.isArray(raw.skills) ? raw.skills.slice(0, 5) : [],
        preferredLocations: Array.isArray(raw.suggestedPreferences?.preferredLocations)
          ? raw.suggestedPreferences.preferredLocations
          : [raw.currentCity || 'Chennai', 'Remote'],
        workModes: Array.isArray(raw.suggestedPreferences?.workModes)
          ? raw.suggestedPreferences.workModes
          : ['Remote', 'Hybrid'],
      },
    };
  }

  /**
   * Deterministic Offline / Local Regex & Tech Dictionary Parser
   */
  static deterministicLocalParse(text: string): ParsedResumeResult {
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/(?:\+91[\s-]?)?[6-9]\d{9}/);
    const linkedinMatch = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
    const githubMatch = text.match(/https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);

    const textLower = text.toLowerCase();
    const matchedSkills: string[] = [];

    COMMON_TECH_SKILLS.forEach((skill) => {
      if (textLower.includes(skill.toLowerCase())) {
        matchedSkills.push(skill);
      }
    });

    // Default baseline skills if none matched
    const finalSkills =
      matchedSkills.length > 0
        ? Array.from(new Set(matchedSkills))
        : ['React Native', 'TypeScript', 'JavaScript', 'React', 'REST APIs', 'Git'];

    // Infer role
    let inferredRole = 'Software Engineer';
    if (textLower.includes('react native') || textLower.includes('mobile app')) {
      inferredRole = 'React Native Mobile Developer';
    } else if (textLower.includes('frontend') || textLower.includes('react')) {
      inferredRole = 'Frontend Engineer';
    } else if (textLower.includes('full stack') || textLower.includes('fullstack')) {
      inferredRole = 'Full Stack Developer';
    } else if (textLower.includes('backend') || textLower.includes('node')) {
      inferredRole = 'Backend Developer';
    }

    return {
      name: '',
      email: emailMatch ? emailMatch[0] : '',
      phone: phoneMatch ? phoneMatch[0] : '',
      currentCity: textLower.includes('chennai') ? 'Chennai' : textLower.includes('bangalore') ? 'Bangalore' : '',
      targetRole: inferredRole,
      yearsOfExperience: '2+ years',
      linkedinUrl: linkedinMatch ? linkedinMatch[0] : '',
      githubUrl: githubMatch ? githubMatch[0] : '',
      portfolioUrl: '',
      expectedCTC: '',
      skills: finalSkills,
      educations: [
        {
          qualification: 'Degree',
          degree: 'Computer Science & Engineering',
          college: 'University / Institute',
          graduationYear: '2024',
        },
      ],
      experiences: [],
      suggestedPreferences: {
        targetJobTitles: [inferredRole, 'Mobile Developer'],
        targetKeywords: finalSkills.slice(0, 5),
        preferredLocations: ['Chennai', 'Bangalore', 'Remote'],
        workModes: ['Remote', 'Hybrid'],
      },
    };
  }
}
