export default function Loading({ label = 'Loading…' }: { label?: string }) {
  return <p className="text-sm text-slate-600 dark:text-slate-300">{label}</p>
}
