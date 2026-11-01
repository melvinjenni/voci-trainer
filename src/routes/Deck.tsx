import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pencil, Layers, Zap, RotateCcw, Sparkles, ChevronRight } from 'lucide-react'
import { useDeckStore } from '../store/deckStore'
import StageDots from '../components/StageDots'

interface ModeItem {
  to: string
  icon: React.ReactNode
  title: string
  desc: string
  gradient: string
  badge?: string
  meta?: string
}

export default function Deck() {
  const { deckId = '' } = useParams()
  const navigate = useNavigate()
  const deck = useDeckStore((s) => s.decks.find((d) => d.id === deckId))
  const resetWriteProgress = useDeckStore((s) => s.resetWriteProgress)
  const resetFlashStats = useDeckStore((s) => s.resetFlashStats)

  if (!deck) {
    return (
      <div className="card text-center">
        <p className="text-slate-500">Deck not found.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">
          Back to decks
        </Link>
      </div>
    )
  }

  const total = deck.cards.length
  const mastered = deck.cards.filter((c) => c.writeStage === 3).length
  const inProgress = deck.cards.filter((c) => c.writeStage > 0 && c.writeStage < 3).length
  const fresh = total - mastered - inProgress
  const pct = total ? Math.round((mastered / total) * 100) : 0

  const flashRight = deck.cards.reduce((s, c) => s + c.flash.correct, 0)
  const flashWrong = deck.cards.reduce((s, c) => s + c.flash.wrong, 0)
  const flashTotal = flashRight + flashWrong

  const modes: ModeItem[] = [
    {
      to: `/deck/${deck.id}/write`,
      icon: <Pencil size={26} />,
      title: 'Learn',
      desc: 'Write each word — climb 3 levels to master it.',
      gradient: 'from-brand-400 to-brand-600',
      meta: mastered > 0 ? `${mastered}/${total} mastered` : undefined,
    },
    {
      to: `/deck/${deck.id}/flashcards`,
      icon: <Layers size={26} />,
      title: 'Flashcards',
      desc: 'Swipe or use ← → — save wrong cards to retry.',
      gradient: 'from-grape-400 to-grape-600',
      meta: flashTotal > 0 ? `${flashRight} right · ${flashWrong} wrong` : undefined,
    },
    {
      to: `/deck/${deck.id}/games`,
      icon: <Zap size={26} />,
      title: 'Games',
      desc: 'Match pairs, multiple choice, speed round.',
      gradient: 'from-sun-400 to-sun-600',
      badge: 'Soon',
    },
  ]

  return (
    <div className="space-y-5">
      {/* Deck summary */}
      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-slate-800">{deck.name}</h1>
            <p className="mt-0.5 text-sm font-semibold uppercase tracking-wide text-slate-400">
              {deck.frontLang} → {deck.backLang} &nbsp;·&nbsp; {total} cards
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                flashTotal > 0 &&
                confirm('Reset all flashcard stats?') &&
                resetFlashStats(deck.id)
              }
              title="Reset flash stats"
              className="btn-secondary shrink-0 px-3 py-2 text-sm"
            >
              <Layers size={14} /> Reset flash
            </button>
            <button
              onClick={() =>
                confirm('Reset all writing progress to Level 0?') && resetWriteProgress(deck.id)
              }
              className="btn-secondary shrink-0 px-3 py-2 text-sm"
            >
              <RotateCcw size={14} /> Reset learn
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm font-bold">
            <span className="text-slate-500">Learning progress</span>
            <span className="text-brand-600">{pct}%</span>
          </div>
          <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Stage pills */}
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700">
            <Sparkles size={12} /> {mastered} mastered
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-grape-50 px-3 py-1.5 text-xs font-bold text-grape-600">
            {inProgress} in progress
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
            {fresh} new
          </span>
        </div>
      </div>

      {/* Mode tiles with sliding hover animation */}
      <div className="space-y-3">
        {modes.map((m) => (
          <button
            key={m.title}
            onClick={() => navigate(m.to)}
            className="group relative w-full overflow-hidden rounded-3xl bg-white text-left shadow-card transition-shadow duration-200 hover:shadow-card-hover active:shadow-card-active"
          >
            {/* Sliding color background — starts at icon width, expands to full on hover */}
            <div
              className={`pointer-events-none absolute inset-y-0 left-0 w-[4.5rem] bg-gradient-to-br ${m.gradient} transition-[width] duration-500 ease-out group-hover:w-full`}
            />

            {/* Content */}
            <div className="relative z-10 flex items-center">
              {/* Icon zone — always white since it sits on the color */}
              <div className="flex w-[4.5rem] shrink-0 items-center justify-center self-stretch py-6 text-white">
                {m.icon}
              </div>

              {/* Text */}
              <div className="flex-1 px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-extrabold text-slate-800 transition-colors duration-300 group-hover:text-white">
                    {m.title}
                  </h2>
                  {m.badge && (
                    <span className="rounded-full bg-sun-100 px-2.5 py-0.5 text-xs font-bold text-sun-600 transition-colors duration-300 group-hover:bg-white/20 group-hover:text-white">
                      {m.badge}
                    </span>
                  )}
                  {m.meta && (
                    <span className="text-xs font-semibold text-slate-400 transition-colors duration-300 group-hover:text-white/70">
                      {m.meta}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 transition-colors duration-300 group-hover:text-white/75">
                  {m.desc}
                </p>
              </div>

              <ChevronRight
                size={18}
                className="mr-4 shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white/60"
              />
            </div>
          </button>
        ))}
      </div>

      {/* Card list */}
      <div className="card">
        <h2 className="mb-3 font-display text-lg font-extrabold text-slate-700">
          All cards ({total})
        </h2>
        <ul className="divide-y divide-slate-100">
          {deck.cards.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-2.5">
              <span className="min-w-0 flex-1 truncate font-semibold text-slate-800">{c.term}</span>
              <span className="min-w-0 flex-1 truncate text-slate-500">{c.translation}</span>
              <StageDots stage={c.writeStage} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
