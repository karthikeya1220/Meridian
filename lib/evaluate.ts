import type { Company } from './mock-data'
import { deriveSignals, type CompanyFacts } from './signal-engine'
import { scoreCompany } from './scoring'

export type EvaluationResult = {
  company: Company
  facts: CompanyFacts
  signals: ReturnType<typeof deriveSignals>
  score: ReturnType<typeof scoreCompany>
}

export function buildFactsFromCompany(company: Company): CompanyFacts {
  return {
    id: company.id,
    name: company.name,
    website: company.website,
    tags: company.tags,
    tech_stack: company.tags,
    repo_links: [],
    job_postings_count: 0,
    careers_page: false,
    blog_posts: []
    ,
    headcount: company.headcount
  }
}

export function evaluateCompany(company: Company): EvaluationResult {
  const facts = buildFactsFromCompany(company)
  // ensure headcount is present for signal derivation
  const mergedFacts = { ...facts, headcount: company.headcount }
  const signals = deriveSignals(mergedFacts)
  const score = scoreCompany(company, signals)
  return { company, facts, signals, score }
}

export function evaluateFromFacts(company: Company, facts: CompanyFacts): EvaluationResult {
  // merge company metadata into facts (e.g., headcount) so signals derive only from facts
  const mergedFacts = { ...facts, headcount: company.headcount }
  const signals = deriveSignals(mergedFacts)
  const score = scoreCompany(company, signals)
  return { company, facts, signals, score }
}

export default { buildFactsFromCompany, evaluateCompany, evaluateFromFacts }
