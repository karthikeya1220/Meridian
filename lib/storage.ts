export const STORAGE_KEYS = {
  lists: 'xartup.lists.v1',
  savedSearches: 'xartup.savedSearches.v1',
  notes: (companyId: string) => `xartup.notes.${companyId}`,
  enrichment: (companyId: string) => `xartup.enrich.${companyId}`,
} as const

export default STORAGE_KEYS
