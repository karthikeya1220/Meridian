"use client"

import React from 'react'
import SearchInput from './SearchInput'

export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Xartup</h1>
          <nav className="hidden sm:block text-sm text-slate-600">
            <span className="mr-3">Thesis</span>
            <span className="mr-3">Signals</span>
          </nav>
        </div>

        <div className="flex-1 px-4">
          <SearchInput />
        </div>

        <div className="ml-4"> 
          {/* future user menu / actions */}
        </div>
      </div>
    </header>
  )
}
