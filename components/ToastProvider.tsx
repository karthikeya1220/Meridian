"use client"

import React, { createContext, useCallback, useContext, useState } from 'react'

type Toast = { id: string; title?: string; message: string; type?: 'info' | 'success' | 'error' }

const ToastContext = createContext<{ toast: (t: Omit<Toast, 'id'>) => void } | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.toast
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}`
    const nt: Toast = { id, ...t }
    setToasts((s) => [nt, ...s])
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 5000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`max-w-sm w-full rounded p-3 shadow ${t.type === 'error' ? 'bg-red-50 border border-red-200' : t.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-white border'}`}>
            {t.title && <div className="font-medium mb-1">{t.title}</div>}
            <div className="text-sm">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
