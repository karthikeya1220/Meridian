"use client"

import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import ToastProvider from './ToastProvider'
import ErrorBoundary from './ErrorBoundary'

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        {/* Sidebar - desktop + slide-over on mobile */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* mobile slide-over */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r p-4 overflow-auto">
              <Sidebar />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <Header onMenuToggle={() => setMobileOpen((s) => !s)} />
          <main className="p-6">
            <div className="container">
              <ErrorBoundary>{children}</ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
