import create from 'zustand'
import { MOCK_COMPANIES, type Company } from '../lib/mock-data'
import { STORAGE_KEYS } from '../lib/storage'

type ListsRecord = Record<string, string[]>

type SavedSearch = {
  id: string
  name: string
  query: string
  createdAt: string
}

type AppState = {
  companies: Company[]
  selectedCompanies: string[]
  lists: ListsRecord
  savedSearches: SavedSearch[]

  // actions
  toggleCompanySelection: (id: string) => void
  addToList: (listName: string, companyId: string) => void
  createList: (listName: string) => void
  removeFromList: (listName: string, companyId: string) => void
  deleteList: (listName: string) => void
  saveSearch: (name: string, query: string) => void
  rehydrateFromStorage: () => void
}

const LISTS_KEY = STORAGE_KEYS.lists
const SAVED_SEARCHES_KEY = STORAGE_KEYS.savedSearches

function readListsFromStorage(): ListsRecord {
  try {
    if (typeof window === 'undefined') return {}
    const raw = localStorage.getItem(LISTS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    return {}
  }
}

function writeListsToStorage(lists: ListsRecord) {
  try {
    if (typeof window === 'undefined') return
    localStorage.setItem(LISTS_KEY, JSON.stringify(lists))
  } catch (e) {
    // noop
  }
}

function readSearchesFromStorage(): SavedSearch[] {
  try {
    if (typeof window === 'undefined') return []
    const raw = localStorage.getItem(SAVED_SEARCHES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

function writeSearchesToStorage(items: SavedSearch[]) {
  try {
    if (typeof window === 'undefined') return
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(items))
  } catch (e) {
    // noop
  }
}

export const useAppStore = create<AppState>((set, get) => {
  // On initialization, attempt to hydrate lists and searches from localStorage (client-only)
  const initialLists = typeof window !== 'undefined' ? readListsFromStorage() : {}
  const initialSearches = typeof window !== 'undefined' ? readSearchesFromStorage() : []

  return {
    companies: MOCK_COMPANIES,
    selectedCompanies: [],
    lists: initialLists,
    savedSearches: initialSearches,

    toggleCompanySelection(id: string) {
      const selected = new Set(get().selectedCompanies)
      if (selected.has(id)) {
        selected.delete(id)
      } else {
        selected.add(id)
      }
      set({ selectedCompanies: Array.from(selected) })
    },

    addToList(listName: string, companyId: string) {
      set((state) => {
        const lists = { ...state.lists }
        if (!lists[listName]) lists[listName] = []
        if (!lists[listName].includes(companyId)) {
          lists[listName] = [...lists[listName], companyId]
        }
        writeListsToStorage(lists)
        return { lists }
      })
    },

    removeFromList(listName: string, companyId: string) {
      set((state) => {
        const lists = { ...state.lists }
        const arr = lists[listName] || []
        const nextArr = arr.filter((id) => id !== companyId)
        if (nextArr.length === arr.length) return { lists } // nothing changed
        if (nextArr.length > 0) {
          lists[listName] = nextArr
        } else {
          // if list becomes empty, keep as empty array (do not auto-delete)
          lists[listName] = []
        }
        writeListsToStorage(lists)
        return { lists }
      })
    },

    deleteList(listName: string) {
      set((state) => {
        const lists = { ...state.lists }
        if (lists[listName]) {
          delete lists[listName]
          writeListsToStorage(lists)
        }
        return { lists }
      })
    },

    createList(listName: string) {
      set((state) => {
        const lists = { ...state.lists }
        if (!lists[listName]) {
          lists[listName] = []
          writeListsToStorage(lists)
        }
        return { lists }
      })
    },

    saveSearch(name: string, query: string) {
      set((state) => {
        const item: SavedSearch = {
          id: `${Date.now()}`,
          name,
          query,
          createdAt: new Date().toISOString()
        }
        const next = [...state.savedSearches, item]
        writeSearchesToStorage(next)
        return { savedSearches: next }
      })
    },

    rehydrateFromStorage() {
      const lists = readListsFromStorage()
      const searches = readSearchesFromStorage()
      set({ lists, savedSearches: searches })
    }
  }
})

export default useAppStore
