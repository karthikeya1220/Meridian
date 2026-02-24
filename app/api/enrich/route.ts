import { z } from 'zod'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// extractor base can be overridden in env (no trailing slash)
const EXTRACTOR_BASE = (process.env.EXTRACTOR_BASE || 'https://r.jina.ai').replace(/\/$/, '')

// CompanyFacts Zod schema - must match lib/signal-engine CompanyFacts shape
const BlogPost = z.object({ title: z.string().optional(), date: z.string().optional(), url: z.string().optional() })

const CompanyFactsSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  website: z.string().optional(),
  tags: z.array(z.string()).optional(),
  job_postings_count: z.number().optional(),
  careers_page: z.boolean().optional(),
  recent_hires_last_3_months: z.number().optional(),
  blog_posts: z.array(BlogPost).optional(),
  tech_stack: z.array(z.string()).optional(),
  repo_links: z.array(z.string()).optional(),
  product_stage: z.union([z.literal('prototype'), z.literal('beta'), z.literal('ga'), z.literal('scale')]).optional()
})

type CompanyFacts = z.infer<typeof CompanyFactsSchema>

async function fetchWithTimeout(url: string, ms = 10000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, { signal: controller.signal })
    return res
  } finally {
    clearTimeout(id)
  }
}

async function fetchJinaExtract(targetUrl: string) {
  try {
    // use extractor proxy (r.jina.ai) that accepts an http:// or https:// target path
    const api = `${EXTRACTOR_BASE}/http://${targetUrl.replace(/^https?:\/\//, '')}`
    const res = await fetchWithTimeout(api, 10000)
    const status = res?.status ?? 0
    if (!res || !res.ok) {
      // return status and null body
      return { status, text: null }
    }
    const text = await res.text()
    return { status, text }
  } catch (e: any) {
    return { status: 0, text: null, error: String(e?.message || e) }
  }
}

async function callOpenAI(prompt: string, timeoutMs = 10000) {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OpenAI API key missing')

  const body = {
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are an extraction engine. Respond with ONLY valid JSON that matches the provided schema. Do not include any additional text, commentary, or markdown.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0
  }

  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify(body),
      signal: controller.signal
    })
    const json = await res.json()
    // guard
    const content = json?.choices?.[0]?.message?.content
    return content
  } finally {
    clearTimeout(id)
  }
}

export async function POST(req: NextRequest) {
  try {
    // Simple rate-limit / auth guard using a shared secret header
    const token = req.headers.get('x-enrich-token')
    const secret = process.env.ENRICH_SECRET
    if (!secret || !token || token !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { companyId, website } = body as { companyId?: string; website?: string }
    if (!companyId || !website) {
      return NextResponse.json({ error: 'companyId and website required' }, { status: 400 })
    }

    // build urls to fetch via jina
    const base = website.replace(/\/$/, '')
    const paths = ['', 'about', 'careers']
    const urls = paths.map((p) => (p ? `${base}/${p}` : base))
  const EXTRACTOR_BASE = (process.env.EXTRACTOR_BASE || 'https://r.jina.ai').replace(/\/$/, '')

    const fetchPromises = urls.map((u) => fetchJinaExtract(u))
    const settled = await Promise.allSettled(fetchPromises)
    const sources: { url: string; status: string }[] = []
    const texts: string[] = []

    settled.forEach((r: any, i: number) => {
      const url = urls[i]
      if (r.status === 'fulfilled' && r.value) {
        const val = r.value as any
        if (val.text) {
          texts.push(val.text)
          sources.push({ url, status: `ok (${val.status || '200'})` })
        } else {
          const reason = val.error ? `error: ${val.error}` : `http ${val.status || 'err'}`
          sources.push({ url, status: reason })
        }
      } else {
        sources.push({ url, status: `fetch_failed` })
      }
    })

    const concatenated = texts.join('\n\n')
    const schemaDescription = `Expect a JSON object with these fields (types and short descriptions):\n- id: string (unique company id)\n- name: string (company display name)\n- website: string (company website URL)\n- tags: array of strings (topical tags or categories)\n- job_postings_count: integer (number of public job postings, if observable)\n- careers_page: boolean (true if careers page detected)\n- recent_hires_last_3_months: integer (count of hires in last 3 months, if available)\n- blog_posts: array of objects { title?: string, date?: string (ISO date), url?: string } (recent blog/update posts)\n- tech_stack: array of strings (languages/frameworks/platforms detected)\n- repo_links: array of strings (public repo URLs found)\n- product_stage: string (one of 'prototype','beta','ga','scale')\n\nOnly include fields that can be confidently extracted. Return only valid JSON that matches these types.`

    const prompt = `Extract factual company fields as JSON matching this schema description:\n\n${schemaDescription}\n\nSource text:\n${concatenated.slice(0, 20000)}\n\nReturn ONLY the JSON object and no additional commentary.`

    // call OpenAI and parse
    let attempt = 0
    let content: string | null = null
    let parsed: CompanyFacts | null = null
    let lastError: any = null
    while (attempt < 2 && !parsed) {
      attempt += 1
      try {
        content = await callOpenAI(prompt, 10000)
        if (!content) throw new Error('empty response from model')
  // strip fences and whitespace
  const jsonText = content.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '')
        let obj: any = null
        try {
          obj = JSON.parse(jsonText)
        } catch (pe: any) {
          throw new Error('JSON parse error: ' + String((pe as any)?.message ?? String(pe)))
        }
        try {
          const parsedResult = CompanyFactsSchema.parse(obj)
          parsed = parsedResult
          break
        } catch (ze: any) {
          // Zod error - collect details and allow retry
          lastError = ze
          throw ze
        }
      } catch (err: any) {
        lastError = err
        // retry once on parse/validation failure
        if (attempt < 2) await new Promise((r) => setTimeout(r, 500))
      }
    }

    if (!parsed) {
      // build descriptive validation errors if available
      let details: any = null
      if (lastError && (lastError.issues || lastError.errors)) {
        details = lastError.issues || lastError.errors
      } else if (lastError && lastError.message) {
        details = lastError.message
      }
      return NextResponse.json({ facts: null, sources, enrichedAt: new Date().toISOString(), error: 'Failed to extract valid CompanyFacts', details }, { status: 422 })
    }

    return NextResponse.json({ facts: parsed, sources, enrichedAt: new Date().toISOString() })
  } catch (e: any) {
    return NextResponse.json({ facts: null, sources: [], enrichedAt: new Date().toISOString(), error: String(e?.message || e) }, { status: 500 })
  }
}

export const runtime = 'nodejs'
