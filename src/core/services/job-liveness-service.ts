export interface LivenessResult {
  isLive: boolean;
  statusText: string;
  vendor: 'Greenhouse' | 'Lever' | 'Ashby' | 'Workday' | 'Direct';
  statusCode?: number;
}

export interface GhostAnalysisResult {
  tier: 'High Confidence' | 'Proceed with Caution' | 'Suspicious';
  trustScore: number; // 0 - 100
  flags: string[];
  recommendation: string;
}

export class JobLivenessService {
  /**
   * Fast zero-token ATS and HTTP liveness checker adapted from career-ops architecture
   */
  static async verifyUrlLiveness(rawUrl: string): Promise<LivenessResult> {
    const trimmed = rawUrl.trim();
    if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
      return {
        isLive: false,
        statusText: 'Invalid URL format',
        vendor: 'Direct',
      };
    }

    try {
      const parsed = new URL(trimmed);

      // 1. Greenhouse ATS URL Check (e.g. https://job-boards.greenhouse.io/gitlab/jobs/8638232002)
      if (
        parsed.hostname.includes('greenhouse.io')
      ) {
        const parts = parsed.pathname.split('/').filter(Boolean);
        const jobsIdx = parts.indexOf('jobs');
        if (jobsIdx > 0 && parts[jobsIdx + 1]) {
          const org = parts[jobsIdx - 1];
          const jobId = parts[jobsIdx + 1];
          const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${org}/jobs/${jobId}`;

          const res = await this.fetchWithTimeout(apiUrl, 5000);
          if (res.status === 200) {
            return { isLive: true, statusText: 'Active & Accepting (Greenhouse Verified)', vendor: 'Greenhouse', statusCode: 200 };
          }
          if (res.status === 404 || res.status === 410) {
            return { isLive: false, statusText: 'Posting Closed / Withdrawn (404)', vendor: 'Greenhouse', statusCode: res.status };
          }
        }
      }

      // 2. Lever ATS URL Check (e.g. https://jobs.lever.co/coalfire/1111-uuid)
      if (parsed.hostname.includes('lever.co')) {
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          const org = parts[0];
          const jobId = parts[1];
          const apiUrl = `https://api.lever.co/v0/postings/${org}/${jobId}`;

          const res = await this.fetchWithTimeout(apiUrl, 5000);
          if (res.status === 200) {
            return { isLive: true, statusText: 'Active & Accepting (Lever Verified)', vendor: 'Lever', statusCode: 200 };
          }
          if (res.status === 404 || res.status === 410) {
            return { isLive: false, statusText: 'Job Closed / Expired (404)', vendor: 'Lever', statusCode: res.status };
          }
        }
      }

      // 3. Generic Web Page Liveness Probe
      const response = await this.fetchWithTimeout(trimmed, 6000);
      if (response.status === 404 || response.status === 410) {
        return { isLive: false, statusText: 'Page Not Found (404 / Expired)', vendor: 'Direct', statusCode: response.status };
      }

      // Sample HTML body to detect standard closure banners
      const text = await response.text();
      const lower = text.toLowerCase();

      const closureSignals = [
        'no longer accepting applications',
        'this job has expired',
        'position has been filled',
        'job is no longer available',
        'posting has expired',
        'this position is closed',
        'vacancy has expired',
      ];

      for (const signal of closureSignals) {
        if (lower.includes(signal)) {
          return {
            isLive: false,
            statusText: `Closed: "${signal}" detected`,
            vendor: 'Direct',
            statusCode: response.status,
          };
        }
      }

      return {
        isLive: true,
        statusText: 'Posting Active (HTTP 200)',
        vendor: 'Direct',
        statusCode: response.status,
      };
    } catch (e: any) {
      return {
        isLive: true, // Fail-open: don't block user if wifi/CORS limits full page read
        statusText: 'Uncertain / Network Protected',
        vendor: 'Direct',
      };
    }
  }

  /**
   * Evaluates ghost job indicators & posting legitimacy signals
   * (Scam checks, fee warnings, unrealistic timelines, vague deliverables)
   */
  static analyzeGhostSignals(
    title: string,
    company: string,
    description: string,
    postedDateStr?: string
  ): GhostAnalysisResult {
    const flags: string[] = [];
    let score = 95; // baseline trust
    const lowerDesc = description.toLowerCase();
    const lowerTitle = title.toLowerCase();

    // 1. Scam / Candidate-Paid Fees Check (Block G Signal 21)
    const feeKeywords = [
      'registration fee', 'training fee', 'processing fee',
      'security deposit', 'pay for equipment', 'crypto payment', 'usdt'
    ];
    if (feeKeywords.some((kw) => lowerDesc.includes(kw))) {
      flags.push('🚨 Critical: Mention of candidate-paid fees or registration deposit detected');
      score -= 50;
    }

    // 2. Suspicious interview platform redirect (Block G Signal 18)
    if (
      (lowerDesc.includes('telegram') || lowerDesc.includes('whatsapp only')) &&
      !lowerDesc.includes('enterprise')
    ) {
      flags.push('⚠️ Recruiter asks to shift interview strictly to Telegram/WhatsApp');
      score -= 25;
    }

    // 3. Stale Posting Age (> 60 days without evergreen marker)
    if (postedDateStr) {
      const postedDate = new Date(postedDateStr);
      if (!isNaN(postedDate.getTime())) {
        const diffDays = Math.floor((Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24));
        const isEvergreen = lowerDesc.includes('ongoing') || lowerDesc.includes('rolling') || lowerDesc.includes('pipeline');

        if (diffDays > 60 && !isEvergreen) {
          flags.push(`⏳ Posting is ${diffDays} days old — may be an unmaintained ghost listing`);
          score -= 15;
        }
      }
    }

    // 4. Vagueness Check (< 40 words or lacks actionable requirements)
    const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 0 && wordCount < 30) {
      flags.push('📝 Extremely brief job description (< 30 words) with missing deliverable clarity');
      score -= 15;
    }

    // 5. Positive Legitimacy Signals
    const positiveSignals = [
      'greenhouse.io', 'lever.co', 'workday', 'ashby', 'bamboohr', 'smartrecruiters',
      'health insurance', 'provident fund', 'epf', '401k', 'equity', 'pto'
    ];
    if (positiveSignals.some((sig) => lowerDesc.includes(sig) || company.toLowerCase().includes(sig))) {
      score = Math.min(100, score + 5);
    }

    // Determine Tier
    let tier: GhostAnalysisResult['tier'] = 'High Confidence';
    let recommendation = 'Real, active opening. Safe to tailor and submit your application.';

    if (score < 60) {
      tier = 'Suspicious';
      recommendation = 'High risk of fake posting, fee scam, or inactive listing. Investigate company domain before investing time.';
    } else if (score < 80 || flags.length > 0) {
      tier = 'Proceed with Caution';
      recommendation = 'Some mixed signals observed. Verify the role on the official company careers page.';
    }

    return {
      tier,
      trustScore: Math.max(10, Math.min(100, score)),
      flags,
      recommendation,
    };
  }

  private static fetchWithTimeout(url: string, ms = 5000): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal })
      .finally(() => clearTimeout(timeout));
  }
}

