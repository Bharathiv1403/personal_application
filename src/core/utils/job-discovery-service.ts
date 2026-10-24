import { BHARATHI_CANDIDATE_PROFILE } from '../data/candidate-profile';

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
  source: 'Arbeitnow' | 'Jobicy' | 'CareerPilot';
}

export class JobDiscoveryService {
  /**
   * Calculates ATS match score against Bharathi's resume skills
   */
  static calculateMatchScore(title: string, tags: string[] = [], description = ''): number {
    const text = `${title} ${tags.join(' ')} ${description}`.toLowerCase();
    let score = 70; // baseline

    const highValueSkills = [
      'react', 'next.js', 'nextjs', 'typescript', 'react native', 'vue', 'vue.js',
      'frontend', 'front-end', 'tailwind', 'zustand', 'expo', 'mobile'
    ];

    highValueSkills.forEach((skill) => {
      if (text.includes(skill)) {
        score += 6;
      }
    });

    if (text.includes('lead') || text.includes('senior') || text.includes('staff')) {
      score += 4;
    }

    return Math.min(99, Math.max(72, score));
  }

  /**
   * Fetches real live jobs from Arbeitnow and Jobicy APIs
   */
  static async fetchLiveJobs(query = ''): Promise<DiscoveredJobItem[]> {
    const jobs: DiscoveredJobItem[] = [];

    // 1. Fetch from Arbeitnow Job Board API
    try {
      const resp = await fetch('https://www.arbeitnow.com/api/job-board-api', {
        headers: { 'Accept': 'application/json' },
      });
      if (resp.ok) {
        const json = await resp.json();
        const data = json.data || [];
        const filterKeywords = query
          ? [query.toLowerCase()]
          : ['react', 'vue', 'front', 'next', 'mobile', 'typescript', 'web', 'ui', 'lead'];

        for (const item of data) {
          const title = item.title || '';
          const tags = item.tags || [];
          const combined = `${title} ${tags.join(' ')}`.toLowerCase();

          if (filterKeywords.some((kw) => combined.includes(kw))) {
            const score = this.calculateMatchScore(title, tags);
            jobs.push({
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
          if (jobs.length >= 25) break;
        }
      }
    } catch (err) {
      console.warn('Error fetching Arbeitnow jobs:', err);
    }

    // 2. Fetch from Jobicy Remote Dev API
    try {
      const tag = query ? encodeURIComponent(query.toLowerCase()) : 'dev';
      const resp = await fetch(`https://jobicy.com/api/v2/remote-jobs?count=20&tag=${tag}`);
      if (resp.ok) {
        const json = await resp.json();
        const data = json.jobs || [];

        for (const item of data) {
          const title = item.jobTitle || '';
          const tags = item.jobTags || [];
          const score = this.calculateMatchScore(title, tags);

          jobs.push({
            id: `jobicy_${item.id || Math.random().toString(36).substring(7)}`,
            title,
            company: item.companyName || 'Tech Partner',
            location: item.jobGeo || 'Remote Worldwide',
            url: item.url || 'https://jobicy.com',
            tags: tags.slice(0, 4),
            matchScore: score,
            stage: 'wishlist',
            appliedDate: new Date().toISOString().split('T')[0],
            source: 'Jobicy',
          });
        }
      }
    } catch (err) {
      console.warn('Error fetching Jobicy jobs:', err);
    }

    return jobs;
  }
}
