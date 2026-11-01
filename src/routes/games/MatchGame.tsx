import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, X, Trophy } from 'lucide-react'
import type { Deck } from '../../types'
import { useDeckStore } from '../../store/deckStore'

const SECONDS = 60

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface Tile {
  key: string
  cardId: string
  text: string
  side: 'term' | 'trans'
}

interface Props {
  deck: Deck
  onExit: () => void
  onPlayAgain: () => void
}

function buildTiles(deck: Deck, pairsCount: number) {
  const cards = shuffle([...deck.cards]).slice(0, Math.min(pairsCount, deck.cards.length))
  const terms: Tile[] = cards.map((c) => ({ key: `${c.id}-term`, cardId: c.id, text: c.term, side: 'term' }))
  const trans: Tile[] = cards.map((c) => ({ key: `${c.id}-trans`, cardId: c.id, text: c.translation, side: 'trans' }))
  return { cards, tiles: shuffle([...terms, ...trans]) }
}

export default function MatchGame({ deck, onExit, onPlayAgain }: Props) {
  const settings = useDeckStore((s) => s.settings)
  const pairsCount = Math.min(settings.matchPairs, deck.cards.length)
  const [{ cards, tiles }] = useState(() => buildTiles(deck, pairsCount))
  const [selected, setSelected] = useState<string | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [wrongKeys, setWrongKeys] = useState<string[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [timeLeft, setTimeLeft] = useState(SECONDS)
  const [phase, setPhase] = useState<'playing' | 'won' | 'lost'>('playing')

  // Countdown
  useEffect(() => {
    if (phase !== 'playing') return
    if (timeLeft <= 0) { setPhase('lost'); return }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, timeLeft])

  // Win check
  useEffect(() => {
    if (phase === 'playing' && matched.size > 0 && matched.size >= cards.length) {
      setPhase('won')
    }
  }, [matched.size, cards.length, phase])

  const handleTile = (tileKey: string) => {
    if (phase !== 'playing' || wrongKeys.length > 0) return
    const tile = tiles.find((t) => t.key === tileKey)!
    if (matched.has(tile.cardId)) return

    if (!selected) { setSelected(tileKey); return }
    if (selected === tileKey) { setSelected(null); return }

    const selTile = tiles.find((t) => t.key === selected)!
    if (selTile.cardId === tile.cardId) {
      setMatched((prev) => new Set([...prev, tile.cardId]))
      setSelected(null)
    } else {
      setMistakes((m) => m + 1)
      setWrongKeys([selected, tileKey])
      setTimeout(() => { setWrongKeys([]); setSelected(null) }, 650)
    }
  }

  const timerColor =
    timeLeft > 30 ? 'text-brand-600' : timeLeft > 15 ? 'text-sun-500' : 'text-coral-500'

  // ── Result screen ─────────────────────────────────────────
  if (phase !== 'playing') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card grid place-items-center gap-5 py-14 text-center"
      >
        <span
          className={`grid h-24 w-24 place-items-center rounded-4xl text-white shadow-card ${
            phase === 'won'
              ? 'bg-gradient-to-br from-brand-400 to-brand-600'
              : 'bg-gradient-to-br from-coral-400 to-coral-500'
          }`}
        >
          {phase === 'won' ? <Trophy size={44} /> : <X size={44} />}
        </span>
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-800">
            {phase === 'won' ? 'All matched! 🎉' : "Time's up!"}
          </h1>
          <p className="mt-1 text-slate-500">
            {phase === 'won'
              ? `${mistakes} mistake${mistakes !== 1 ? 's' : ''}`
              : `${matched.size} of ${cards.length} pairs matched`}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onPlayAgain} className="btn-primary">Play again</button>
          <button onClick={onExit} className="btn-secondary">Back</button>
        </div>
      </motion.div>
    )
  }

  // ── Game screen ───────────────────────────────────────────
  const cols = cards.length <= 3 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="btn-secondary px-3 py-2 text-sm">Exit</button>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-sm font-bold text-coral-500">
            <X size={14} /> {mistakes}
          </span>
          <span className={`flex items-center gap-1.5 font-display text-2xl font-extrabold ${timerColor}`}>
            <Timer size={20} />
            {timeLeft}
          </span>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {cards.map((c) => (
          <span
            key={c.id}
            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
              matched.has(c.id) ? 'bg-brand-500 scale-110' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Tile grid */}
      <div className={`grid ${cols} gap-2.5`}>
        <AnimatePresence>
          {tiles.map((tile) => {
            const isMatched = matched.has(tile.cardId)
            const isSelected = selected === tile.key
            const isWrong = wrongKeys.includes(tile.key)

            let bg = ''
            if (isMatched) bg = 'opacity-0 scale-75 pointer-events-none'
            else if (isWrong) bg = 'bg-coral-100 text-coral-700 animate-shake ring-2 ring-coral-400'
            else if (isSelected)
              bg =
                tile.side === 'term'
                  ? 'bg-grape-500 text-white shadow-card ring-2 ring-grape-700 scale-105'
                  : 'bg-brand-500 text-white shadow-card ring-2 ring-brand-700 scale-105'
            else
              bg =
                tile.side === 'term'
                  ? 'bg-grape-100 text-grape-800 hover:bg-grape-200 hover:scale-[1.02]'
                  : 'bg-brand-50 text-brand-800 hover:bg-brand-100 hover:scale-[1.02]'

            return (
              <motion.button
                key={tile.key}
                layout
                onClick={() => handleTile(tile.key)}
                disabled={isMatched || wrongKeys.length > 0}
                className={`min-h-[72px] rounded-2xl px-3 py-3 text-center text-sm font-bold transition-all duration-150 ${bg}`}
              >
                {tile.text}
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-5 text-xs font-semibold text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-grape-400" /> Word
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-400" /> Translation
        </span>
      </div>
    </div>
  )
}
