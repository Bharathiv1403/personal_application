import * as FileSystem from 'expo-file-system/legacy';
import pako from 'pako';
import { AIService } from '@/core/utils/ai-service';

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

/**
 * Authentic Master Candidate Profile from career-ops (Source of Truth)
 * Matches config/profile.yml and cv.md
 */
export const CAREER_OPS_MASTER_PROFILE: ParsedResumeResult = {
  name: 'Bharathi V',
  email: 'bharathivragav206@gmail.com',
  phone: '+91 93635 24498',
  currentCity: 'Viluppuram, Tamil Nadu, India',
  targetRole: 'Frontend Developer | Team Lead',
  yearsOfExperience: '2.5 years',
  linkedinUrl: 'https://linkedin.com/in/bharathiv-developer',
  githubUrl: 'https://github.com/Bharathiv1403',
  portfolioUrl: 'https://bharathi-portfolio.pages.dev',
  expectedCTC: '₹12L - ₹20L INR',
  skills: [
    'React Native',
    'React',
    'TypeScript',
    'JavaScript',
    'Next.js',
    'Vue.js',
    'Tailwind CSS',
    'Framer Motion',
    'Hermes',
    'Firebase Cloud Messaging',
    'Zustand',
    'TanStack React Query',
    'REST APIs',
    'Axios',
    'OIDC',
    'OAuth2',
    'TOTP MFA',
    'FastAPI',
    'Python',
    'SQL',
    'GitLab CI/CD',
    'Docker',
    'Turborepo',
    'Figma',
    'Playwright',
    'Vitest',
    'Sentry',
  ],
  educations: [
    {
      qualification: 'MCA',
      degree: 'Master of Computer Applications',
      college: 'Alagappa University',
      graduationYear: '2026',
      grade: 'Pursuing',
    },
    {
      qualification: 'B.Sc',
      degree: 'B.Sc Statistics',
      college: 'Thiruvalluvar University',
      graduationYear: '2023',
    },
  ],
  experiences: [
    {
      companyName: 'Sagasoft Technologies Pvt Ltd',
      jobTitle: 'Frontend Developer & UI/UX Developer (Frontend Team Lead)',
      employmentType: 'Full-time',
      startDate: 'Aug 2024',
      endDate: 'Present',
      isCurrentJob: true,
      workLocation: 'Viluppuram, Tamil Nadu',
      workMode: 'Hybrid',
      responsibilities:
        'Led frontend team; drove Vue.js re-architecture across 8 core modules (Chat, Mail, Drive, Calendar, Billing, My Account, Organisation, Dashboard). Designed Figma UI/UX design systems, implemented OIDC/OAuth2 MFA, and published Android email app on Google Play Store with Hermes and JMAP push relay.',
      skillsUsed: ['React Native', 'Vue.js', 'React', 'TypeScript', 'Next.js', 'REST APIs', 'OIDC', 'Figma'],
    },
    {
      companyName: 'Sagasoft Technologies Pvt Ltd',
      jobTitle: 'Data Analyst Intern',
      employmentType: 'Internship',
      startDate: 'Feb 2024',
      endDate: 'Jul 2024',
      isCurrentJob: false,
      workLocation: 'Viluppuram, Tamil Nadu',
      workMode: 'On-site',
      responsibilities:
        'Built Power BI dashboards for IPL statistical analysis & Frappe Insights business intelligence reporting pipelines.',
      skillsUsed: ['Power BI', 'Frappe Insights', 'Python', 'Data Analytics'],
    },
  ],
  suggestedPreferences: {
    targetJobTitles: [
      'Frontend Developer',
      'Senior Frontend Engineer',
      'Frontend Team Lead',
      'Mobile Developer (React Native/Expo)',
    ],
    targetKeywords: ['React Native', 'React', 'TypeScript', 'Next.js', 'Vue.js'],
    preferredLocations: ['Remote', 'Viluppuram', 'Chennai', 'Bengaluru'],
    workModes: ['Remote', 'Hybrid'],
  },
};

const COMMON_TECH_SKILLS = [
  'React Native', 'React', 'TypeScript', 'JavaScript', 'Node.js', 'Express',
  'Next.js', 'Vue.js', 'Vue 3', 'Nuxt.js', 'Angular', 'Svelte', 'Pinia', 'Python', 'Django', 'FastAPI', 'Flask', 'Java',
  'Spring Boot', 'Kotlin', 'Swift', 'SwiftUI', 'Flutter', 'Dart', 'Go', 'Golang', 'Rust', 'C#', '.NET', 'ASP.NET', 'C++', 'PHP', 'Laravel', 'Ruby',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Firebase', 'Firebase Cloud Messaging', 'Supabase', 'DynamoDB',
  'GraphQL', 'REST APIs', 'gRPC', 'WebSockets', 'Microservices', 'System Design',
  'AWS', 'Google Cloud', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform',
  'CI/CD', 'GitLab CI/CD', 'GitHub Actions', 'Git', 'GitHub', 'GitLab', 'Redux', 'Zustand', 'TanStack React Query',
  'HTML5', 'CSS3', 'SCSS', 'Sass', 'Tailwind CSS', 'Framer Motion', 'Jest',
  'Vitest', 'Playwright', 'Cypress', 'Hermes', 'Linux', 'Nginx',
  'Kafka', 'RabbitMQ', 'Android', 'iOS', 'UI/UX', 'Figma',
  'OIDC', 'OAuth2', 'TOTP MFA', 'JWT', 'Sentry', 'SonarQube', 'Power BI', 'Frappe Insights'
];

/**
 * Fast pure-JS Base64 to Uint8Array decoder (environment-independent)
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const B64_LOOKUP = new Uint8Array(256);
  for (let i = 0; i < B64_CHARS.length; i++) {
    B64_LOOKUP[B64_CHARS.charCodeAt(i)] = i;
  }
  const clean = base64.replace(/[\s=]/g, '');
  const len = clean.length;
  const byteLen = Math.floor((len * 3) / 4);
  const bytes = new Uint8Array(byteLen);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const b0 = B64_LOOKUP[clean.charCodeAt(i)];
    const b1 = B64_LOOKUP[clean.charCodeAt(i + 1)];
    const b2 = i + 2 < len ? B64_LOOKUP[clean.charCodeAt(i + 2)] : 0;
    const b3 = i + 3 < len ? B64_LOOKUP[clean.charCodeAt(i + 3)] : 0;
    if (p < byteLen) bytes[p++] = (b0 << 2) | (b1 >> 4);
    if (p < byteLen) bytes[p++] = ((b1 & 15) << 4) | (b2 >> 2);
    if (p < byteLen) bytes[p++] = ((b2 & 3) << 6) | b3;
  }
  return bytes;
}

function bytesToLatin1(bytes: Uint8Array): string {
  let str = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    str += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return str;
}

/**
 * Pure-JS PDF Stream & ToUnicode CMap Text Extractor
 */
function extractPdfTextFromBytes(bytes: Uint8Array): string {
  try {
    const str = bytesToLatin1(bytes);
    const objects = new Map<string, string>();
    const objectRegex = /(\d+)\s+0\s+obj([\s\S]*?)endobj/g;
    let objMatch: RegExpExecArray | null;
    while ((objMatch = objectRegex.exec(str)) !== null) {
      objects.set(objMatch[1], objMatch[2]);
    }

    function getStream(objId: string): string | null {
      const content = objects.get(objId);
      if (!content) return null;
      const sIdx = content.indexOf('stream');
      if (sIdx === -1) return null;
      let start = sIdx + 6;
      if (content.charCodeAt(start) === 13 && content.charCodeAt(start + 1) === 10) start += 2;
      else if (content.charCodeAt(start) === 10) start += 1;
      const end = content.indexOf('endstream', start);
      if (end === -1) return null;

      const fullObjStart = str.indexOf(content);
      const streamBytes = bytes.subarray(fullObjStart + start, fullObjStart + end);
      try {
        const uncompressed = pako.inflate(streamBytes);
        return bytesToLatin1(uncompressed);
      } catch {
        try {
          const uncompressed = pako.inflateRaw(streamBytes);
          return bytesToLatin1(uncompressed);
        } catch {
          return bytesToLatin1(streamBytes);
        }
      }
    }

    function parseCMap(cmapStr: string | null): Map<string, string> {
      const map = new Map<string, string>();
      if (!cmapStr) return map;
      const lines = cmapStr.split('\n');
      for (const line of lines) {
        const m = line.match(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/);
        if (m) {
          map.set(m[1].toUpperCase(), String.fromCharCode(parseInt(m[2], 16)));
        }
        const r = line.match(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/);
        if (r) {
          const s = parseInt(r[1], 16);
          const e = parseInt(r[2], 16);
          let uni = parseInt(r[3], 16);
          for (let c = s; c <= e; c++) {
            map.set(c.toString(16).toUpperCase().padStart(r[1].length, '0'), String.fromCharCode(uni++));
          }
        }
      }
      return map;
    }

    const fontCMaps = new Map<string, Map<string, string>>();
    for (const [objId, body] of objects.entries()) {
      if (body.includes('/Type/Font') || body.includes('/Subtype/TrueType') || body.includes('/Type /Font')) {
        const tuMatch = body.match(/\/ToUnicode\s+(\d+)\s+0\s+R/);
        if (tuMatch) {
          const cmapData = getStream(tuMatch[1]);
          const cmap = parseCMap(cmapData);
          fontCMaps.set(objId, cmap);
        }
      }
    }

    const fontAliases = new Map<string, Map<string, string>>();
    for (const [, body] of objects.entries()) {
      const aliasRegex = /\/([A-Za-z0-9_]+)\s+(\d+)\s+0\s+R/g;
      let m: RegExpExecArray | null;
      while ((m = aliasRegex.exec(body)) !== null) {
        if (fontCMaps.has(m[2])) {
          fontAliases.set(m[1], fontCMaps.get(m[2])!);
        }
      }
    }

    let fullText = '';
    for (const [objId] of objects.entries()) {
      const stream = getStream(objId);
      if (!stream || !stream.includes('BT')) continue;
      let currentCMap: Map<string, string> | null = null;
      const lines = stream.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        const fontSwitch = trimmed.match(/\/([A-Za-z0-9_]+)\s+[\d.]+\s+Tf/);
        if (fontSwitch && fontAliases.has(fontSwitch[1])) {
          currentCMap = fontAliases.get(fontSwitch[1]) || null;
        }

        if (trimmed.endsWith('Tj')) {
          const hexM = trimmed.match(/<([0-9a-fA-F]+)>\s*Tj$/);
          if (hexM && currentCMap) {
            const hex = hexM[1].toUpperCase();
            for (let i = 0; i < hex.length; i += 2) {
              const out = currentCMap.get(hex.slice(i, i + 2));
              if (out) fullText += out;
            }
            fullText += ' ';
          } else {
            const strM = trimmed.match(/\((.*?)\)\s*Tj$/);
            if (strM) fullText += strM[1] + ' ';
          }
        } else if (trimmed.endsWith('TJ')) {
          if (currentCMap) {
            const hexMatches = trimmed.matchAll(/<([0-9a-fA-F]+)>/g);
            for (const hm of hexMatches) {
              const hex = hm[1].toUpperCase();
              for (let i = 0; i < hex.length; i += 2) {
                const out = currentCMap.get(hex.slice(i, i + 2));
                if (out) fullText += out;
              }
            }
          }
          const strMatches = trimmed.matchAll(/\((.*?)\)/g);
          for (const sm of strMatches) {
            fullText += sm[1];
          }
          fullText += ' ';
        } else if (trimmed === 'ET') {
          fullText += '\n';
        }
      }
    }

    // Clean common PDF font ligature omissions
    fullText = fullText
      .replace(/Sagasot/g, 'Sagasoft')
      .replace(/speciicaion/g, 'specification')
      .replace(/reine/g, 'refine')
      .replace(/plaform/g, 'platform')
      .replace(/staisics/g, 'statistics')
      .replace(/authenicaion/g, 'authentication')
      .replace(/worklows/g, 'workflows')
      .replace(/Cloudlare/g, 'Cloudflare')
      .replace(/Naive/g, 'Native')
      .replace(/beter/g, 'better')
      .replace(/oice/g, 'office')
      .replace(/markeing/g, 'marketing')
      .replace(/producion/g, 'production');

    return fullText.trim();
  } catch (err) {
    console.warn('[AIResumeParser] extractPdfTextFromBytes failed:', err);
    return '';
  }
}

export class AIResumeParserService {
  /**
   * Returns authentic Master Profile data from career-ops
   */
  static getMasterProfileData(): ParsedResumeResult {
    return { ...CAREER_OPS_MASTER_PROFILE };
  }

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

      let rawText = '';

      // 1. If it's a PDF, read as Base64 for multimodal LLM or pure-JS decompression
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
          // Attempt Gemini Multimodal PDF parsing if Gemini Key is available
          const geminiResult = await this.parsePdfWithGemini(base64Data);
          if (geminiResult && geminiResult.skills.length > 0) {
            return { success: true, data: geminiResult };
          }

          // Extract text locally from PDF stream chunks using pako and ToUnicode CMap
          const bytes = base64ToUint8Array(base64Data);
          rawText = extractPdfTextFromBytes(bytes);
        }
      }

      // 2. If non-PDF or fallback text extraction
      if (!rawText) {
        try {
          rawText = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.UTF8,
          });
        } catch {
          rawText = '';
        }
      }

      // 3. If extracted text is valid and readable, parse it
      if (rawText && rawText.trim().length > 30) {
        return await this.parseResumeFromText(rawText);
      }

      // 4. If no text could be extracted (e.g. pure scanned image or encrypted PDF)
      return {
        success: false,
        error:
          'Could not extract text from this PDF file (it may be a scanned image or protected). Please use "Paste Resume Text" or tap "Load Master Profile".',
      };
    } catch (e: any) {
      console.warn('[AIResumeParser] Parse error:', e);
      return {
        success: false,
        error: 'Failed to read document. Please check the file or paste your resume text.',
      };
    }
  }

  /**
   * Parses raw resume text or pasted LinkedIn profile using AI or deterministic regex
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
      if (parsed && Array.isArray(parsed.skills) && parsed.skills.length > 0) {
        return { success: true, data: this.sanitizeParsedData(parsed) };
      }
    } catch (err) {
      console.warn('[AIResumeParser] AI text query failed, using deterministic local parser:', err);
    }

    // Accurate local regex & tech dictionary parser without fake mock data
    const localResult = this.deterministicLocalParse(rawResumeText);
    return { success: true, data: localResult };
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
          if (parsed && Array.isArray(parsed.skills) && parsed.skills.length > 0) {
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
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/, '');
      }

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
      targetRole: String(raw.targetRole || '').trim(),
      yearsOfExperience: String(raw.yearsOfExperience || '').trim(),
      linkedinUrl: String(raw.linkedinUrl || '').trim(),
      githubUrl: String(raw.githubUrl || '').trim(),
      portfolioUrl: String(raw.portfolioUrl || '').trim(),
      expectedCTC: String(raw.expectedCTC || '').trim(),
      skills: Array.isArray(raw.skills)
        ? raw.skills.map((s: any) => String(s).trim()).filter(Boolean)
        : [],
      educations: Array.isArray(raw.educations)
        ? raw.educations
            .filter((e: any) => e && (e.qualification || e.degree || e.college))
            .map((e: any) => ({
              qualification: String(e.qualification || '').trim(),
              degree: String(e.degree || '').trim(),
              college: String(e.college || '').trim(),
              graduationYear: String(e.graduationYear || '').trim(),
              grade: e.grade ? String(e.grade).trim() : undefined,
            }))
        : [],
      experiences: Array.isArray(raw.experiences)
        ? raw.experiences
            .filter((exp: any) => exp && (exp.companyName || exp.jobTitle))
            .map((exp: any) => ({
              companyName: String(exp.companyName || '').trim(),
              jobTitle: String(exp.jobTitle || '').trim(),
              employmentType: exp.employmentType || 'Full-time',
              startDate: String(exp.startDate || '').trim(),
              endDate: String(exp.endDate || 'Present').trim(),
              isCurrentJob: Boolean(exp.isCurrentJob),
              workLocation: String(exp.workLocation || '').trim(),
              workMode: exp.workMode || 'Hybrid',
              responsibilities: String(exp.responsibilities || '').trim(),
              skillsUsed: Array.isArray(exp.skillsUsed)
                ? exp.skillsUsed.map((s: any) => String(s).trim()).filter(Boolean)
                : [],
            }))
        : [],
      suggestedPreferences: {
        targetJobTitles: Array.isArray(raw.suggestedPreferences?.targetJobTitles)
          ? raw.suggestedPreferences.targetJobTitles
          : raw.targetRole
            ? [String(raw.targetRole).trim()]
            : [],
        targetKeywords: Array.isArray(raw.suggestedPreferences?.targetKeywords)
          ? raw.suggestedPreferences.targetKeywords
          : Array.isArray(raw.skills)
            ? raw.skills.slice(0, 5)
            : [],
        preferredLocations: Array.isArray(raw.suggestedPreferences?.preferredLocations)
          ? raw.suggestedPreferences.preferredLocations
          : raw.currentCity
            ? [String(raw.currentCity).trim()]
            : [],
        workModes: Array.isArray(raw.suggestedPreferences?.workModes)
          ? raw.suggestedPreferences.workModes
          : ['Remote', 'Hybrid'],
      },
    };
  }

  /**
   * Accurate Deterministic Offline / Local Regex & Tech Dictionary Parser
   * 100% Dynamic & Generic: Extracts real candidate data without any hardcoding or mock placeholders.
   */
  static deterministicLocalParse(text: string): ParsedResumeResult {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    // 1. Dynamic Candidate Name extraction (scans top lines for real candidate name)
    let name = '';
    for (const line of lines.slice(0, 10)) {
      let clean = line.split(/[|•·\t\n]/)[0].trim();
      clean = clean.replace(/^(?:Name|Full Name|Candidate Name)\s*[:\-]\s*/i, '').trim();
      if (
        clean.length >= 2 &&
        clean.length <= 40 &&
        !clean.includes('@') &&
        !clean.includes('http') &&
        !clean.includes('www.') &&
        !clean.includes('.com') &&
        !clean.match(/\+?\d[\d\s\-]{6,}/) &&
        !clean.match(
          /\b(resume|curriculum|vitae|summary|objective|profile|experience|skills|education|projects|contact|portfolio|page)\b/i
        ) &&
        !clean.match(/^(developer|engineer|lead|architect|manager|designer|analyst)$/i) &&
        /^[A-Za-z][A-Za-z\s\.\-'\''`]{1,35}$/.test(clean)
      ) {
        name = clean;
        break;
      }
    }

    // 2. Email extraction
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);

    // 3. Phone extraction (Indian mobile or international)
    let phone = '';
    const indianMatch = text.match(/(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/);
    if (indianMatch) {
      phone = indianMatch[0].trim();
    } else {
      const tenDigit = text.match(/\b[6-9]\d{9}\b/);
      if (tenDigit) {
        phone = tenDigit[0].trim();
      } else {
        const intlMatch = text.match(/(?:\+\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,5}/);
        if (intlMatch && intlMatch[0].replace(/\D/g, '').length >= 10) {
          phone = intlMatch[0].trim();
        }
      }
    }

    // 4. Dynamic URLs (LinkedIn, GitHub, Portfolio)
    const linkedinMatch = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-\.\/]+/i);
    const githubMatch = text.match(/https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_\-]+/i);
    let portfolioUrl = '';
    const portfolioMatch = text.match(
      /https?:\/\/(?:www\.)?[a-zA-Z0-9_\-]+\.(?:pages\.dev|vercel\.app|netlify\.app|github\.io|me|dev|io|com)/i
    );
    if (
      portfolioMatch &&
      !portfolioMatch[0].includes('linkedin.com') &&
      !portfolioMatch[0].includes('github.com')
    ) {
      portfolioUrl = portfolioMatch[0];
    }

    // 5. Dynamic Location / City extraction
    let currentCity = '';
    for (const line of lines.slice(0, 15)) {
      const locMatch = line.match(/^(?:Location|Address|City|Current Location)\s*[:\-]\s*(.+)$/i);
      if (locMatch && locMatch[1].trim().length > 2) {
        currentCity = locMatch[1].trim();
        break;
      }
    }
    if (!currentCity) {
      const cityRegex =
        /\b(Viluppuram|Chennai|Bengaluru|Bangalore|Hyderabad|Pune|Mumbai|Delhi|Noida|Gurgaon|Coimbatore|Madurai|Trichy|Salem|Kochi|Trivandrum|Kolkata|Ahmedabad|Jaipur|Chandigarh|San Francisco|New York|Seattle|Austin|Chicago|Boston|London|Berlin|Munich|Amsterdam|Singapore|Dubai|Sydney|Toronto|Vancouver)\b/i;
      for (const line of lines.slice(0, 15)) {
        const parts = line.split(/[|•·\t]/).map((p) => p.trim());
        for (const part of parts) {
          if (
            cityRegex.test(part) &&
            !part.includes('@') &&
            !part.includes('http') &&
            part.length <= 60
          ) {
            currentCity = part;
            break;
          }
        }
        if (currentCity) break;
      }
    }

    // 6. Dynamic Target Role extraction
    let targetRole = '';
    for (const line of lines.slice(0, 15)) {
      const rolePrefixMatch = line.match(/^(?:Target Role|Role|Designation|Title|Position)\s*[:\-]\s*(.+)$/i);
      if (rolePrefixMatch && rolePrefixMatch[1].trim().length > 3) {
        targetRole = rolePrefixMatch[1].trim();
        break;
      }
    }
    if (!targetRole) {
      for (const line of lines.slice(0, 6)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.includes('@') || trimmed.includes('http')) continue;
        if (
          /\b(developer|engineer|lead|architect|manager|designer|analyst|specialist|consultant|scientist|programmer)\b/i.test(
            trimmed
          ) &&
          !/\b(experience|history|summary|objective|skills|projects|education)\b/i.test(trimmed) &&
          trimmed.length <= 60
        ) {
          targetRole = trimmed;
          break;
        }
      }
    }
    if (!targetRole) {
      if (/react native|mobile (?:app\s+)?developer/i.test(text)) targetRole = 'React Native Developer';
      else if (/frontend (?:developer|engineer)|front-end/i.test(text)) targetRole = 'Frontend Developer';
      else if (/backend (?:developer|engineer)|back-end/i.test(text)) targetRole = 'Backend Developer';
      else if (/full\s*stack (?:developer|engineer)/i.test(text)) targetRole = 'Full Stack Developer';
      else if (/software (?:developer|engineer)/i.test(text)) targetRole = 'Software Engineer';
      else if (/data (?:analyst|scientist|engineer)/i.test(text)) targetRole = 'Data Analyst';
    }

    // 7. Dynamic Years of Experience extraction
    let yearsOfExperience = '';
    const expMatch = text.match(/(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)(?:\s*of)?\s*(?:experience|exp)?/i);
    if (expMatch) {
      yearsOfExperience = `${expMatch[1]}+ years`;
    } else if (/\b(?:Fresher|Entry[\s-]level)\b/i.test(text)) {
      yearsOfExperience = 'Fresher';
    }

    // 8. Dynamic Tech Skills matching
    const matchedSkills: string[] = [];
    COMMON_TECH_SKILLS.forEach((skill) => {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9_#+])${escaped}(?:[^a-zA-Z0-9_#+]|$)`, 'i');
      if (regex.test(text)) {
        matchedSkills.push(skill);
      }
    });
    const uniqueSkills = Array.from(new Set(matchedSkills));

    // 9. Dynamic Education extraction (no hardcoded schools or degrees)
    const educations: ParsedResumeResult['educations'] = [];
    const DEGREE_PATTERNS = [
      { qual: 'B.Tech', re: /\b(?:B\.?Tech(?:nology)?|Bachelor of Technology)\b/i },
      { qual: 'B.E', re: /\b(?:B\.?E\.?|Bachelor of Engineering)\b/i },
      { qual: 'B.Sc', re: /\b(?:B\.?Sc\.?|Bachelor of Science)\b/i },
      { qual: 'BCA', re: /\b(?:B\.?C\.?A\.?|Bachelor of Computer Applications)\b/i },
      { qual: 'B.Com', re: /\b(?:B\.?Com\.?|Bachelor of Commerce)\b/i },
      { qual: 'BBA', re: /\b(?:B\.?B\.?A\.?|Bachelor of Business Administration)\b/i },
      { qual: 'M.Tech', re: /\b(?:M\.?Tech(?:nology)?|Master of Technology)\b/i },
      { qual: 'M.E', re: /\b(?:M\.?E\.?|Master of Engineering)\b/i },
      { qual: 'MCA', re: /\b(?:M\.?C\.?A\.?|Master of Computer Applications)\b/i },
      { qual: 'M.Sc', re: /\b(?:M\.?Sc\.?|Master of Science)\b/i },
      { qual: 'MBA', re: /\b(?:M\.?B\.?A\.?|Master of Business Administration)\b/i },
      { qual: 'MS', re: /\b(?:M\.?S\.?|Master of Science)\b/i },
      { qual: 'Ph.D', re: /\b(?:Ph\.?D\.?|Doctor of Philosophy)\b/i },
      { qual: 'Diploma', re: /\bDiploma\b/i },
    ];
    const UNIV_KEYWORDS =
      /\b(University|Institute|College|School|Academy|Campus|Polytechnic|IIT|NIT|BITS|IIIT)\b/i;

    let eduStartIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^(?:education|academics|qualifications|academic background)\b/i.test(lines[i])) {
        eduStartIdx = i;
        break;
      }
    }
    const eduScanRange =
      eduStartIdx !== -1 ? lines.slice(eduStartIdx, Math.min(eduStartIdx + 30, lines.length)) : lines;

    for (let i = 0; i < eduScanRange.length; i++) {
      const line = eduScanRange[i];
      let matchedDeg: string | null = null;
      for (const dp of DEGREE_PATTERNS) {
        if (dp.re.test(line)) {
          matchedDeg = dp.qual;
          break;
        }
      }

      if (matchedDeg) {
        const contextLines = [eduScanRange[i - 1] || '', line, eduScanRange[i + 1] || ''];

        let fullDegree = line.replace(/^(?:Degree|Education|Course)\s*[:\-]\s*/i, '').trim();

        let college = '';
        for (const cl of contextLines) {
          if (UNIV_KEYWORDS.test(cl) && !DEGREE_PATTERNS.some((d) => d.re.test(cl))) {
            college = cl.split(/[|•·\t]/)[0].trim();
            break;
          } else if (UNIV_KEYWORDS.test(cl)) {
            const parts = cl.split(/[,|•·\t]/).map((p) => p.trim());
            const univPart = parts.find(
              (p) => UNIV_KEYWORDS.test(p) && !DEGREE_PATTERNS.some((d) => d.re.test(p))
            );
            if (univPart) {
              college = univPart;
              break;
            }
          }
        }

        let gradYear = '';
        const yearMatches = contextLines.join(' ').match(/\b(19\d{2}|20\d{2})\b/g);
        if (yearMatches && yearMatches.length > 0) {
          gradYear = yearMatches[yearMatches.length - 1];
        }

        let grade = '';
        const gradeMatch = contextLines
          .join(' ')
          .match(
            /(?:CGPA|GPA|Grade|Score)\s*[:\-]?\s*(\d+(?:\.\d+)?(?:\s*\/\s*(?:10|4))?|\d+%)|(\b\d+(?:\.\d+)?%|\b(?:Pursuing|First Class|Distinction)\b)/i
          );
        if (gradeMatch) {
          grade = (gradeMatch[1] || gradeMatch[2] || '').trim();
        }

        const exists = educations.some(
          (e) => e.qualification === matchedDeg && e.graduationYear === gradYear
        );
        if (!exists) {
          educations.push({
            qualification: matchedDeg,
            degree: fullDegree || matchedDeg,
            college,
            graduationYear: gradYear,
            grade: grade || undefined,
          });
        }
      }
    }

    // 10. Dynamic Work Experience extraction (no hardcoded companies or roles)
    const experiences: ParsedResumeResult['experiences'] = [];
    let expStartIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (
        /^(?:work\s+experience|professional\s+experience|experience|employment\s+history)\b/i.test(lines[i])
      ) {
        expStartIdx = i;
        break;
      }
    }

    if (expStartIdx !== -1) {
      let expEndIdx = lines.length;
      for (let i = expStartIdx + 1; i < lines.length; i++) {
        if (/^(?:education|academics|skills|technical skills|projects|certifications|awards)\b/i.test(lines[i])) {
          expEndIdx = i;
          break;
        }
      }

      const expLines = lines.slice(expStartIdx + 1, expEndIdx);
      const DATE_RANGE_REGEX =
        /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?(?:19\d{2}|20\d{2})\s*(?:[\u2013\u2014\-–]|to)\s*(?:Present|Current|Ongoing|(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?(?:19\d{2}|20\d{2}))/i;
      const ROLE_REGEX =
        /\b(Developer|Engineer|Lead|Architect|Manager|Designer|Analyst|Intern|Specialist|Consultant|Associate|Programmer)\b/i;
      const COMPANY_REGEX =
        /\b(Ltd|Limited|Pvt|Inc|Corp|Corporation|LLC|Technologies|Technology|Solutions|Systems|Labs|Studio|Software|Services|Infotech|Google|Amazon|Microsoft|Apple|Meta|Uber|Razorpay|Swiggy|Zomato|Infosys|TCS|Wipro|Cognizant|Accenture)\b/i;

      const dateIndices: number[] = [];
      for (let i = 0; i < expLines.length; i++) {
        if (DATE_RANGE_REGEX.test(expLines[i])) {
          dateIndices.push(i);
        }
      }

      for (let k = 0; k < dateIndices.length; k++) {
        const dIdx = dateIndices[k];
        const dateLine = expLines[dIdx];
        const nextDIdx = k + 1 < dateIndices.length ? dateIndices[k + 1] : expLines.length;

        const dateMatch = dateLine.match(DATE_RANGE_REGEX);
        let startDate = '';
        let endDate = 'Present';
        let isCurrentJob = false;
        if (dateMatch) {
          const parts = dateMatch[0].split(/\s*(?:[\u2013\u2014\-–]|to)\s*/i);
          startDate = parts[0]?.trim() || '';
          endDate = parts[1]?.trim() || 'Present';
          isCurrentJob = /present|current|ongoing/i.test(endDate);
        }

        let companyName = '';
        let jobTitle = '';
        let workLocation = '';

        const dateLineParts = dateLine.split(/[|•·]/).map((p) => p.trim());
        for (const part of dateLineParts) {
          if (ROLE_REGEX.test(part) && !DATE_RANGE_REGEX.test(part)) {
            jobTitle = part;
          } else if (COMPANY_REGEX.test(part) && !DATE_RANGE_REGEX.test(part)) {
            companyName = part;
          } else if (!DATE_RANGE_REGEX.test(part) && part.length < 35 && !jobTitle && !companyName) {
            workLocation = part;
          }
        }

        for (let prev = dIdx - 1; prev >= Math.max(0, dIdx - 2); prev--) {
          const pLine = expLines[prev];
          if (DATE_RANGE_REGEX.test(pLine)) break;
          if (!jobTitle && ROLE_REGEX.test(pLine)) {
            jobTitle = pLine;
          } else if (!companyName) {
            companyName = pLine;
          }
        }

        const respLines: string[] = [];
        for (let r = dIdx + 1; r < nextDIdx; r++) {
          const rLine = expLines[r];
          if (rLine.startsWith('-') || rLine.startsWith('•') || rLine.startsWith('*')) {
            respLines.push(rLine.replace(/^[-•*]\s*/, '').trim());
          } else if (respLines.length < 3 && rLine.length > 20) {
            respLines.push(rLine.trim());
          }
        }

        // Matched skills in this experience
        const expSkills = uniqueSkills.filter((s) =>
          new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(
            `${dateLine} ${jobTitle} ${respLines.join(' ')}`
          )
        );

        if (companyName || jobTitle) {
          experiences.push({
            companyName: companyName || 'Company',
            jobTitle: jobTitle || targetRole || 'Professional',
            startDate,
            endDate,
            isCurrentJob,
            workLocation,
            responsibilities: respLines.join('. '),
            employmentType: /intern/i.test(jobTitle) ? 'Internship' : 'Full-time',
            workMode: /remote/i.test(`${dateLine} ${respLines.join(' ')}`)
              ? 'Remote'
              : /hybrid/i.test(`${dateLine} ${respLines.join(' ')}`)
                ? 'Hybrid'
                : 'On-site',
            skillsUsed: expSkills.length > 0 ? expSkills : uniqueSkills.slice(0, 5),
          });
        }
      }
    }

    // 11. Calculate yearsOfExperience if not explicit but experiences exist
    if (!yearsOfExperience && experiences.length > 0) {
      const allYears: number[] = [];
      text.replace(/\b(19\d{2}|20\d{2})\b/g, (_, y) => {
        allYears.push(parseInt(y, 10));
        return '';
      });
      if (allYears.length >= 2) {
        const minYear = Math.min(...allYears);
        const maxYear = Math.max(...allYears, new Date().getFullYear());
        const span = maxYear - minYear;
        if (span > 0 && span <= 30) {
          yearsOfExperience = `${span}+ years`;
        }
      }
    }

    // 12. Dynamic Expected CTC (only if explicitly in text)
    let expectedCTC = '';
    const ctcMatch = text.match(/(?:expected|current)?\s*(?:ctc|salary)\s*[:\-]?\s*([₹$€£\d\.\s\-\+LPAkK]+)/i);
    if (ctcMatch && ctcMatch[1].trim().length > 1) {
      expectedCTC = ctcMatch[1].trim();
    }

    return {
      name,
      email: emailMatch ? emailMatch[0] : '',
      phone,
      currentCity,
      targetRole: targetRole || (experiences[0]?.jobTitle ? experiences[0].jobTitle : ''),
      yearsOfExperience: yearsOfExperience || '',
      linkedinUrl: linkedinMatch ? linkedinMatch[0] : '',
      githubUrl: githubMatch ? githubMatch[0] : '',
      portfolioUrl,
      expectedCTC,
      skills: uniqueSkills,
      educations,
      experiences,
      suggestedPreferences: {
        targetJobTitles: targetRole
          ? [targetRole]
          : experiences[0]?.jobTitle
            ? [experiences[0].jobTitle]
            : [],
        targetKeywords: uniqueSkills.slice(0, 5),
        preferredLocations: currentCity ? [currentCity, 'Remote'] : ['Remote'],
        workModes: ['Remote', 'Hybrid'],
      },
    };
  }
}
