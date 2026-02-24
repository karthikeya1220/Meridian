"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  onSearch?: (q: string) => void
}

export default function SearchInput({ onSearch }: Props) {
  const [q, setQ] = useState('')
  const router = useRouter()

  async function submit(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = q.trim()
    // If a parent provided an onSearch handler, call it.
    if (onSearch) {
      onSearch(trimmed)
      return
    }

    // Default behavior: navigate to /companies with or without query
    const target = trimmed ? `/companies?q=${encodeURIComponent(trimmed)}` : '/companies'
    router.push(target)
  }

  return (
    <form onSubmit={submit} className="max-w-md">
      <label htmlFor="global-search" className="sr-only">
        Search companies
      </label>
      <div className="relative">
        <input
          id="global-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm bg-white"
          placeholder="Search companies, signals, or thesis..."
        />
        <button
          type="submit"
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded px-3 py-1 text-sm bg-slate-100"
        >
          Search
        </button>
      </div>
    </form>
  )
}
