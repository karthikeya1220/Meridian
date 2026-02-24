// Deterministic rule-based signal engine
// Consumes factual LLM output (CompanyFacts) and derives Signals used by scoring

export interface CompanyFacts {
  id: string
  name?: string
  website?: string
  // tags or categories extracted by LLM
  tags?: string[]
  // number of current public job postings (if available)
  job_postings_count?: number
  // whether company has a careers page detected
  careers_page?: boolean
  // number of hires in recent window (e.g., last 3 months) if LLM extracted
  recent_hires_last_3_months?: number
  // blog posts or updates with dates
  blog_posts?: { title?: string; date?: string; url?: string }[]
  // tech stack hints (languages, frameworks)
  tech_stack?: string[]
  // repo links discovered (e.g., GitHub, GitLab)
  repo_links?: string[]
  // product stage (optional)
  product_stage?: 'prototype' | 'beta' | 'ga' | 'scale'
}

export interface Signal {
  id: string
  label: string
  // normalized strength between 0 and 1
  strength: number
  // human-readable reason explaining the evaluation
  reason: string
  // optional raw value(s) used to compute the signal
  raw?: any
}

function clamp01(v: number) {
  if (Number.isNaN(v) || v === Infinity) return 0
  return Math.max(0, Math.min(1, v))
}

function daysSince(dateStr?: string) {
  if (!dateStr) return Infinity
  const d = Date.parse(dateStr)
  if (Number.isNaN(d)) return Infinity
  return Math.floor((Date.now() - d) / (1000 * 60 * 60 * 24))
}

export function deriveSignals(facts: CompanyFacts): Signal[] {
  const signals: Signal[] = []

  // Developer focus signal
  // Heuristics:
  // - tags containing developer keywords
  // - presence of repo links
  // - tech stack languages count
  const devKeywords = new Set([
    'developer',
    'devtools',
    'api',
    'sdk',
    'infrastructure',
    'backend',
    'frontend',
    'platform',
    'middleware'
  ])

  const tags = (facts.tags || []).map((t) => t.toLowerCase())
  const tagScore = tags.some((t) => devKeywords.has(t)) ? 1 : 0

  const repoScore = (facts.repo_links && facts.repo_links.length > 0) ? 1 : 0

  const knownLangs = (facts.tech_stack || []).map((s) => s.toLowerCase())
  const langMatches = knownLangs.filter((l) => ['node', 'javascript', 'typescript', 'python', 'go', 'rust', 'java'].some((k) => l.includes(k))).length
  const langScore = clamp01(langMatches / 3)

  // Weighted combination
  const devRaw = tagScore * 0.5 + repoScore * 0.3 + langScore * 0.2
  const devStrength = clamp01(devRaw)
  const devReasons: string[] = []
  if (tagScore) devReasons.push('developer-related tags present')
  if (repoScore) devReasons.push(`${facts.repo_links?.length ?? 0} repo link(s) found`)
  if (langMatches) devReasons.push(`${langMatches} tech language matches`)
  if (devReasons.length === 0) devReasons.push('no developer-specific evidence found')

  signals.push({
    id: 'developer_focus',
    label: 'Developer focus',
    strength: devStrength,
    reason: devReasons.join('; '),
    raw: { tagScore, repoScore, langMatches }
  })

  // Hiring detected signal
  // Heuristics:
  // - job_postings_count (scaled)
  // - careers_page presence
  // - recent_hires_last_3_months presence
  const postings = facts.job_postings_count ?? 0
  const postingsScore = clamp01(Math.log10(1 + postings) / 1.5) // soft scale
  const careersScore = facts.careers_page ? 0.5 : 0
  const hiresScore = (facts.recent_hires_last_3_months && facts.recent_hires_last_3_months > 0) ? 0.4 : 0
  const hiringRaw = postingsScore * 0.6 + careersScore * 0.25 + hiresScore * 0.15
  const hiringStrength = clamp01(hiringRaw)
  const hiringReasons: string[] = []
  if (postings > 0) hiringReasons.push(`${postings} public job posting(s)`) 
  if (facts.careers_page) hiringReasons.push('careers page detected')
  if (facts.recent_hires_last_3_months && facts.recent_hires_last_3_months > 0) hiringReasons.push(`${facts.recent_hires_last_3_months} recent hire(s)`) 
  if (hiringReasons.length === 0) hiringReasons.push('no hiring signals found')

  signals.push({
    id: 'hiring_detected',
    label: 'Hiring activity',
    strength: hiringStrength,
    reason: hiringReasons.join('; '),
    raw: { postings, careersPage: facts.careers_page, recentHires: facts.recent_hires_last_3_months }
  })

  // Recent blog activity
  // Heuristics: count blog posts within last 90 days
  const posts = facts.blog_posts || []
  const recentWindowDays = 90
  const recentCount = posts.filter((p) => daysSince(p.date) <= recentWindowDays).length
  // Strength: 0 if 0 posts, else min(1, recentCount / 4)
  const blogStrength = clamp01(recentCount / 4)
  const blogReasons = []
  if (recentCount > 0) {
    const latest = posts.reduce((acc, p) => {
      if (!p.date) return acc
      if (!acc) return p
      return daysSince(p.date) < daysSince(acc.date || '') ? p : acc
    }, undefined as { title?: string; date?: string } | undefined)
    blogReasons.push(`${recentCount} post(s) in last ${recentWindowDays} days`)
    if (latest && latest.date) blogReasons.push(`latest: ${latest.date}`)
  } else {
    blogReasons.push('no recent blog or update activity detected')
  }

  signals.push({
    id: 'recent_blog_activity',
    label: 'Recent blog / updates',
    strength: blogStrength,
    reason: blogReasons.join('; '),
    raw: { recentCount, windowDays: recentWindowDays }
  })

  return signals
}

export default { deriveSignals }
