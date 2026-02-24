"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import useAppStore from '../../../stores/useAppStore'
import { evaluateCompany, evaluateFromFacts } from '../../../lib/evaluate'
import EnrichmentPanel from '../../../components/EnrichmentPanel'
import { STORAGE_KEYS } from '../../../lib/storage'
import type { Company } from '../../../lib/mock-data'

export default function CompanyDetailClient() {
  const params = useParams()
  const id = params?.id as string
  const companies = useAppStore((s) => s.companies)
  const addToList = useAppStore((s) => s.addToList)
  const lists = useAppStore((s) => s.lists)
  const removeFromList = useAppStore((s) => s.removeFromList)

  const [selectedSaveList, setSelectedSaveList] = useState<string>('')

  const company = companies.find((c) => c.id === id) as Company | undefined
  // Local notes persisted per-company
  const [notes, setNotes] = useState<string>(() => {
    try {
      if (typeof window === 'undefined') return ''
      return localStorage.getItem(STORAGE_KEYS.notes(id)) || ''
    } catch (e) {
      return ''
    }
  })

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEYS.notes(id), notes || '')
      } catch (e) {}
    }, 500)
    return () => clearTimeout(t)
  }, [id, notes])

  // derive signals and score via centralized evaluator
  const evalData = useMemo(() => (company ? evaluateCompany(company) : null), [company])
  const signals = evalData ? evalData.signals : []
  const score = evalData ? evalData.score : null

  if (!company) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold">Company not found</h2>
      </div>
    )
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column */}
      <div className="lg:col-span-2 space-y-6">
        <section className="bg-white border rounded p-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{company.name}</h1>
              <div className="text-sm text-slate-600">{company.oneLiner}</div>
              <div className="mt-2 text-xs text-slate-500">{company.sector} • {company.stage} • {company.geography}</div>
            </div>
            <div className="text-right">
              <a href={company.website} className="text-sm text-sky-600" target="_blank" rel="noreferrer">Website</a>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {company.tags.map((t) => (
                <span key={t} className="text-xs bg-slate-100 px-2 py-1 rounded">{t}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white border rounded p-4">
          <h3 className="text-lg font-semibold">Score</h3>
          <div className="mt-3 flex items-center gap-4">
            <div className="text-4xl font-bold">{score ? Math.round(score.totalScore * 100) : '--'}</div>
            <div>
              <div className="text-sm text-slate-600">Overall thesis match</div>
              <div className="text-xs text-slate-500">{score?.explanation?.[0]}</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="p-2 border rounded text-center">
              <div className="text-xs text-slate-500">Sector</div>
              <div className="font-medium">{(score?.breakdown.sectorScore ?? 0).toFixed(2)}</div>
            </div>
            <div className="p-2 border rounded text-center">
              <div className="text-xs text-slate-500">Stage</div>
              <div className="font-medium">{(score?.breakdown.stageScore ?? 0).toFixed(2)}</div>
            </div>
            <div className="p-2 border rounded text-center">
              <div className="text-xs text-slate-500">Geography</div>
              <div className="font-medium">{(score?.breakdown.geographyScore ?? 0).toFixed(2)}</div>
            </div>
          </div>
        </section>

        <section className="bg-white border rounded p-4">
          <h3 className="text-lg font-semibold">Score breakdown</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {score?.explanation.map((line, i) => {
              const isDeduction = /deduction/i.test(line)
              return (
                <li key={i} className={isDeduction ? 'text-red-600' : ''}>• {line}</li>
              )
            })}
          </ul>
        </section>

        <section className="bg-white border rounded p-4">
          <h3 className="text-lg font-semibold">Explanation</h3>
          <div className="mt-3 text-sm text-slate-700">
            {score ? (
              <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(score.breakdown, null, 2)}</pre>
            ) : (
              <div>No score available</div>
            )}
          </div>
        </section>

        <section className="bg-white border rounded p-4">
          <h3 className="text-lg font-semibold">Signals timeline</h3>
          <div className="mt-4 space-y-4">
            {signals.map((s, idx) => (
              <div key={s.id} className="flex items-start gap-4">
                <div className="w-8 text-xs text-slate-500">{idx + 1}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{s.label}</div>
                    <div className="text-xs text-slate-600">{Math.round(s.strength * 100)}%</div>
                  </div>
                  <div className="text-xs text-slate-600">{s.reason}</div>
                  <div className="mt-2 h-2 bg-slate-100 rounded overflow-hidden">
                    <div style={{ width: `${s.strength * 100}%` }} className="h-2 bg-sky-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Right column */}
      <aside className="space-y-4">
        <section className="bg-white border rounded p-4">
          <h3 className="text-lg font-semibold">Save</h3>
          <div className="mt-3">
            <select value={selectedSaveList} onChange={(e) => setSelectedSaveList(e.target.value)} className="w-full rounded border px-2 py-1">
              <option value="">Choose list...</option>
              {Object.keys(lists).map((name) => (
                <option key={name} value={name}>{name} ({lists[name].length})</option>
              ))}
            </select>
            <button
              onClick={() => {
                const sel = selectedSaveList
                if (!sel) return
                const isMember = lists[sel]?.includes(company.id)
                if (isMember) removeFromList(sel, company.id)
                else addToList(sel, company.id)
              }}
              className="mt-2 w-full rounded bg-slate-800 text-white px-3 py-2"
            >
              {selectedSaveList && lists[selectedSaveList]?.includes(company.id) ? 'Remove from list' : 'Save to list'}
            </button>
          </div>
        </section>

        <section className="bg-white border rounded p-4">
          <h3 className="text-lg font-semibold">Notes</h3>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full h-36 mt-2 border rounded p-2" />
        </section>

        {/* Enrichment panel */}
        <div>
          {/* use a dedicated component for enrichment UI */}
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-ignore */}
          <EnrichmentPanel company={company} />
        </div>
      </aside>
    </div>
  )
}
