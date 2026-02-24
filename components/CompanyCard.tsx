"use client"

import React from 'react'
import Link from 'next/link'

type Company = {
  id: string
  name: string
  description?: string
}

export default function CompanyCard({ company }: { company: Company }) {
  return (
    <div className="rounded-md border bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold">
            <Link href={`/companies/${company.id}`}>{company.name}</Link>
          </h3>
          <p className="text-xs text-slate-600 mt-1">{company.description}</p>
        </div>
      </div>
    </div>
  )
}
