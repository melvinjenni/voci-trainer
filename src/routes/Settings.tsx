import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Settings2 } from 'lucide-react'
import { useDeckStore } from '../store/deckStore'
import type { Settings } from '../types'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? 'bg-brand-500' : 'bg-slate-200'
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function OptionGroup<T extends string | number>({
  options,
  value,
  onChange,
  format,
}: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  format?: (v: T) => string
}) {
  return (
    <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
      {options.map((opt) => (
        <button
          key={String(opt)}
          onClick={() => onChange(opt)}
          className={`flex-1 rounded-xl py-2 text-sm font-bold transition-all duration-150 ${
            value === opt
              ? 'bg-white shadow-sm text-slate-800'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {format ? format(opt) : String(opt)}
        </button>
      ))}
    </div>
  )
}

function Row({ label, desc, children }: { label: string; desc?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <p className="font-semibold text-slate-800">{label}</p>
        {desc && <p className="mt-0.5 text-sm text-slate-500">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function WideRow({ label, desc, children }: { label: string; desc?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="font-semibold text-slate-800">{label}</p>
        {desc && <p className="mt-0.5 text-sm text-slate-500">{desc}</p>}
      </div>
      {children}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card space-y-5">
      <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-slate-400">
        {title}
      </h2>
      <div className="space-y-5">{children}</div>
    </div>
  )
}

export default function SettingsPage() {
  const settings = useDeckStore((s) => s.settings)
  const updateSettings = useDeckStore((s) => s.updateSettings)

  const set = <K extends keyof Settings>(key: K, val: Settings[K]) =>
    updateSettings({ [key]: val } as Partial<Settings>)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow-card">
            <Settings2 size={22} />
          </span>
          <h1 className="font-display text-3xl font-extrabold text-slate-800">Settings</h1>
        </div>
        <Link to="/" className="btn-secondary px-4 py-2 text-sm">
          Back to decks
        </Link>
      </div>

      {/* General */}
      <Section title="General">
        <Row
          label="Lenient matching"
          desc="Accept answers ignoring capitalization, accents, and trailing punctuation."
        >
          <Toggle checked={settings.lenient} onChange={(v) => set('lenient', v)} />
        </Row>
      </Section>

      {/* Learn mode */}
      <Section title="Learn mode">
        <Row
          label="Show first-letter hint"
          desc="Reveal the first letter of the answer while you're at Level 1."
        >
          <Toggle checked={settings.learnShowHint} onChange={(v) => set('learnShowHint', v)} />
        </Row>
      </Section>

      {/* Flashcards */}
      <Section title="Flashcards">
        <WideRow
          label="Card direction"
          desc="Which side of the card is shown face-up when you start."
        >
          <OptionGroup
            options={['normal', 'reverse'] as const}
            value={settings.cardDirection}
            onChange={(v) => set('cardDirection', v)}
            format={(v) => (v === 'normal' ? 'Word → Translation' : 'Translation → Word')}
          />
        </WideRow>
      </Section>

      {/* Match game */}
      <Section title="Match game">
        <WideRow label="Pairs per round" desc="How many card pairs appear on the grid at once.">
          <OptionGroup
            options={[3, 4, 5, 6] as const}
            value={settings.matchPairs}
            onChange={(v) => set('matchPairs', v)}
          />
        </WideRow>
      </Section>

      {/* Speed round */}
      <Section title="Speed round">
        <WideRow label="Time limit" desc="How many seconds you get per round.">
          <OptionGroup
            options={[30, 60, 90] as const}
            value={settings.speedDuration}
            onChange={(v) => set('speedDuration', v)}
            format={(v) => `${v}s`}
          />
        </WideRow>
      </Section>
    </div>
  )
}
