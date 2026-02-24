"use client"

import React, { useState } from 'react'
import useAppStore from '../../stores/useAppStore'
import type { Company } from '../../lib/mock-data'
import { useToast } from '../../components/ToastProvider'

function downloadCSV(rows: Record<string, any>[], filename = 'export.csv') {
  if (!rows || rows.length === 0) return
  const keys = Object.keys(rows[0])
  const csv = [keys.join(','), ...rows.map((r) => keys.map((k) => JSON.stringify(r[k] ?? '')).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ListsPage() {
  const lists = useAppStore((s) => s.lists)
  const companies = useAppStore((s) => s.companies)
  const createList = useAppStore((s) => s.createList)
  const addToList = useAppStore((s) => s.addToList)
  const removeFromList = useAppStore((s) => s.removeFromList)
  const deleteList = useAppStore((s) => s.deleteList)

  const [newListName, setNewListName] = useState('')
  const [selectedList, setSelectedList] = useState<string>('')
  const toast = useToast()

  const handleCreate = () => {
    if (!newListName) return
    createList(newListName)
    setSelectedList(newListName)
    setNewListName('')
  }

  const currentList = selectedList ? lists[selectedList] || [] : []

  const rows: Record<string, any>[] = currentList.map((id) => {
    const c = companies.find((x) => x.id === id) as Company | undefined
    return c
      ? {
          id: c.id,
          name: c.name,
          website: c.website,
          sector: c.sector,
          stage: c.stage,
          geography: c.geography,
          headcount: c.headcount,
          founded: c.founded,
          oneLiner: c.oneLiner,
          tags: (c.tags || []).join('|')
        }
      : { id }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Lists</h2>
      </div>

      <section className="bg-white border rounded p-4">
        <h3 className="text-lg font-medium">Create new list</h3>
        <div className="mt-3 flex gap-2">
          <input value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="List name" className="rounded border px-3 py-2" />
          <button onClick={handleCreate} className="rounded bg-slate-800 text-white px-4 py-2">Create</button>
        </div>
      </section>

      <section className="bg-white border rounded p-4">
        <h3 className="text-lg font-medium">Your lists</h3>
          <div className="mt-3 flex items-center gap-3">
          {Object.keys(lists).length === 0 ? (
            <div className="text-sm text-slate-600">No lists yet. Create one above to start organizing companies.</div>
          ) : (
            <>
              <select value={selectedList} onChange={(e) => setSelectedList(e.target.value)} className="rounded border px-3 py-2">
                <option value="">Select a list</option>
                {Object.keys(lists).map((name) => (
                  <option key={name} value={name}>{name} ({lists[name].length})</option>
                ))}
              </select>

              <button onClick={() => downloadCSV(rows, `${selectedList || 'list'}.csv`)} className="rounded border px-3 py-2">Export CSV</button>
              <button
                onClick={() => {
                  if (!selectedList) return
                  if (!window.confirm(`Delete list "${selectedList}"? This cannot be undone.`)) return
                  deleteList(selectedList)
                  setSelectedList('')
                  try { toast({ title: 'List deleted', message: `Deleted list ${selectedList}`, type: 'success' }) } catch (e) {}
                }}
                className="rounded border px-3 py-2 text-red-600"
              >
                Delete list
              </button>
            </>
          )}
        </div>

        <div className="mt-4">
          {selectedList ? (
            <div className="space-y-2">
              {currentList.length === 0 && <div className="text-sm text-slate-600">This list is empty</div>}
              {currentList.map((id) => {
                const c = companies.find((x) => x.id === id)
                return (
                  <div key={id} className="p-3 border rounded flex items-center justify-between">
                    <div>
                      <div className="font-medium">{c?.name ?? id}</div>
                      <div className="text-xs text-slate-500">{c?.oneLiner}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-slate-600">{c?.sector}</div>
                      <button onClick={() => {
                        removeFromList(selectedList, id)
                        try { toast({ title: 'Removed', message: `${c?.name ?? id} removed from ${selectedList}`, type: 'info' }) } catch (e) {}
                      }} className="rounded border px-3 py-1 text-sm text-red-600">Remove</button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-sm text-slate-600">Select a list to view its companies.</div>
          )}
        </div>
      </section>
    </div>
  )
}
