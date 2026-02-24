"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

export default function Sidebar() {
  const pathname = usePathname()

  const nav = [
    { label: 'Companies', href: '/companies' },
    { label: 'Lists', href: '/lists' },
    { label: 'Saved', href: '/saved' }
  ]

  return (
    <aside className="w-72 bg-white border-r h-screen sticky top-0">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Xartup</h2>
        <nav className="space-y-2">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-50 ${
                pathname === n.href ? 'bg-slate-100' : ''
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}
