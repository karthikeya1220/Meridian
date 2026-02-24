import THESIS from './thesis'
import type { Company } from './mock-data'
import type { Signal } from './signal-engine'

type Breakdown = {
  sectorScore: number
  stageScore: number
  geographyScore: number
  sizeScore: number
  attributeScore: number
  signalsCategoryScore: { [k: string]: number }
  signalsBonus: number
}

export type ScoreResult = {
  totalScore: number
  breakdown: Breakdown
  explanation: string[]
}

function clamp01(v: number) {
  if (Number.isNaN(v) || v === Infinity) return 0
  return Math.max(0, Math.min(1, v))
}

// Stage preference mapping (deterministic)
const STAGE_SCORES: Record<string, number> = {
  'pre-seed': 0.8,
  seed: 1.0,
  series_a: 1.0,
  series_b: 0.85,
  growth: 0.7,
  late: 0.5
}

// Size buckets helper
function sizeScoreFromHeadcount(headcount?: number) {
  if (headcount == null) return 0.5
  if (headcount <= 10) return 0.95
  if (headcount <= 50) return 1.0
  if (headcount <= 150) return 0.9
  if (headcount <= 500) return 0.7
  if (headcount <= 1000) return 0.5
  return 0.3
}

// Map signals to thesis categories
const SIGNAL_TO_CATEGORY: Record<string, string> = {
  developer_focus: 'tech',
  hiring_detected: 'team',
  recent_blog_activity: 'traction'
}

export function scoreCompany(company: Company, signals: Signal[]): ScoreResult {
  const explanation: string[] = []

  // Sector score: use sector multipliers defined in thesis, default 1
  const sectorMultipliers = THESIS.signalWeights?.other?.sector_multipliers || {}
  const sectorMultiplier = (sectorMultipliers as any)[company.sector] ?? 1.0
  // Normalize multiplier into 0..1.5 then clamp to 0..1
  const sectorScore = clamp01(sectorMultiplier / 1.5)
  explanation.push(`sector (${company.sector}) multiplier ${sectorMultiplier}`)

  // Stage score
  const stageScore = clamp01(STAGE_SCORES[company.stage] ?? 0.6)
  explanation.push(`stage (${company.stage}) score ${stageScore.toFixed(2)}`)

  // Geography score
  const geoPref = THESIS.signalWeights?.other?.geography_prioritization?.preferred || []
  const geoPreferred = geoPref.includes(company.geography)
  const geographyScore = geoPreferred ? 1.0 : 0.7
  explanation.push(`${company.geography} preferred: ${geoPreferred}`)

  // Size score
  const sizeScore = sizeScoreFromHeadcount(company.headcount)
  explanation.push(`headcount ${company.headcount} -> size score ${sizeScore.toFixed(2)}`)

  // Attribute base weights (sector/stage/geography/size) equally weighted
  const attrWeights = { sector: 0.25, stage: 0.25, geography: 0.25, size: 0.25 }
  const attributeScore = clamp01(
    sectorScore * attrWeights.sector +
      stageScore * attrWeights.stage +
      geographyScore * attrWeights.geography +
      sizeScore * attrWeights.size
  )
  explanation.push(`attribute composite score ${attributeScore.toFixed(3)}`)

  // Compute signals category scores
  const categoryScores: Record<string, { sum: number; count: number }> = {}
  for (const sig of signals) {
    const cat = SIGNAL_TO_CATEGORY[sig.id] || 'other'
    if (!categoryScores[cat]) categoryScores[cat] = { sum: 0, count: 0 }
    categoryScores[cat].sum += sig.strength
    categoryScores[cat].count += 1
  }

  const signalsCategoryScore: Record<string, number> = {}
  for (const [cat, agg] of Object.entries(categoryScores)) {
    signalsCategoryScore[cat] = agg.count > 0 ? clamp01(agg.sum / agg.count) : 0
  }

  // Ensure all base categories exist (team/traction/tech)
  for (const cat of Object.keys(THESIS.baseWeights)) {
    if (!(cat in signalsCategoryScore)) signalsCategoryScore[cat] = 0
  }

  // Weighted sum according to THESIS.baseWeights
  const baseWeights = THESIS.baseWeights
  const weightSum = Object.values(baseWeights).reduce((a, b) => a + b, 0) || 1
  let signalsWeightedSum = 0
  for (const [cat, w] of Object.entries(baseWeights)) {
    const catVal = signalsCategoryScore[cat] ?? 0
    signalsWeightedSum += catVal * (w / weightSum)
  }
  explanation.push(`signals category weighted score ${signalsWeightedSum.toFixed(3)}`)

  // Signals bonus: small additive bonus from individual signals (reward strong signals)
  const rawSignalsBonus = signals.reduce((acc, s) => acc + s.strength * 0.1, 0)
  const signalsBonus = clamp01(rawSignalsBonus)
  if (signals.length > 0) explanation.push(`signals bonus ${signalsBonus.toFixed(3)}`)

  // Combine attribute score and signals weighted score with signals bonus
  // weights chosen to prioritize base attributes but incorporate signals
  const totalScore = clamp01(attributeScore * 0.6 + signalsWeightedSum * 0.35 + signalsBonus * 0.05)

  const breakdown: Breakdown = {
    sectorScore,
    stageScore,
    geographyScore,
    sizeScore,
    attributeScore,
    signalsCategoryScore,
    signalsBonus
  }

  return {
    totalScore,
    breakdown,
    explanation
  }
}

export default { scoreCompany }
