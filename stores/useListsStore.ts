import create from 'zustand'

type ListsState = {
  lists: Record<string, string[]>
  addList: (name: string) => void
  addToList: (name: string, id: string) => void
}

const STORAGE_KEY = 'xartup.lists.v1'

const initial = () => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    return {}
  }
}

export const useListsStore = create<ListsState>((set, get) => ({
  lists: initial(),
  addList(name) {
    set((s) => {
      if (s.lists[name]) return s
      const next = { ...s.lists, [name]: [] }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch (e) {}
      return { lists: next }
    })
  },
  addToList(name, id) {
    set((s) => {
      const arr = s.lists[name] || []
      if (arr.includes(id)) return s
      const next = { ...s.lists, [name]: [...arr, id] }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch (e) {}
      return { lists: next }
    })
  }
}))
