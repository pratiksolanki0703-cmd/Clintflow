import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Drawer({ isOpen, onClose, title, children, className }: { isOpen: boolean; onClose: () => void; title?: string; children: React.ReactNode; className?: string }) {
  useEffect(() => { if (!isOpen) return; const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', handler); return () => document.removeEventListener('keydown', handler) }, [isOpen, onClose])
  if (!isOpen) return null
  return <div className="fixed inset-0 z-50">
    <button aria-label="Close drawer" className="absolute inset-0 h-full w-full cursor-default bg-slate-950/40" onClick={onClose} />
    <section role="dialog" aria-modal="true" className={cn('absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-gray-200 bg-white shadow-2xl animate-slide-down dark:border-gray-700 dark:bg-gray-950', className)}>
      <div className="sticky top-0 z-10 flex min-h-16 items-center justify-between border-b border-gray-100 bg-white/90 px-6 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90"><h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2><button onClick={onClose} aria-label="Close"><X className="h-5 w-5 text-gray-500" /></button></div>
      <div className="p-6">{children}</div>
    </section>
  </div>
}
