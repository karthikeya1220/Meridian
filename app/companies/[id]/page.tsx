import React from 'react'

type Props = { params: { id: string } }

export default function CompanyDetail({ params }: Props) {
  const { id } = params
  return (
    <div>
      <h2 className="text-2xl font-semibold">Company: {id}</h2>
      <p className="text-slate-600 mt-2">Placeholder for company detail, signals and score.</p>
    </div>
  )
}
