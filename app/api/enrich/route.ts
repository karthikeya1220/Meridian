import { z } from 'zod'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

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

async function fetchWithTimeout(url: string, ms = 8000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, { signal: controller.signal })
    return res
  } finally {
    clearTimeout(id)
  }
}

async function fetchJinaExtract(url: string) {
  try {
    // r.jina.ai/http://{target} returns a plain text extracted view
    const encoded = encodeURIComponent(url)
    const api = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`
    const res = await fetchWithTimeout(api, 6000)
    if (!res.ok) return null
    const text = await res.text()
    return text
  } catch (e) {
    return null
  }
}

async function callOpenAI(prompt: string, timeoutMs = 12000) {
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
    const body = await req.json()
    const { companyId, website } = body as { companyId?: string; website?: string }
    if (!companyId || !website) {
      return NextResponse.json({ error: 'companyId and website required' }, { status: 400 })
    }

    // build urls to fetch via jina
    const host = website.replace(/^https?:\/\//, '')
    const paths = ['', 'about', 'careers']
    const fetches = paths.map((p) => {
      const candidate = p ? `${host.replace(/\/$/, '')}/${p}` : host
      return fetchJinaExtract(candidate)
    })

    const results = await Promise.allSettled(fetches)
    const sources: { url: string; ok: boolean }[] = []
    const texts: string[] = []
    results.forEach((r, i) => {
      const url = paths[i] ? `${website.replace(/\/$/, '')}/${paths[i]}` : website
      if (r.status === 'fulfilled' && r.value) {
        texts.push(r.value)
        sources.push({ url, ok: true })
      } else {
        sources.push({ url, ok: false })
      }
    })

    const concatenated = texts.join('\n\n')
    const prompt = `Extract factual company fields as JSON matching this schema:\n
${CompanyFactsSchema.toString()}\n\n
Source text:\n${concatenated.slice(0, 20000)}\n\n
Return only JSON that validates against the schema.`

    // call OpenAI and parse
    let attempt = 0
    let content: string | null = null
    let parsed: CompanyFacts | null = null
    let lastError: string | null = null
    while (attempt < 2 && !parsed) {
      attempt += 1
      try {
        content = await callOpenAI(prompt, 12000)
        if (!content) throw new Error('empty response from model')
        // Try to extract JSON - allow the model to return codeblocks, so strip non-json
        const jsonText = content.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '')
        const obj = JSON.parse(jsonText)
        const parsedResult = CompanyFactsSchema.parse(obj)
        parsed = parsedResult
        break
      } catch (err: any) {
        lastError = String(err?.message || err)
        // if first attempt failed to parse, retry once with stricter prompt
        if (attempt < 2) {
          // small backoff
          await new Promise((r) => setTimeout(r, 500))
        }
      }
    }

    if (!parsed) {
      return NextResponse.json({ error: 'Failed to extract valid CompanyFacts', details: lastError, sources, timestamp: new Date().toISOString() }, { status: 422 })
    }

    return NextResponse.json({ extract: parsed, sources, timestamp: new Date().toISOString() })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

export const runtime = 'edge'
