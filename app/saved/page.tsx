"use client"

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAppStore from '../../stores/useAppStore'
import type { Company } from '../../lib/mock-data'

type FilterShape = {
  q?: string
  sector?: string
  stage?: string
  geography?: string
  minHeadcount?: number
  maxHeadcount?: number
}

function applyFilters(items: Company[], f: FilterShape) {
  return items.filter((c) => {
    if (f.q && !`${c.name} ${c.oneLiner} ${c.tags?.join(' ')}`.toLowerCase().includes(f.q.toLowerCase())) return false
    if (f.sector && c.sector !== f.sector) return false
    if (f.stage && c.stage !== f.stage) return false
    if (f.geography && c.geography !== f.geography) return false
    if (typeof f.minHeadcount === 'number' && (typeof c.headcount !== 'number' || c.headcount < f.minHeadcount)) return false
    if (typeof f.maxHeadcount === 'number' && (typeof c.headcount !== 'number' || c.headcount > f.maxHeadcount)) return false
    return true
  })
}

export default function SavedPage() {
  const companies = useAppStore((s) => s.companies)
  const savedSearches = useAppStore((s) => s.savedSearches)
  const saveSearch = useAppStore((s) => s.saveSearch)

  const [filters, setFilters] = useState<FilterShape>({})
  const [name, setName] = useState('')
  const [activeResults, setActiveResults] = useState<Company[] | null>(null)

  const sectors = useMemo(() => Array.from(new Set(companies.map((c) => c.sector))).filter(Boolean), [companies])
  const stages = useMemo(() => Array.from(new Set(companies.map((c) => c.stage))).filter(Boolean), [companies])
  const geos = useMemo(() => Array.from(new Set(companies.map((c) => c.geography))).filter(Boolean), [companies])

  const handleSave = () => {
    if (!name) return
    const payload = JSON.stringify(filters)
    saveSearch(name, payload)
    setName('')
  }

  const handleRun = (payloadJson: string) => {
    try {
      const parsed = JSON.parse(payloadJson) as FilterShape
      const results = applyFilters(companies, parsed)
      setActiveResults(results)
    } catch (e) {
      setActiveResults([])
    }
  }

  const router = useRouter()

  function runAndNavigate(payloadJson: string) {
    // preserve existing local preview behavior
    handleRun(payloadJson)

    try {
      const parsed = JSON.parse(payloadJson) as FilterShape
      const params: string[] = []
      if (parsed.q) params.push(`q=${encodeURIComponent(parsed.q)}`)
      if (parsed.sector) params.push(`sector=${encodeURIComponent(parsed.sector)}`)
      if (parsed.stage) params.push(`stage=${encodeURIComponent(parsed.stage)}`)
      if (parsed.geography) params.push(`geography=${encodeURIComponent(parsed.geography)}`)
      // allow optional minScore if present in the saved payload
      const anyMinScore = (parsed as any).minScore
      if (typeof anyMinScore !== 'undefined' && anyMinScore !== null) params.push(`minScore=${encodeURIComponent(String(anyMinScore))}`)

      const query = params.length ? `?${params.join('&')}` : ''
      router.push(`/companies${query}`)
    } catch (e) {
      // parsing failed — still keep preview, but do not navigate
    }
  }

  const handlePreview = () => {
    const results = applyFilters(companies, filters)
    setActiveResults(results)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Saved searches</h2>
      </div>

      <section className="bg-white border rounded p-4">
        <h3 className="text-lg font-medium">Create & save a search</h3>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input placeholder="Query (name, tagline, tags)" value={filters.q || ''} onChange={(e) => setFilters((s) => ({ ...s, q: e.target.value }))} className="rounded border px-3 py-2 col-span-1 md:col-span-3" />
          <select value={filters.sector || ''} onChange={(e) => setFilters((s) => ({ ...s, sector: e.target.value || undefined }))} className="rounded border px-3 py-2">
            <option value="">Any sector</option>
            {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.stage || ''} onChange={(e) => setFilters((s) => ({ ...s, stage: e.target.value || undefined }))} className="rounded border px-3 py-2">
            <option value="">Any stage</option>
            {stages.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.geography || ''} onChange={(e) => setFilters((s) => ({ ...s, geography: e.target.value || undefined }))} className="rounded border px-3 py-2">
            <option value="">Any geography</option>
            {geos.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <input type="number" placeholder="Min headcount" value={filters.minHeadcount ?? ''} onChange={(e) => setFilters((s) => ({ ...s, minHeadcount: e.target.value ? Number(e.target.value) : undefined }))} className="rounded border px-3 py-2" />
          <input type="number" placeholder="Max headcount" value={filters.maxHeadcount ?? ''} onChange={(e) => setFilters((s) => ({ ...s, maxHeadcount: e.target.value ? Number(e.target.value) : undefined }))} className="rounded border px-3 py-2" />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input placeholder="Saved search name" value={name} onChange={(e) => setName(e.target.value)} className="rounded border px-3 py-2" />
          <button onClick={handleSave} className="rounded bg-slate-800 text-white px-4 py-2">Save search</button>
          <button onClick={handlePreview} className="rounded border px-3 py-2">Preview results</button>
        </div>
      </section>

      <section className="bg-white border rounded p-4">
        <h3 className="text-lg font-medium">Your saved searches</h3>
        <div className="mt-3 space-y-2">
          {savedSearches.length === 0 && <div className="text-sm text-slate-600">No saved searches yet</div>}
          {savedSearches.map((s) => (
            <div key={s.id} className="p-3 border rounded flex items-center justify-between">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-slate-500">{s.query}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => runAndNavigate(s.query)} className="rounded border px-3 py-1">Run</button>
                <a href={`data:application/json;charset=utf-8,${encodeURIComponent(s.query)}`} download={`${s.name}.json`} className="text-sm text-slate-600">Export JSON</a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border rounded p-4">
        <h3 className="text-lg font-medium">Results</h3>
        <div className="mt-3">
          {activeResults === null && <div className="text-sm text-slate-600">Run a saved search or preview to see results here.</div>}
          {activeResults !== null && (
            <div className="space-y-2">
              <div className="text-sm text-slate-600">{activeResults.length} results</div>
              {activeResults.map((c) => (
                <div key={c.id} className="p-3 border rounded">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.oneLiner}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
