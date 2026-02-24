"use client"

import React, { useEffect, useState } from 'react'
import { evaluateFromFacts } from '../lib/evaluate'
import type { Company } from '../lib/mock-data'
import { useToast } from './ToastProvider'
import { STORAGE_KEYS } from '../lib/storage'

type EnrichCache = {
  facts: any
  signals: any
  score: any
  sources: { url: string; status: string }[]
  enrichedAt: string
}

const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function fetchWithTimeout(url: string, opts: RequestInit = {}, ms = 10000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  const signal = controller.signal
  return fetch(url, { ...opts, signal }).finally(() => clearTimeout(id))
}

function safeJsonParse(input: any) {
  try {
    return typeof input === 'string' ? JSON.parse(input) : input
  } catch (e) {
    return null
  }
}

export default function EnrichmentPanel({ company }: { company: Company }) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<EnrichCache | null>(null)
  const toast = useToast()

  const cacheKey = STORAGE_KEYS.enrichment(company.id)

  const ENRICH_PUBLIC = (process.env.NEXT_PUBLIC_ENRICH_SECRET || '')

  useEffect(() => {
    // hydrate from cache if present and fresh
    try {
      const raw = localStorage.getItem(cacheKey)
      if (!raw) return
      const parsed = safeJsonParse(raw) as EnrichCache | null
      if (!parsed) return
      const age = Date.now() - new Date(parsed.enrichedAt).getTime()
      if (age < TTL_MS) {
        setData(parsed)
        setState('success')
      }
    } catch (e) {
      // ignore
    }
  }, [cacheKey])

  async function runEnrich(force = false) {
    setError(null)
    setState('loading')

    try {
      if (!force) {
        const raw = localStorage.getItem(cacheKey)
        if (raw) {
          const parsed = safeJsonParse(raw) as EnrichCache | null
          if (parsed) {
            const age = Date.now() - new Date(parsed.enrichedAt).getTime()
            if (age < TTL_MS) {
              setData(parsed)
              setState('success')
              return
            }
          }
        }
      }

      const res = await fetchWithTimeout(
        '/api/enrich',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-enrich-token': ENRICH_PUBLIC },
          body: JSON.stringify({ companyId: company.id, website: company.website })
        },
        12000
      )

      let json: any = null
      try {
        json = await res.json()
      } catch (e) {
        throw new Error('Invalid JSON response from enrichment API')
      }

      if (!res.ok) throw new Error(json?.error || 'Enrichment failed')

      const facts = json.facts
      const sources = json.sources || []

      // derive signals and score via centralized evaluator (LLM -> Facts -> Signals -> Score)
      const { signals, score } = evaluateFromFacts(company, facts)

      const payload: EnrichCache = {
        facts,
        signals,
        score,
        sources,
        enrichedAt: json.enrichedAt || new Date().toISOString()
      }

      try {
        localStorage.setItem(cacheKey, JSON.stringify(payload))
      } catch (e) {
        // ignore storage errors
      }

      setData(payload)
      setState('success')
      toast({ title: 'Enrichment complete', message: `Enriched ${company.name}`, type: 'success' })
    } catch (err: any) {
      const msg = err?.message || String(err)
      setError(msg)
      setState('error')
      try {
        toast({ title: 'Enrichment failed', message: msg, type: 'error' })
      } catch (e) {
        // toast may fail silently
      }
    }
  }

  const isStale = data ? Date.now() - new Date(data.enrichedAt).getTime() > TTL_MS : true

  return (
    <div className="bg-white border rounded p-4">
      <h3 className="text-lg font-semibold">Enrichment</h3>

      {state === 'idle' && (
        <div className="mt-3">
          <button onClick={() => runEnrich(false)} className="w-full rounded bg-slate-800 text-white px-3 py-2">Run enrichment</button>
        </div>
      )}

      {state === 'loading' && (
        <div className="mt-3">
          <div className="h-6 bg-slate-100 rounded animate-pulse w-3/4 mb-2" />
          <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
        </div>
      )}

      {state === 'error' && (
        <div className="mt-3 text-sm text-red-600">
          <div>Error: {error}</div>
          <div className="mt-2">
            <button onClick={() => runEnrich(true)} className="rounded border px-3 py-1">Retry</button>
          </div>
        </div>
      )}

      {state === 'success' && data && (
        <div className="mt-3 space-y-3 text-sm text-slate-700">
          <div className="flex items-center justify-between">
            <div>Last indexed: <span className="font-medium">{new Date(data.enrichedAt).toLocaleString()}</span></div>
            <div>
              <button onClick={() => runEnrich(true)} className="rounded border px-2 py-1 text-xs">Re-enrich</button>
            </div>
          </div>

          <div>
            <h4 className="font-medium">Summary</h4>
            <div className="text-xs text-slate-600">{data.facts?.name || company.name} — extracted facts available.</div>
          </div>

          <div>
            <h4 className="font-medium">Bullets</h4>
            <ul className="list-disc ml-5 text-xs">
              {data.facts?.tags && <li>Tags: {(data.facts.tags || []).join(', ')}</li>}
              {typeof data.facts?.job_postings_count !== 'undefined' && <li>Job postings: {data.facts.job_postings_count}</li>}
              {data.facts?.careers_page && <li>Careers page detected</li>}
            </ul>
          </div>

          <div>
            <h4 className="font-medium">Keywords</h4>
            <div className="text-xs">{[...(data.facts?.tags || []), ...(data.facts?.tech_stack || [])].slice(0, 10).join(', ')}</div>
          </div>

          <div>
            <h4 className="font-medium">Signals</h4>
            <div className="space-y-2">
              {data.signals?.map((s: any) => (
                <div key={s.id} className="text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{s.label}</div>
                    <div className="text-slate-600">{Math.round(s.strength * 100)}%</div>
                  </div>
                  <div className="text-xs text-slate-500">{s.reason}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium">Scraped sources</h4>
            <ul className="text-xs list-disc ml-5">
              {data.sources.map((s) => (
                <li key={s.url}>{s.url} — <span className="font-mono text-xs">{s.status}</span></li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
