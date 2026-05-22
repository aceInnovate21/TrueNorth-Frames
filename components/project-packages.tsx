'use client'

import { useState } from 'react'
import { CheckCircle2, Package, Plus, Save, Trash2, X } from 'lucide-react'

import { PLATFORM_CONFIG } from '@/lib/platform-config'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProjectPackage {
  id: string
  name: string
  description: string
  price: string
  billing_type: 'hourly' | 'package'   // Matches DBML photographer_packages.billing_type enum
  includes: string[]                    // Matches DBML deliverables text[]
  popular: boolean
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_PACKAGES: ProjectPackage[] = [
  {
    id: 'pkg1', name: 'Mini Session', description: '30-minute portrait or family session, ideal for quick updates.',
    price: '150', billing_type: 'package', popular: false,
    includes: ['30-minute session', 'Up to 5 edited photos', 'Online gallery (30 days)'],
  },
  {
    id: 'pkg2', name: 'Standard Session', description: 'Full portrait, newborn, or corporate session with more variety.',
    price: '350', billing_type: 'package', popular: true,
    includes: ['90-minute session', 'Up to 25 edited photos', 'Online gallery (90 days)', '1 location'],
  },
  {
    id: 'pkg3', name: 'Wedding Day', description: 'Full wedding day coverage from getting ready to reception.',
    price: '2200', billing_type: 'package',
    includes: ['8 hours of coverage', '400+ edited photos', 'Two photographers', 'Private online gallery', 'USB drive delivery'],
    popular: false,
  },
]

// ─── PackageCard ──────────────────────────────────────────────────────────────

function PackageCard({
  pkg,
  isNew,
  onUpdate,
  onSave,
  onRemove,
}: {
  pkg: ProjectPackage
  isNew?: boolean
  onUpdate: (p: ProjectPackage) => void
  onSave: (p: ProjectPackage) => Promise<void>
  onRemove: () => void
}) {
  const [editing, setEditing] = useState(!!isNew)
  const [draft, setDraft] = useState({ ...pkg })
  const [newInclude, setNewInclude] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  async function save() {
    if (!draft.name.trim()) { setSaveError('Name is required'); return }
    if (!draft.price || isNaN(parseFloat(String(draft.price)))) { setSaveError('Price is required'); return }
    setSaveError('')
    setSaving(true)
    await onSave(draft)
    setSaving(false)
    setEditing(false)
  }

  function addInclude() {
    if (!newInclude.trim()) return
    setDraft(d => ({ ...d, includes: [...d.includes, newInclude.trim()] }))
    setNewInclude('')
  }

  function removeInclude(i: number) {
    setDraft(d => ({ ...d, includes: d.includes.filter((_, idx) => idx !== i) }))
  }

  if (!editing) {
    return (
      <div className={`bg-white rounded-2xl p-5 border relative ${pkg.popular ? 'border-ink ring-1 ring-ink' : 'border-ink-100'}`}>
        {pkg.popular && (
          <span className="absolute -top-2.5 left-4 bg-ink text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            Most popular
          </span>
        )}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-semibold text-ink text-sm">{pkg.name}</p>
            <p className="text-xs text-ink-300 mt-0.5">{pkg.description}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-ink">${pkg.price}</p>
            <p className="text-[10px] text-ink-300">{pkg.billing_type === 'hourly' ? 'per hour' : 'flat rate'}</p>
          </div>
        </div>

        <ul className="space-y-1.5 mb-4">
          {pkg.includes.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-ink-500">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <button
            onClick={() => { setDraft({ ...pkg }); setEditing(true) }}
            className="flex-1 text-xs font-medium border border-ink-100 rounded-xl py-2 hover:bg-ink-50 transition-colors text-ink-500"
          >
            Edit
          </button>
          <button
            onClick={() => onSave({ ...pkg, popular: !pkg.popular })}
            className={`text-xs font-medium border px-3 py-2 rounded-xl transition-colors ${
              pkg.popular ? 'bg-ink text-white border-ink' : 'border-ink-100 text-ink-400 hover:border-ink-300'
            }`}
          >
            {pkg.popular ? '★ Popular' : 'Mark popular'}
          </button>
          {confirmingDelete ? (
            <div className="flex items-center gap-1.5 border border-red-200 rounded-xl px-2 py-1 bg-red-50">
              <span className="text-xs text-red-700 font-medium whitespace-nowrap">Delete?</span>
              <button onClick={onRemove} className="text-xs font-semibold text-red-700 hover:text-red-900 px-1.5 py-0.5 rounded-lg hover:bg-red-100 transition-colors">Yes</button>
              <button onClick={() => setConfirmingDelete(false)} className="text-xs text-ink-400 hover:text-ink px-1.5 py-0.5 rounded-lg hover:bg-ink-100 transition-colors">No</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="p-2 rounded-xl border border-ink-100 text-ink-300 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-ink space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Editing package</p>
        <button onClick={() => isNew ? onRemove() : setEditing(false)} className="text-ink-300 hover:text-ink">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <input
          type="text" value={draft.name}
          onChange={e => { if (e.target.value.length <= PLATFORM_CONFIG.max_package_name_length) setDraft(d => ({ ...d, name: e.target.value })) }}
          maxLength={PLATFORM_CONFIG.max_package_name_length}
          placeholder="Package name"
          className="w-full border border-ink-100 rounded-xl px-4 py-2.5 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink"
        />
        <div className="relative">
          <textarea
            rows={2} value={draft.description}
            onChange={e => { if (e.target.value.length <= PLATFORM_CONFIG.max_package_description_length) setDraft(d => ({ ...d, description: e.target.value })) }}
            maxLength={PLATFORM_CONFIG.max_package_description_length}
            placeholder="Short description"
            className="w-full border border-ink-100 rounded-xl px-4 py-2.5 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink resize-none"
          />
          {draft.description.length > PLATFORM_CONFIG.max_package_description_length - 100 && (
            <span className={`absolute bottom-2 right-2 text-[10px] ${draft.description.length >= PLATFORM_CONFIG.max_package_description_length ? 'text-red-500' : 'text-amber-500'}`}>
              {draft.description.length}/{PLATFORM_CONFIG.max_package_description_length}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300 text-sm font-medium">$</span>
            <input
              type="number" value={draft.price} min={0}
              onChange={e => setDraft(d => ({ ...d, price: e.target.value }))}
              placeholder="0"
              className="w-full border border-ink-100 rounded-xl pl-7 pr-4 py-2.5 text-sm text-ink outline-none focus:border-ink"
            />
          </div>
          <select
            value={draft.billing_type}
            onChange={e => setDraft(d => ({ ...d, billing_type: e.target.value as 'hourly' | 'package' }))}
            className="border border-ink-100 rounded-xl px-3 py-2.5 text-sm text-ink outline-none focus:border-ink bg-white"
          >
            <option value="package">Flat rate</option>
            <option value="hourly">Per hour</option>
          </select>
        </div>

        {/* Includes list */}
        <div>
          <p className="text-xs font-medium text-ink mb-2">What's included</p>
          <div className="space-y-1.5 mb-2">
            {draft.includes.map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-ink-50 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-xs text-ink-500 flex-1">{item}</span>
                <button onClick={() => removeInclude(i)} className="text-ink-300 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text" value={newInclude}
              onChange={e => setNewInclude(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addInclude()}
              placeholder="Add an include item…"
              className="flex-1 border border-ink-100 rounded-xl px-3 py-2 text-xs text-ink placeholder-ink-200 outline-none focus:border-ink"
            />
            <button
              onClick={addInclude}
              className="px-3 py-2 bg-ink-50 rounded-xl text-ink-400 hover:text-ink hover:bg-ink-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {saveError && <p className="text-xs text-red-500">{saveError}</p>}
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 text-sm font-semibold bg-ink text-white px-4 py-2.5 rounded-xl hover:bg-ink-800 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save package'}
        </button>
        {isNew && (
          <button
            onClick={onRemove}
            className="text-xs font-medium text-ink-400 border border-ink-100 px-4 py-2 rounded-xl hover:bg-ink-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ProjectPackages({
  packages,
  setPackages,
  onPersistCreate,
  onPersistUpdate,
  onPersistDelete,
}: {
  packages: ProjectPackage[]
  setPackages: React.Dispatch<React.SetStateAction<ProjectPackage[]>>
  onPersistCreate?: (pkg: ProjectPackage) => Promise<string | null>
  onPersistUpdate?: (pkg: ProjectPackage) => void
  onPersistDelete?: (id: string) => void
}) {
  const TEMP_PREFIX = 'pkg-new-'

  function addPackage() {
    if (packages.length >= PLATFORM_CONFIG.max_packages_per_photographer) return
    const tempId = `${TEMP_PREFIX}${Date.now()}`
    const newPkg: ProjectPackage = { id: tempId, name: '', description: '', price: '', billing_type: 'package', includes: [], popular: false }
    setPackages(prev => [...prev, newPkg])
  }

  async function savePackage(p: ProjectPackage) {
    const isNew = p.id.startsWith(TEMP_PREFIX)
    if (isNew && onPersistCreate) {
      const realId = await onPersistCreate(p)
      if (realId) setPackages(prev => prev.map(x => x.id === p.id ? { ...p, id: realId } : x))
    } else {
      // If marking popular, unmark all others first (both locally and in DB)
      if (p.popular) {
        setPackages(prev => prev.map(x => {
          if (x.id === p.id || !x.popular) return x
          onPersistUpdate?.({ ...x, popular: false })
          return { ...x, popular: false }
        }))
      }
      setPackages(prev => prev.map(x => x.id === p.id ? p : x))
      onPersistUpdate?.(p)
    }
  }

  function removePackage(id: string) {
    setPackages(prev => prev.filter(x => x.id !== id))
    // Only call delete API for real (persisted) packages
    if (!id.startsWith(TEMP_PREFIX)) onPersistDelete?.(id)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-ink-300">Clients see these on your profile when choosing a package.</p>
          {packages.length >= PLATFORM_CONFIG.max_packages_per_photographer && (
            <p className="text-xs text-amber-600 mt-0.5">Maximum {PLATFORM_CONFIG.max_packages_per_photographer} packages reached.</p>
          )}
        </div>
        <button
          onClick={addPackage}
          disabled={packages.length >= PLATFORM_CONFIG.max_packages_per_photographer}
          className="flex items-center gap-2 text-sm font-semibold bg-ink text-white px-4 py-2.5 rounded-xl hover:bg-ink-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" /> Add package {packages.length < PLATFORM_CONFIG.max_packages_per_photographer && <span className="text-ink-300 font-normal text-xs">({packages.length}/{PLATFORM_CONFIG.max_packages_per_photographer})</span>}
        </button>
      </div>

      {packages.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-ink-200 rounded-2xl">
          <Package className="w-10 h-10 text-ink-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-400 mb-1">No packages yet</p>
          <p className="text-xs text-ink-300 mb-4">Create packages so clients know exactly what they're booking.</p>
          <button
            onClick={addPackage}
            className="text-sm font-semibold bg-ink text-white px-5 py-2.5 rounded-xl hover:bg-ink-800 transition-colors"
          >
            Create first package
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {packages.map(pkg => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              isNew={pkg.id.startsWith(TEMP_PREFIX)}
              onUpdate={p => setPackages(prev => prev.map(x => x.id === pkg.id ? p : x))}
              onSave={savePackage}
              onRemove={() => removePackage(pkg.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
