export interface DiscoveredJobItem {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  tags: string[];
  matchScore: number;
  stage: 'wishlist' | 'applied' | 'assessment' | 'interview' | 'offer' | 'rejected';
  appliedDate: string;
  source: 'Greenhouse' | 'Lever' | 'Ashby' | 'RemoteOK' | 'Arbeitnow' | 'Jobicy' | 'CareerPilot';
  salary?: string;
  seniority?: 'entry' | 'mid' | 'senior' | 'lead';
  workplaceType?: 'remote' | 'hybrid' | 'onsite';
}

export interface PortalScanOptions {
  positiveKeywords?: string[];
  negativeKeywords?: string[];
  seniorityTier?: 'all' | 'entry' | 'mid' | 'senior' | 'lead';
  workMode?: 'all' | 'remote' | 'hybrid' | 'onsite';
}

export interface AtsCompanyPreset {
  name: string;
  slug: string;
  ats: 'Greenhouse' | 'Lever' | 'Ashby';
  logo: string;
}

export const RECOMMENDED_ATS_PORTALS: AtsCompanyPreset[] = [
  { name: 'Linear', slug: 'linear', ats: 'Ashby', logo: '⚡' },
  { name: 'Figma', slug: 'figma', ats: 'Greenhouse', logo: '🎨' },
  { name: 'Stripe', slug: 'stripe', ats: 'Greenhouse', logo: '💳' },
  { name: 'GitLab', slug: 'gitlab', ats: 'Greenhouse', logo: '🦊' },
  { name: 'Perplexity', slug: 'perplexity', ats: 'Ashby', logo: '🔮' },
  { name: 'Postman', slug: 'postman', ats: 'Greenhouse', logo: '🚀' },
  { name: 'Airbnb', slug: 'airbnb', ats: 'Greenhouse', logo: '🏠' },
  { name: 'HashiCorp', slug: 'hashicorp', ats: 'Greenhouse', logo: '☁️' },
  { name: 'Replit', slug: 'replit', ats: 'Ashby', logo: '💻' },
  { name: 'Sentry', slug: 'sentry', ats: 'Ashby', logo: '🛡️' },
  { name: 'Elastic', slug: 'elastic', ats: 'Greenhouse', logo: '🔍' },
  { name: 'Datadog', slug: 'datadog', ats: 'Lever', logo: '📊' },
];

export class JobDiscoveryService {
  /**
   * Top tech company boards on Greenhouse with active engineering hiring
   */
  private static readonly TOP_GREENHOUSE_COMPANIES = [
    { slug: 'stripe', name: 'Stripe' },
    { slug: 'gitlab', name: 'GitLab' },
    { slug: 'figma', name: 'Figma' },
    { slug: 'elastic', name: 'Elastic' },
    { slug: 'hashicorp', name: 'HashiCorp' },
    { slug: 'postman', name: 'Postman' },
  ];

  /**
   * Calculates ATS match score against target tech resume skills
   */
  static calculateMatchScore(title: string, tags: string[] = [], description = ''): number {
    const text = `${title} ${tags.join(' ')} ${description}`.toLowerCase();
    let score = 70; // baseline

    const highValueSkills = [
      'react', 'next.js', 'nextjs', 'typescript', 'react native', 'vue', 'vue.js',
      'frontend', 'front-end', 'tailwind', 'zustand', 'expo', 'mobile', 'full stack',
      'node', 'nodejs', 'python', 'aws', 'cloud', 'system design', 'architecture'
    ];

    highValueSkills.forEach((skill) => {
      if (text.includes(skill)) {
        score += 5;
      }
    });

    if (text.includes('lead') || text.includes('senior') || text.includes('staff')) {
      score += 4;
    }

    return Math.min(99, Math.max(72, score));
  }

  /**
   * Fetches real live jobs across multiple zero-token ATS & Public APIs in parallel
   * (Greenhouse, RemoteOK, Arbeitnow, Jobicy)
   */
  static async fetchLiveJobs(query = ''): Promise<DiscoveredJobItem[]> {
    const jobs: DiscoveredJobItem[] = [];
    const seenKeys = new Set<string>();

    const addJob = (job: DiscoveredJobItem) => {
      const key = `${job.company.toLowerCase()}_${job.title.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        jobs.push(job);
      }
    };

    const filterKeywords = query
      ? query.toLowerCase().split(/\s+/).filter(Boolean)
      : ['react', 'vue', 'front', 'next', 'mobile', 'typescript', 'web', 'ui', 'lead', 'full', 'software', 'engineer', 'developer'];

    const timeoutPromise = <T>(promise: Promise<T>, ms = 8000): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)),
      ]);
    };

    // 1. Fetch from RemoteOK API (Zero Token public feed)
    const fetchRemoteOk = async () => {
      try {
        const resp = await timeoutPromise(fetch('https://remoteok.com/api', {
          headers: { 'User-Agent': 'PersonalCareerApp/1.0' },
        }));
        if (resp.ok) {
          const list = await resp.json();
          if (Array.isArray(list)) {
            // First item in RemoteOK is disclaimer/metadata
            for (let i = 1; i < Math.min(list.length, 60); i++) {
              const item = list[i];
              if (!item || !item.position || !item.url) continue;

              const title = item.position || '';
              const company = item.company || 'Remote Tech Co';
              const location = item.location || 'Remote Worldwide';
              const tags = Array.isArray(item.tags) ? item.tags : [];
              const combined = `${title} ${location} ${company} ${tags.join(' ')}`.toLowerCase();

              if (filterKeywords.some((kw) => combined.includes(kw))) {
                const score = this.calculateMatchScore(title, tags);
                let salary = undefined;
                if (item.salary_min && item.salary_max) {
                  salary = `$${Math.round(item.salary_min / 1000)}k - $${Math.round(item.salary_max / 1000)}k`;
                }

                addJob({
                  id: `remoteok_${item.id || Math.random().toString(36).substring(7)}`,
                  title,
                  company,
                  location,
                  url: item.url,
                  tags: tags.slice(0, 4),
                  matchScore: score,
                  stage: 'wishlist',
                  appliedDate: new Date().toISOString().split('T')[0],
                  source: 'RemoteOK',
                  salary,
                });
              }
            }
          }
        }
      } catch {
        // Silently continue on feed error
      }
    };

    // 2. Fetch from Greenhouse Public Boards (Top tech companies - zero token)
    const fetchGreenhouseBoards = async () => {
      const companiesToFetch = this.TOP_GREENHOUSE_COMPANIES.slice(0, 4);
      await Promise.allSettled(
        companiesToFetch.map(async ({ slug, name }) => {
          try {
            const resp = await timeoutPromise(
              fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`, {
                headers: { Accept: 'application/json' },
              }),
              6000
            );
            if (resp.ok) {
              const data = await resp.json();
              const list = data.jobs || [];

              for (const item of list.slice(0, 20)) {
                const title = item.title || '';
                const location = item.location?.name || 'Remote / Global';
                const combined = `${title} ${location} ${name}`.toLowerCase();

                if (filterKeywords.some((kw) => combined.includes(kw))) {
                  const score = this.calculateMatchScore(title, []);
                  addJob({
                    id: `gh_${slug}_${item.id}`,
                    title,
                    company: name,
                    location,
                    url: item.absolute_url || `https://job-boards.greenhouse.io/${slug}/jobs/${item.id}`,
                    tags: ['Engineering', 'Tech', 'ATS Verified'],
                    matchScore: score,
                    stage: 'wishlist',
                    appliedDate: new Date().toISOString().split('T')[0],
                    source: 'Greenhouse',
                  });
                }
              }
            }
          } catch {
            // Ignore single company error
          }
        })
      );
    };

    // 3. Fetch from Arbeitnow Job Board API
    const fetchArbeitnow = async () => {
      try {
        const resp = await timeoutPromise(
          fetch('https://www.arbeitnow.com/api/job-board-api', {
            headers: { Accept: 'application/json' },
          })
        );
        if (resp.ok) {
          const json = await resp.json();
          const data = json.data || [];

          for (const item of data) {
            const title = item.title || '';
            const location = item.location || '';
            const company = item.company_name || '';
            const tags = item.tags || [];
            const combined = `${title} ${location} ${company} ${tags.join(' ')}`.toLowerCase();

            if (filterKeywords.some((kw) => combined.includes(kw))) {
              const score = this.calculateMatchScore(title, tags);
              addJob({
                id: `arbeit_${item.slug || Math.random().toString(36).substring(7)}`,
                title: item.title,
                company: item.company_name || 'Tech Company',
                location: item.location || 'Remote / Hybrid',
                url: item.url || 'https://www.arbeitnow.com',
                tags: tags.slice(0, 4),
                matchScore: score,
                stage: 'wishlist',
                appliedDate: new Date().toISOString().split('T')[0],
                source: 'Arbeitnow',
              });
            }
          }
        }
      } catch {
        // Silently continue
      }
    };

    // 4. Fetch from Jobicy Remote Dev API
    const fetchJobicy = async () => {
      try {
        const isLocationQuery = ['chennai', 'bangalore', 'pune', 'hyderabad', 'mumbai', 'delhi', 'india'].some((loc) =>
          query.toLowerCase().includes(loc)
        );
        const tag = query && !isLocationQuery ? encodeURIComponent(query.toLowerCase()) : 'dev';
        const resp = await timeoutPromise(fetch(`https://jobicy.com/api/v2/remote-jobs?count=25&tag=${tag}`));
        if (resp.ok) {
          const json = await resp.json();
          const data = json.jobs || [];

          for (const item of data) {
            const title = item.jobTitle || '';
            const location = item.jobGeo || 'Remote Worldwide';
            const company = item.companyName || '';
            const tags = item.jobTags || [];
            const combined = `${title} ${location} ${company} ${tags.join(' ')}`.toLowerCase();

            if (filterKeywords.length === 0 || filterKeywords.some((kw) => combined.includes(kw))) {
              const score = this.calculateMatchScore(title, tags);
              addJob({
                id: `jobicy_${item.id || Math.random().toString(36).substring(7)}`,
                title,
                company: item.companyName || 'Tech Partner',
                location,
                url: item.url || 'https://jobicy.com',
                tags: tags.slice(0, 4),
                matchScore: score,
                stage: 'wishlist',
                appliedDate: new Date().toISOString().split('T')[0],
                source: 'Jobicy',
              });
            }
          }
        }
      } catch {
        // Silently continue
      }
    };

    // Run all public zero-token ATS feeds in parallel
    await Promise.allSettled([
      fetchRemoteOk(),
      fetchGreenhouseBoards(),
      fetchArbeitnow(),
      fetchJobicy(),
    ]);

    // Sort by highest match score
    return jobs.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Extracts clean company slug and preferred ATS from URL or string
   */
  static extractCompanySlug(input: string): { slug: string; preferredAts?: 'Greenhouse' | 'Lever' | 'Ashby' } {
    const trimmed = input.trim().toLowerCase();

    // Greenhouse URLs
    const ghMatch = trimmed.match(/(?:boards|job-boards)\.greenhouse\.io\/(?:v1\/boards\/)?([^/?#]+)/i);
    if (ghMatch && ghMatch[1]) return { slug: ghMatch[1], preferredAts: 'Greenhouse' };

    // Lever URLs
    const leverMatch = trimmed.match(/jobs\.(?:eu\.)?lever\.co\/([^/?#]+)/i);
    if (leverMatch && leverMatch[1]) return { slug: leverMatch[1], preferredAts: 'Lever' };

    // Ashby URLs
    const ashbyMatch = trimmed.match(/jobs\.ashbyhq\.com\/([^/?#]+)/i);
    if (ashbyMatch && ashbyMatch[1]) return { slug: ashbyMatch[1], preferredAts: 'Ashby' };

    // Clean text name (e.g. "Linear" -> "linear", "GitLab" -> "gitlab")
    const cleanSlug = trimmed
      .replace(/^https?:\/\//, '')
      .replace(/\.(com|io|co|in|ai|org|dev|net)\/?.*$/, '')
      .replace(/[^a-z0-9_-]/g, '');

    return { slug: cleanSlug || trimmed };
  }

  /**
   * Classify seniority level from job title
   */
  static classifySeniority(title: string): 'entry' | 'mid' | 'senior' | 'lead' {
    const t = title.toLowerCase();
    if (/\b(lead|staff|principal|director|head|vp|architect|chief)\b/i.test(t)) return 'lead';
    if (/\b(senior|sr\.?|iii|iv|lead)\b/i.test(t)) return 'senior';
    if (/\b(intern|internship|entry|junior|jr\.?|trainee|graduate|associate)\b/i.test(t)) return 'entry';
    return 'mid';
  }

  /**
   * Classify workplace type from location & title
   */
  static classifyWorkMode(location: string, title: string): 'remote' | 'hybrid' | 'onsite' {
    const combined = `${location} ${title}`.toLowerCase();
    if (combined.includes('remote') || combined.includes('anywhere') || combined.includes('global')) return 'remote';
    if (combined.includes('hybrid')) return 'hybrid';
    return 'onsite';
  }

  /**
   * Direct Portal Scanner: Scans any company across Greenhouse, Lever, and Ashby ATS boards.
   * Based on career-ops zero-token portal scanner architecture.
   */
  static async scanCompanyPortals(
    companyQuery: string,
    options: PortalScanOptions = {}
  ): Promise<DiscoveredJobItem[]> {
    const { slug, preferredAts } = this.extractCompanySlug(companyQuery);
    if (!slug) return [];

    const jobs: DiscoveredJobItem[] = [];
    const seenKeys = new Set<string>();

    const addJob = (job: DiscoveredJobItem) => {
      const key = `${job.company.toLowerCase()}_${job.title.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        jobs.push(job);
      }
    };

    const timeoutPromise = <T>(promise: Promise<T>, ms = 7500): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)),
      ]);
    };

    const companyDisplayName = slug.charAt(0).toUpperCase() + slug.slice(1);

    // 1. Try Greenhouse ATS
    const fetchGreenhouse = async () => {
      try {
        const resp = await timeoutPromise(
          fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`, {
            headers: { Accept: 'application/json' },
          }),
          7000
        );
        if (resp.ok) {
          const data = await resp.json();
          const list = data.jobs || [];
          for (const item of list) {
            const title = item.title || '';
            const location = item.location?.name || 'Remote / Unspecified';
            const seniority = this.classifySeniority(title);
            const workplaceType = this.classifyWorkMode(location, title);
            const score = this.calculateMatchScore(title, ['Greenhouse', 'Engineering']);

            addJob({
              id: `gh_${slug}_${item.id}`,
              title,
              company: companyDisplayName,
              location,
              url: item.absolute_url || `https://job-boards.greenhouse.io/${slug}/jobs/${item.id}`,
              tags: ['Greenhouse', 'Direct ATS', seniority.toUpperCase()],
              matchScore: score,
              stage: 'wishlist',
              appliedDate: new Date().toISOString().split('T')[0],
              source: 'Greenhouse',
              seniority,
              workplaceType,
            });
          }
        }
      } catch {
        // Continue
      }
    };

    // 2. Try Lever ATS
    const fetchLever = async () => {
      try {
        const resp = await timeoutPromise(
          fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`, {
            headers: { Accept: 'application/json' },
          }),
          7000
        );
        if (resp.ok) {
          const list = await resp.json();
          if (Array.isArray(list)) {
            for (const item of list) {
              const title = item.text || '';
              const loc = item.categories?.location || (item.workplaceType === 'remote' ? 'Remote' : 'Office');
              const seniority = this.classifySeniority(title);
              const workplaceType = item.workplaceType === 'remote' ? 'remote' : this.classifyWorkMode(loc, title);
              const score = this.calculateMatchScore(title, ['Lever']);

              addJob({
                id: `lever_${slug}_${item.id || Math.random().toString(36).substring(7)}`,
                title,
                company: companyDisplayName,
                location: loc,
                url: item.hostedUrl || `https://jobs.lever.co/${slug}/${item.id}`,
                tags: ['Lever', 'Direct ATS', seniority.toUpperCase()],
                matchScore: score,
                stage: 'wishlist',
                appliedDate: new Date().toISOString().split('T')[0],
                source: 'Lever',
                seniority,
                workplaceType,
              });
            }
          }
        }
      } catch {
        // Continue
      }
    };

    // 3. Try Ashby ATS
    const fetchAshby = async () => {
      try {
        const resp = await timeoutPromise(
          fetch(`https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=true`, {
            headers: { Accept: 'application/json' },
          }),
          7000
        );
        if (resp.ok) {
          const data = await resp.json();
          const list = data.jobs || [];
          for (const item of list) {
            const title = item.title || '';
            const location = item.location || (item.isRemote ? 'Remote' : 'Office');
            const seniority = this.classifySeniority(title);
            const workplaceType = item.isRemote ? 'remote' : this.classifyWorkMode(location, title);
            const score = this.calculateMatchScore(title, ['Ashby', 'High Growth']);

            let salary: string | undefined = undefined;
            if (item.compensation?.compensationTiers?.[0]?.components?.[0]) {
              const comp = item.compensation.compensationTiers[0].components[0];
              if (comp.minValue && comp.maxValue) {
                salary = `${comp.currencyCode || '$'}${Math.round(comp.minValue / 1000)}k - ${Math.round(comp.maxValue / 1000)}k`;
              }
            }

            addJob({
              id: `ashby_${slug}_${item.id}`,
              title,
              company: companyDisplayName,
              location,
              url: item.jobUrl || `https://jobs.ashbyhq.com/${slug}/${item.id}`,
              tags: ['Ashby', 'Direct ATS', seniority.toUpperCase()],
              matchScore: score,
              stage: 'wishlist',
              appliedDate: new Date().toISOString().split('T')[0],
              source: 'Ashby',
              seniority,
              workplaceType,
              salary,
            });
          }
        }
      } catch {
        // Continue
      }
    };

    // If preferred ATS is specified, try that first; else try all in parallel
    if (preferredAts === 'Greenhouse') {
      await fetchGreenhouse();
      if (jobs.length === 0) await Promise.allSettled([fetchLever(), fetchAshby()]);
    } else if (preferredAts === 'Lever') {
      await fetchLever();
      if (jobs.length === 0) await Promise.allSettled([fetchGreenhouse(), fetchAshby()]);
    } else if (preferredAts === 'Ashby') {
      await fetchAshby();
      if (jobs.length === 0) await Promise.allSettled([fetchGreenhouse(), fetchLever()]);
    } else {
      await Promise.allSettled([fetchGreenhouse(), fetchLever(), fetchAshby()]);
    }

    // Apply Positive & Negative Keywords & Filters
    const pos = (options.positiveKeywords || []).map((k) => k.toLowerCase().trim()).filter(Boolean);
    const neg = (options.negativeKeywords || []).map((k) => k.toLowerCase().trim()).filter(Boolean);
    const tier = options.seniorityTier || 'all';
    const mode = options.workMode || 'all';

    const filtered = jobs.filter((job) => {
      const titleLower = job.title.toLowerCase();
      const locLower = job.location.toLowerCase();
      const combined = `${titleLower} ${locLower}`;

      // Check negative keywords first (instant discard)
      if (neg.length > 0) {
        const matchesNegative = neg.some((k) => titleLower.includes(k));
        if (matchesNegative) return false;
      }

      // Check positive keywords
      if (pos.length > 0) {
        const matchesPositive = pos.some((k) => combined.includes(k));
        if (!matchesPositive) return false;
      }

      // Check Seniority Tier
      if (tier !== 'all' && job.seniority !== tier) {
        return false;
      }

      // Check Workplace Type
      if (mode !== 'all' && job.workplaceType !== mode) {
        return false;
      }

      return true;
    });

    return filtered.sort((a, b) => b.matchScore - a.matchScore);
  }
}
