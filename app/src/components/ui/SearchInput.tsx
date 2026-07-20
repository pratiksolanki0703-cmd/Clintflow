import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../../lib/utils'

export function SearchInput({ value, onChange, placeholder = 'Search...', delay = 250, className }: {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  delay?: number
  className?: string
}) {
  const [draft, setDraft] = useState(value || '')
  useEffect(() => setDraft(value || ''), [value])
  useEffect(() => {
    const timer = window.setTimeout(() => onChange(draft), delay)
    return () => window.clearTimeout(timer)
  }, [draft, delay, onChange])
  return <div className={cn('relative', className)}>
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    <input value={draft} onChange={e => setDraft(e.target.value)} placeholder={placeholder} aria-label={placeholder}
      className="min-h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-10 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
    {draft && <button type="button" aria-label="Clear search" onClick={() => setDraft('')} className="absolute right-2 top-1/2 min-h-8 -translate-y-1/2 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"><X className="h-4 w-4" /></button>}
  </div>
}
