import React from 'react'
import CompanyCard from '../../components/CompanyCard'

const MOCK = [
  { id: 'acme', name: 'Acme Labs', description: 'Hardware + ML for robotics' },
  { id: 'nova', name: 'Nova Health', description: 'SaaS for clinics' }
]

export default function CompaniesPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Companies</h2>
      <div className="grid gap-4">
        {MOCK.map((c) => (
          <CompanyCard key={c.id} company={c} />
        ))}
      </div>
    </div>
  )
}
