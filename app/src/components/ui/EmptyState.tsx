import { Inbox } from 'lucide-react'
import { Button } from './index'

export function EmptyState({ title, description, action, icon: Icon = Inbox }: { title: string; description: string; action?: { label: string; onClick: () => void }; icon?: React.ComponentType<{ className?: string }> }) {
  return <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center dark:border-gray-700 dark:bg-gray-900"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300"><Icon className="h-6 w-6" /></div><h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3><p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>{action && <Button className="mt-5" onClick={action.onClick}>{action.label}</Button>}</div>
}
