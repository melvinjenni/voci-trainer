import { Link, useNavigate } from 'react-router-dom'
import { Plus, BookOpen, Trash2, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useDeckStore } from '../store/deckStore'

const ACCENTS = [
  { gradient: 'from-brand-400 to-brand-600', solid: 'bg-brand-500' },
  { gradient: 'from-grape-400 to-grape-600', solid: 'bg-grape-500' },
  { gradient: 'from-coral-400 to-coral-500', solid: 'bg-coral-500' },
  { gradient: 'from-sun-400 to-sun-600',     solid: 'bg-sun-500' },
]

function accentFor(id: string) {
  const sum = [...id].reduce((n, c) => n + c.charCodeAt(0), 0)
  return ACCENTS[sum % ACCENTS.length]
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export default function Home() {
  const decks = useDeckStore((s) => s.decks)
  const deleteDeck = useDeckStore((s) => s.deleteDeck)
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-800">My decks</h1>
          <p className="text-sm text-slate-500">
            {decks.length} deck{decks.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <Link to="/import" className="btn-primary">
          <Plus size={20} /> New deck
        </Link>
      </div>

      {/* Empty state */}
      {decks.length === 0 ? (
        <div className="card grid place-items-center gap-5 py-16 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-card">
            <BookOpen size={34} />
          </span>
          <div className="space-y-1">
            <p className="font-display text-2xl font-extrabold text-slate-800">No decks yet</p>
            <p className="text-slate-500">Import your first vocab list to get started.</p>
          </div>
          <Link to="/import" className="btn-primary">
            <Plus size={20} /> Import vocabulary
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {decks.map((deck, i) => {
            const total = deck.cards.length
            const mastered = deck.cards.filter((c) => c.writeStage === 3).length
            const inProgress = deck.cards.filter((c) => c.writeStage > 0 && c.writeStage < 3).length
            const pct = total ? Math.round((mastered / total) * 100) : 0
            const accent = accentFor(deck.id)

            return (
              <motion.li
                key={deck.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/deck/${deck.id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/deck/${deck.id}`)}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl bg-white shadow-card transition-shadow duration-200 hover:shadow-card-hover active:shadow-card-active"
                >
                  {/* ── Sliding background ── */}
                  <div
                    className={`pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-br ${accent.gradient} transition-[width] duration-500 ease-out group-hover:w-full`}
                  />

                  {/* ── Content row ── */}
                  <div className="relative z-10 flex items-center">
                    {/* Initials badge — always on colored zone */}
                    <div className="flex w-20 shrink-0 flex-col items-center justify-center gap-1 self-stretch py-5 text-white">
                      <span className="font-display text-xl font-extrabold leading-none">
                        {initials(deck.name)}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                        {deck.frontLang}→{deck.backLang}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1 py-4 pl-4 pr-2">
                      <h2 className="truncate font-display text-xl font-extrabold text-slate-800 transition-colors duration-300 group-hover:text-white">
                        {deck.name}
                      </h2>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-semibold">
                        <span className="text-brand-600 transition-colors duration-300 group-hover:text-white/90">
                          {mastered} mastered
                        </span>
                        {inProgress > 0 && (
                          <span className="text-grape-500 transition-colors duration-300 group-hover:text-white/80">
                            {inProgress} in progress
                          </span>
                        )}
                        <span className="text-slate-400 transition-colors duration-300 group-hover:text-white/70">
                          {total - mastered - inProgress} new
                        </span>
                      </div>

                      {/* Progress bar — solid fill so bg-white/70 can override it on hover */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 transition-colors duration-300 group-hover:bg-white/20">
                          <div
                            className={`h-full rounded-full ${accent.solid} transition-all duration-500 group-hover:bg-white/75`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs font-bold text-slate-500 transition-colors duration-300 group-hover:text-white/80">
                          {pct}%
                        </span>
                      </div>
                    </div>

                    {/* Delete + chevron */}
                    <div className="flex items-center gap-0.5 pr-3">
                      <button
                        aria-label="Delete deck"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`Delete "${deck.name}"? This can't be undone.`))
                            deleteDeck(deck.id)
                        }}
                        className="rounded-xl p-2 text-slate-300 transition-colors duration-200
                          hover:bg-coral-50 hover:text-coral-500
                          group-hover:text-white/50 group-hover:hover:bg-white/20 group-hover:hover:text-white"
                      >
                        <Trash2 size={17} />
                      </button>
                      <ChevronRight
                        size={17}
                        className="text-slate-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white/50"
                      />
                    </div>
                  </div>
                </div>
              </motion.li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
