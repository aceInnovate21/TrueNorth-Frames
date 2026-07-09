'use client'

import type { StorageUsage } from '@/lib/storage-quota'

// Percentage-based portfolio storage meter. Deliberately shows only percentages
// (never raw MB / the quota size) so the underlying limit stays private.
export function StorageMeter({ usage, className = '' }: { usage: StorageUsage | null; className?: string }) {
  if (!usage) return null
  const near = usage.pct >= 80
  const full = usage.pct >= 100
  const barColor = full ? 'bg-red-500' : near ? 'bg-amber-500' : 'bg-ink'
  const pctOf = (bytes: number) => (usage.quota_bytes > 0 ? Math.round((bytes / usage.quota_bytes) * 100) : 0)

  return (
    <div className={`bg-white rounded-xl px-4 py-3 ${className}`} style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-ink">Storage used</p>
        <p className={`text-xs font-bold tabular-nums ${full ? 'text-red-500' : near ? 'text-amber-600' : 'text-ink'}`}>
          {usage.pct}%
        </p>
      </div>
      <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${Math.min(100, Math.max(2, usage.pct))}%` }} />
      </div>
      <div className="flex items-center gap-3 mt-2 text-[10px] text-ink-300">
        <span>Photos {pctOf(usage.photos_bytes)}%</span>
        <span>Videos {pctOf(usage.videos_bytes)}%</span>
        {usage.profile_bytes > 0 && <span>Profile {pctOf(usage.profile_bytes)}%</span>}
        {usage.messages_bytes > 0 && <span>Messages {pctOf(usage.messages_bytes)}%</span>}
        {near && (
          <span className={`ml-auto font-semibold ${full ? 'text-red-500' : 'text-amber-600'}`}>
            {full ? 'Storage full — delete to free space' : 'Almost full'}
          </span>
        )}
      </div>
    </div>
  )
}
