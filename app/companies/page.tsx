"use client"

import React, { useMemo, useState, useEffect } from 'react'
import useAppStore from '../../stores/useAppStore'
import CompanyCard from '../../components/CompanyCard'
import { evaluateCompany } from '../../lib/evaluate'
import type { Company } from '../../lib/mock-data'

type SortKey = 'name' | 'headcount' | 'score'

export default function CompaniesPage() {
  const companies = useAppStore((s) => s.companies)
  const selected = useAppStore((s) => s.selectedCompanies)
  const toggleSelection = useAppStore((s) => s.toggleCompanySelection)
  const addToList = useAppStore((s) => s.addToList)
  const lists = useAppStore((s) => s.lists)

  // Filters
  const [sector, setSector] = useState<string>('')
  const [stage, setStage] = useState<string>('')
  const [geography, setGeography] = useState<string>('')
  const [minHeadcount, setMinHeadcount] = useState<number>(0)
  const [maxHeadcount, setMaxHeadcount] = useState<number>(10000)
  const [minScore, setMinScore] = useState<number>(0)
  // UI state
  const [isInitializing, setIsInitializing] = useState<boolean>(true)
  const [saveListSelect, setSaveListSelect] = useState<string>('')
  // We avoid Next's useSearchParams here to keep this page a purely client-side component
  // and to prevent CSR bailout during static prerender. Read from window.location instead.
  const searchParams = null
  const [q, setQ] = useState<string>('')

  // initialize q from URL query param when the page mounts or when params change
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const sp = new URLSearchParams(window.location.search)
      setQ(sp.get('q') || '')
      setSector(sp.get('sector') || '')
      setStage(sp.get('stage') || '')
      setGeography(sp.get('geography') || '')
      const paramMinScore = sp.get('minScore')
      setMinScore(paramMinScore ? Number(paramMinScore) : 0)
    } catch (e) {
      // ignore
    }
  }, [searchParams])

  // small init skeleton flash to avoid jank on mount
  useEffect(() => {
    const t = setTimeout(() => setIsInitializing(false), 150)
    return () => clearTimeout(t)
  }, [])

  // Sorting & pagination
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  // compute signals + scores memoized via centralized evaluator
  const scored = useMemo(() => {
    return companies.map((c) => {
      const ev = evaluateCompany(c as Company)
      return { company: c, signals: ev.signals, score: ev.score }
    })
  }, [companies])

  // Filtering
  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase()
    return scored
      .filter(({ company, score }) => {
        if (sector && company.sector !== sector) return false
        if (stage && company.stage !== stage) return false
        if (geography && company.geography !== geography) return false
        if (company.headcount < minHeadcount) return false
        if (company.headcount > maxHeadcount) return false
        if (score.totalScore < minScore) return false
        if (qLower) {
          const hay = [company.name, company.oneLiner, ...(company.tags || [])].join(' ').toLowerCase()
          if (!hay.includes(qLower)) return false
        }
        return true
      })
      .sort((a, b) => {
        let av: any = a.company.name.toLowerCase()
        let bv: any = b.company.name.toLowerCase()
        if (sortKey === 'headcount') {
          av = a.company.headcount
          bv = b.company.headcount
        }
        if (sortKey === 'score') {
          av = a.score.totalScore
          bv = b.score.totalScore
        }
        if (av < bv) return sortDir === 'asc' ? -1 : 1
        if (av > bv) return sortDir === 'asc' ? 1 : -1
        return 0
      })
  }, [scored, sector, stage, geography, minHeadcount, maxHeadcount, minScore, q, sortKey, sortDir])

  const total = filtered.length

  if (isInitializing) {
    // simple skeleton while companies initialize
    return (
      <div className="space-y-4">
        <div className="h-8 w-1/3 bg-slate-100 rounded animate-pulse" />
        <div className="bg-white border rounded p-4">
          <div className="h-4 bg-slate-100 rounded w-full mb-3 animate-pulse" />
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // pagination
  const start = (page - 1) * pageSize
  const pageItems = filtered.slice(start, start + pageSize)

  useEffect(() => {
    // when filters change, reset to page 1
    setPage(1)
  }, [sector, stage, geography, minHeadcount, maxHeadcount, minScore, q, pageSize])

  // bulk select handlers
  const allOnPageSelected = pageItems.every((it) => selected.includes(it.company.id))
  const toggleSelectAll = () => {
    pageItems.forEach((it) => {
      if (!selected.includes(it.company.id)) toggleSelection(it.company.id)
    })
    if (allOnPageSelected) {
      // unselect
      pageItems.forEach((it) => {
        if (selected.includes(it.company.id)) toggleSelection(it.company.id)
      })
    }
  }

  // helper to save selected companies to a chosen list
  function saveSelectedToList(listName: string) {
    selected.forEach((id) => addToList(listName, id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Companies</h2>
        <div className="text-sm text-slate-600">{total} results</div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium">Sector</label>
          <select value={sector} onChange={(e) => setSector(e.target.value)} className="w-full rounded border px-2 py-1">
            <option value="">All</option>
            {[...new Set(companies.map((c) => c.sector))].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">Stage</label>
          <select value={stage} onChange={(e) => setStage(e.target.value)} className="w-full rounded border px-2 py-1">
            <option value="">All</option>
            {[...new Set(companies.map((c) => c.stage))].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">Geography</label>
          <select value={geography} onChange={(e) => setGeography(e.target.value)} className="w-full rounded border px-2 py-1">
            <option value="">All</option>
            {[...new Set(companies.map((c) => c.geography))].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-1 space-y-2">
          <label className="text-xs font-medium">Headcount min</label>
          <input type="number" value={minHeadcount} onChange={(e) => setMinHeadcount(Number(e.target.value))} className="w-full rounded border px-2 py-1" />
        </div>
        <div className="md:col-span-1 space-y-2">
          <label className="text-xs font-medium">Headcount max</label>
          <input type="number" value={maxHeadcount} onChange={(e) => setMaxHeadcount(Number(e.target.value))} className="w-full rounded border px-2 py-1" />
        </div>

        <div className="md:col-span-1 space-y-2">
          <label className="text-xs font-medium">Min score</label>
          <input type="range" min={0} max={1} step={0.01} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="w-full" />
          <div className="text-xs text-slate-500">{minScore.toFixed(2)}</div>
        </div>

        <div className="md:col-span-3">
          <label className="text-xs font-medium">Search</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="fuzzy search" className="w-full rounded border px-2 py-1" />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm">Sort</label>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="rounded border px-2 py-1">
            <option value="score">Score</option>
            <option value="name">Name</option>
            <option value="headcount">Headcount</option>
          </select>
          <button onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')} className="rounded border px-2 py-1">{sortDir}</button>

          <label className="text-sm">Page size</label>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="rounded border px-2 py-1">
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleSelectAll} className="rounded border px-3 py-1 text-sm">{allOnPageSelected ? 'Unselect page' : 'Select page'}</button>
          <div className="flex items-center gap-2">
            <select value={saveListSelect} onChange={(e) => setSaveListSelect(e.target.value)} className="rounded border px-2 py-1">
              <option value="">Save selected to...</option>
              {Object.keys(lists).map((name) => (
                <option key={name} value={name}>{name} ({lists[name].length})</option>
              ))}
            </select>
            <button onClick={() => {
              const sel = saveListSelect
              if (sel) saveSelectedToList(sel)
            }} className="rounded bg-slate-700 text-white px-3 py-1 text-sm">Save</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-slate-600">
              <th className="p-3"><input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAll} /></th>
              <th className="p-3">Company</th>
              <th className="p-3">One-liner</th>
              <th className="p-3">Thesis match</th>
              <th className="p-3">Score</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map(({ company, score, signals }) => (
              <tr key={company.id} className="border-t">
                <td className="p-3"><input type="checkbox" checked={selected.includes(company.id)} onChange={() => toggleSelection(company.id)} /></td>
                <td className="p-3 w-48">
                  <div className="font-semibold">{company.name}</div>
                  <div className="text-xs text-slate-500">{company.sector} • {company.geography}</div>
                </td>
                <td className="p-3">{company.oneLiner}</td>
                <td className="p-3">
                  {/* Thesis match summary: show top 2 signals */}
                  <div className="text-sm">
                    {signals.slice(0,2).map(s => (
                      <div key={s.id} className="text-xs">
                        <span className="font-medium">{s.label}:</span> {s.reason} ({(s.strength*100).toFixed(0)}%)
                      </div>
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  <div className="inline-block px-2 py-1 rounded-full bg-slate-100 text-sm font-semibold">{(score.totalScore*100).toFixed(0)}</div>
                </td>
                <td className="p-3">
                  <button onClick={() => addToList('default', company.id)} className="rounded border px-2 py-1 text-sm">Save to list</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm">Showing {start + 1} - {Math.min(start + pageSize, total)} of {total}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border px-3 py-1">Prev</button>
          <div>Page {page}</div>
          <button onClick={() => setPage((p) => (p * pageSize < total ? p + 1 : p))} className="rounded border px-3 py-1">Next</button>
        </div>
      </div>
    </div>
  )
}
