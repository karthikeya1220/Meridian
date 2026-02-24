"use client"

import React from 'react'
import SearchInput from './SearchInput'

export default function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
  return (
    <header className="border-b bg-white">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-4">
          <button onClick={onMenuToggle} className="md:hidden p-2 rounded hover:bg-slate-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2z" clipRule="evenodd"/></svg>
          </button>
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
