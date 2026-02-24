export type Company = {
  id: string
  name: string
  website?: string
  sector: string
  stage: 'pre-seed' | 'seed' | 'series_a' | 'series_b' | 'growth' | 'late'
  geography: string
  headcount: number
  founded: number
  oneLiner: string
  tags: string[]
}

export const MOCK_COMPANIES: Company[] = [
  {
    id: 'aurora-robotics',
    name: 'Aurora Robotics',
    website: 'https://aurorarobotics.example',
    sector: 'hardware',
    stage: 'series_a',
    geography: 'North America',
    headcount: 48,
    founded: 2018,
    oneLiner: 'Autonomous manipulation hardware for warehouse automation.',
    tags: ['robotics', 'logistics', 'autonomy']
  },
  {
    id: 'helix-health',
    name: 'Helix Health',
    website: 'https://helixhealth.example',
    sector: 'healthcare',
    stage: 'seed',
    geography: 'Europe',
    headcount: 22,
    founded: 2020,
    oneLiner: 'AI-first clinical decision support for outpatient clinics.',
    tags: ['healthcare', 'ai', 'saas']
  },
  {
    id: 'cobalt-finance',
    name: 'Cobalt Finance',
    website: 'https://cobaltfinance.example',
    sector: 'fintech',
    stage: 'series_b',
    geography: 'North America',
    headcount: 210,
    founded: 2016,
    oneLiner: 'Embedded lending platform powering point-of-sale credit for SMBs.',
    tags: ['lending', 'payments', 'api']
  },
  {
    id: 'marketplace-one',
    name: 'Marketplace One',
    website: 'https://marketplaceone.example',
    sector: 'marketplace',
    stage: 'growth',
    geography: 'APAC',
    headcount: 850,
    founded: 2012,
    oneLiner: 'Regional commerce marketplace connecting buyers and local sellers.',
    tags: ['marketplace', 'ecommerce', 'logistics']
  },
  {
    id: 'nova-foods',
    name: 'Nova Foods',
    website: 'https://novafoods.example',
    sector: 'consumer',
    stage: 'series_a',
    geography: 'North America',
    headcount: 65,
    founded: 2019,
    oneLiner: 'Direct-to-consumer, climate-friendly food brand with subscription model.',
    tags: ['consumer', 'subscription', 'foodtech']
  },
  {
    id: 'deepmindium',
    name: 'DeepMindium',
    website: 'https://deepmindium.example',
    sector: 'deep-tech',
    stage: 'seed',
    geography: 'Europe',
    headcount: 12,
    founded: 2021,
    oneLiner: 'Quantum-resistant cryptography hardware and IP for governments.',
    tags: ['deep-tech', 'crypto', 'hardware']
  },
  {
    id: 'terra-energy',
    name: 'Terra Energy',
    website: 'https://terraenergy.example',
    sector: 'hardware',
    stage: 'series_b',
    geography: 'North America',
    headcount: 340,
    founded: 2014,
    oneLiner: 'Utility-scale energy storage and battery management systems.',
    tags: ['energy', 'hardware', 'climate']
  },
  {
    id: 'mediq-bio',
    name: 'MediQ Bio',
    website: 'https://mediqbio.example',
    sector: 'biotech',
    stage: 'series_a',
    geography: 'Europe',
    headcount: 58,
    founded: 2017,
    oneLiner: 'Precision biologics discovery platform using high-throughput screening.',
    tags: ['biotech', 'saas', 'drug-discovery']
  },
  {
    id: 'orbit-analytics',
    name: 'Orbit Analytics',
    website: 'https://orbitanalytics.example',
    sector: 'saas',
    stage: 'seed',
    geography: 'Latin America',
    headcount: 9,
    founded: 2022,
    oneLiner: 'SaaS analytics for SMB retail operators to optimize inventory.',
    tags: ['saas', 'analytics', 'retail']
  },
  {
    id: 'spectrum-cyber',
    name: 'Spectrum Cyber',
    website: 'https://spectrumcyber.example',
    sector: 'deep-tech',
    stage: 'series_b',
    geography: 'North America',
    headcount: 120,
    founded: 2015,
    oneLiner: 'Enterprise-grade threat detection with ML-based anomaly scoring.',
    tags: ['security', 'ml', 'enterprise']
  },
  {
    id: 'agri-nova',
    name: 'Agri Nova',
    website: 'https://agrinova.example',
    sector: 'hardware',
    stage: 'pre-seed',
    geography: 'APAC',
    headcount: 6,
    founded: 2023,
    oneLiner: 'Low-cost soil sensors + insights for smallholder farmers.',
    tags: ['agtech', 'hardware', 'iot']
  },
  {
    id: 'atlas-logix',
    name: 'Atlas Logix',
    website: 'https://atlaslogix.example',
    sector: 'saas',
    stage: 'series_a',
    geography: 'North America',
    headcount: 72,
    founded: 2018,
    oneLiner: 'Route optimization and telematics for last-mile fleets.',
    tags: ['logistics', 'saas', 'fleet']
  },
  {
    id: 'lumen-ai',
    name: 'Lumen AI',
    website: 'https://lumenai.example',
    sector: 'saas',
    stage: 'series_b',
    geography: 'Europe',
    headcount: 190,
    founded: 2016,
    oneLiner: 'Computer vision APIs for retail analytics and store automation.',
    tags: ['computer-vision', 'ai', 'retail']
  },
  {
    id: 'zen-payments',
    name: 'Zen Payments',
    website: 'https://zenpayments.example',
    sector: 'fintech',
    stage: 'seed',
    geography: 'APAC',
    headcount: 18,
    founded: 2021,
    oneLiner: 'Cross-border payment rails optimized for SMB marketplaces.',
    tags: ['payments', 'fintech', 'cross-border']
  },
  {
    id: 'quantum-chem',
    name: 'Quantum Chem',
    website: 'https://quantumchem.example',
    sector: 'deep-tech',
    stage: 'pre-seed',
    geography: 'Europe',
    headcount: 4,
    founded: 2024,
    oneLiner: 'Simulations leveraging quantum-inspired algorithms for materials discovery.',
    tags: ['deep-tech', 'material-science', 'research']
  }
]

export default MOCK_COMPANIES
