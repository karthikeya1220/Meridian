export type ThesisConfig = {
  sectors: string[]
  stages: string[]
  geographies: string[]
  maxHeadcount: number
  baseWeights: {
    team: number
    traction: number
    tech: number
    other?: number
  }
  signalWeights: Record<string, any>
}

export const THESIS: ThesisConfig = {
  sectors: [
    'saas',
    'healthcare',
    'deep-tech',
    'fintech',
    'marketplace',
    'consumer',
    'hardware',
    'biotech'
  ],
  stages: ['pre-seed', 'seed', 'series_a', 'series_b', 'growth', 'late'],
  geographies: ['North America', 'Europe', 'APAC', 'Latin America', 'MEA'],
  maxHeadcount: 2000,
  // baseWeights define category weights used by the deterministic scoring engine
  baseWeights: {
    team: 0.3,
    traction: 0.4,
    tech: 0.3
  },
  // signalWeights define per-signal importance and optional thresholds/normalizers.
  signalWeights: {
    team: {
      founder_experience_years: { weight: 1.0, min: 0, max: 20 },
      has_phd_founder: { weight: 0.7 }
    },
    traction: {
      revenue_bucket: {
        weight: 1.0,
        // bucket mapping used by scoring engine: higher index -> better
        buckets: ['0-0.5M', '0.5M-1M', '1M-10M', '10M-100M', '100M+']
      },
      growth_1y_pct: { weight: 0.8, min: 0, max: 200 }
    },
    tech: {
      has_patents: { weight: 1.0 },
      product_stage: { weight: 0.5, preferred: ['ga', 'scale'] }
    },
    other: {
      geography_prioritization: {
        weight: 0.2,
        preferred: ['North America', 'Europe']
      },
      sector_multipliers: {
        // example multipliers for sectors reflecting thesis preference
        saas: 1.0,
        healthcare: 1.1,
        'deep-tech': 1.3,
        fintech: 1.0,
        biotech: 1.2
      }
    }
  }
}

export default THESIS
