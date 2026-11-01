import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { Check, X, RotateCcw, Keyboard, RefreshCw, Trash2, Layers } from 'lucide-react'
import { useDeckStore } from '../store/deckStore'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Flashcards() {
  const { deckId = '' } = useParams()
  const navigate = useNavigate()
  const deck = useDeckStore((s) => s.decks.find((d) => d.id === deckId))
  const settings = useDeckStore((s) => s.settings)
  const recordFlash = useDeckStore((s) => s.recordFlash)
  const resetFlashStats = useDeckStore((s) => s.resetFlashStats)
  const saveFlashWrong = useDeckStore((s) => s.saveFlashWrong)
  const clearFlashWrong = useDeckStore((s) => s.clearFlashWrong)
  const rawSavedWrong = useDeckStore((s) => s.flashSavedWrong[deckId] ?? [])

  // Filter saved IDs to only those still in the deck.
  const savedWrong = useMemo(
    () => rawSavedWrong.filter((id) => deck?.cards.some((c) => c.id === id)),
    [rawSavedWrong, deck],
  )

  const [started, setStarted] = useState(false)
  const [reversed, setReversed] = useState(false)
  const [order, setOrder] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [tally, setTally] = useState({ right: 0, wrong: 0 })
  // Track wrong IDs in both state (for rendering) and a ref (for the save effect).
  const [sessionWrongIds, setSessionWrongIds] = useState<string[]>([])
  const sessionWrongRef = useRef<string[]>([])
  const [savedToStore, setSavedToStore] = useState(false)

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-16, 16])
  const rightOpacity = useTransform(x, [30, 130], [0, 1])
  const wrongOpacity = useTransform(x, [-130, -30], [1, 0])
  const bgColor = useTransform(x, [-180, 0, 180], ['#fff2ef', '#ffffff', '#eefdf3'])

  const cardId = order[index]
  const card = useMemo(() => deck?.cards.find((c) => c.id === cardId), [deck, cardId])
  const isDone = started && !card

  // Card sides based on direction setting.
  const front = reversed ? card?.translation : card?.term
  const back = reversed ? card?.term : card?.translation
  const frontLang = reversed ? deck?.backLang : deck?.frontLang
  const backLang = reversed ? deck?.frontLang : deck?.backLang

  const flip = useCallback(() => setFlipped((f) => !f), [])

  const commit = useCallback(
    (result: 'right' | 'wrong') => {
      if (!card || !deck) return
      if (result === 'wrong' && !sessionWrongRef.current.includes(card.id)) {
        sessionWrongRef.current = [...sessionWrongRef.current, card.id]
        setSessionWrongIds(sessionWrongRef.current)
      }
      recordFlash(deck.id, card.id, result)
      setTally((t) => ({ ...t, [result]: t[result] + 1 }))
      setFlipped(false)
      x.set(0)
      setIndex((i) => i + 1)
    },
    [card, deck, recordFlash, x],
  )

  // Keyboard: Space / ↑ / ↓ = flip · ← = wrong · → = right
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!started || isDone) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        e.preventDefault()
        flip()
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        commit('right')
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        commit('wrong')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [started, isDone, flip, commit])

  // When session ends, persist wrong IDs to the store.
  useEffect(() => {
    if (!isDone || savedToStore) return
    if (sessionWrongRef.current.length > 0) {
      saveFlashWrong(deckId, sessionWrongRef.current)
    } else {
      clearFlashWrong(deckId)
    }
    setSavedToStore(true)
  }, [isDone, savedToStore, saveFlashWrong, clearFlashWrong, deckId])

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

  const startPlaying = (ids?: string[]) => {
    const cardIds = ids ?? deck.cards.map((c) => c.id)
    sessionWrongRef.current = []
    setSessionWrongIds([])
    setOrder(shuffle(cardIds))
    setIndex(0)
    setFlipped(false)
    setTally({ right: 0, wrong: 0 })
    setSavedToStore(false)
    setReversed(settings.cardDirection === 'reverse')
    x.set(0)
    setStarted(true)
  }

  const restart = (ids?: string[]) => {
    const cardIds = ids ?? deck.cards.map((c) => c.id)
    sessionWrongRef.current = []
    setSessionWrongIds([])
    setOrder(shuffle(cardIds))
    setIndex(0)
    setFlipped(false)
    setTally({ right: 0, wrong: 0 })
    setSavedToStore(false)
    x.set(0)
  }

  const handleResetStats = () => {
    if (confirm('Reset all flashcard stats for this deck? This cannot be undone.')) {
      resetFlashStats(deck.id)
    }
  }

  // ── Start screen ──────────────────────────────────────────
  if (!started) {
    const dirLabel =
      settings.cardDirection === 'reverse'
        ? `${deck.backLang} → ${deck.frontLang}`
        : `${deck.frontLang} → ${deck.backLang}`

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card space-y-7 py-10 text-center"
      >
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-800">Flashcards</h1>
          <p className="mt-1 text-slate-500">{deck.name}</p>
          <p className="mt-1 text-sm font-semibold text-slate-400">
            {deck.cards.length} card{deck.cards.length !== 1 ? 's' : ''} · {dirLabel}
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {savedWrong.length > 0 && (
            <button onClick={() => startPlaying(savedWrong)} className="btn-danger w-full py-4">
              <RotateCcw size={18} />
              Retry {savedWrong.length} wrong from last time
            </button>
          )}
          <button onClick={() => startPlaying()} className="btn-primary w-full py-4">
            <Layers size={18} />
            Practice all {deck.cards.length} cards
          </button>
          <button onClick={() => navigate(`/deck/${deck.id}`)} className="btn-secondary w-full">
            Back to deck
          </button>
        </div>

        <p className="text-xs font-semibold text-slate-400">
          Change card direction in{' '}
          <Link to="/settings" className="text-brand-500 underline">
            Settings
          </Link>
        </p>
      </motion.div>
    )
  }

  // ── End of stack ──────────────────────────────────────────
  if (isDone) {
    const total = tally.right + tally.wrong
    const accuracy = total > 0 ? Math.round((tally.right / total) * 100) : 0
    const uniqueWrong = sessionWrongIds

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="card space-y-6 py-10 text-center"
      >
        <div className="flex justify-center">
          <div
            className={`grid h-28 w-28 place-items-center rounded-full shadow-card ${
              accuracy >= 70
                ? 'bg-gradient-to-br from-brand-400 to-brand-600'
                : accuracy >= 40
                  ? 'bg-gradient-to-br from-sun-400 to-sun-600'
                  : 'bg-gradient-to-br from-coral-400 to-coral-500'
            }`}
          >
            <p className="font-display text-4xl font-extrabold text-white">{accuracy}%</p>
          </div>
        </div>

        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-800">Round done!</h1>
          <div className="mt-2 flex justify-center gap-5 text-base font-bold">
            <span className="text-brand-600">✓ {tally.right} knew</span>
            <span className="text-coral-500">✕ {tally.wrong} missed</span>
          </div>
          {uniqueWrong.length > 0 && (
            <p className="mt-2 text-xs font-semibold text-slate-400">
              {uniqueWrong.length} wrong card{uniqueWrong.length !== 1 ? 's' : ''} saved — you can retry next time!
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          {uniqueWrong.length > 0 && (
            <button onClick={() => restart(uniqueWrong)} className="btn-danger w-full py-4">
              <RotateCcw size={18} />
              Retry wrong cards now ({uniqueWrong.length})
            </button>
          )}
          <button onClick={() => restart()} className="btn-primary w-full py-4">
            <RefreshCw size={18} /> Go again (all cards)
          </button>
          <button onClick={() => navigate(`/deck/${deck.id}`)} className="btn-secondary w-full">
            Back to deck
          </button>
        </div>

        <button
          onClick={handleResetStats}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-coral-500"
        >
          <Trash2 size={12} /> Reset all flash stats
        </button>
      </motion.div>
    )
  }

  // ── Active card ───────────────────────────────────────────
  const progressPct = order.length > 0 ? Math.round((index / order.length) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/deck/${deck.id}`)}
          className="btn-secondary shrink-0 px-3 py-2 text-sm"
        >
          Exit
        </button>
        <div className="flex-1">
          <div className="h-3 overflow-hidden rounded-full bg-white shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-grape-400 to-grape-600 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <span className="shrink-0 font-display text-sm font-bold text-slate-500">
          {index + 1}/{order.length}
        </span>
      </div>

      {/* Session tally pills */}
      {(tally.right > 0 || tally.wrong > 0) && (
        <div className="flex justify-center gap-3">
          {tally.right > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
              <Check size={12} /> {tally.right}
            </span>
          )}
          {tally.wrong > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-coral-50 px-3 py-1 text-xs font-bold text-coral-600">
              <X size={12} /> {tally.wrong}
            </span>
          )}
        </div>
      )}

      {/* Card stack */}
      <div className="relative h-[330px] select-none">
        {order[index + 1] && (
          <div className="absolute inset-x-4 bottom-0 top-4 rounded-3xl bg-slate-200/60 shadow-sm" />
        )}

        <AnimatePresence mode="popLayout">
          <motion.div
            key={card!.id + index}
            className="absolute inset-0"
            style={{ x, rotate }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={(_, info) => {
              if (info.offset.x > 130) commit('right')
              else if (info.offset.x < -130) commit('wrong')
            }}
            whileTap={{ cursor: 'grabbing' }}
            onClick={flip}
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <motion.div
              className="flex h-full cursor-grab flex-col items-center justify-center rounded-3xl p-8 text-center shadow-card ring-1 ring-black/5"
              style={{ backgroundColor: bgColor }}
            >
              <motion.div
                style={{ opacity: rightOpacity }}
                className="pointer-events-none absolute left-5 top-5 flex items-center gap-1.5 rounded-2xl bg-brand-500 px-3 py-2 text-white shadow-card"
              >
                <Check size={22} />
                <span className="font-display text-sm font-bold">Knew it!</span>
              </motion.div>
              <motion.div
                style={{ opacity: wrongOpacity }}
                className="pointer-events-none absolute right-5 top-5 flex items-center gap-1.5 rounded-2xl bg-coral-500 px-3 py-2 text-white shadow-card"
              >
                <span className="font-display text-sm font-bold">Missed</span>
                <X size={22} />
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={flipped ? 'back' : 'front'}
                  initial={{ opacity: 0, rotateX: -15, y: 8 }}
                  animate={{ opacity: 1, rotateX: 0, y: 0 }}
                  exit={{ opacity: 0, rotateX: 15, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-2"
                >
                  <p
                    className={`text-xs font-bold uppercase tracking-wider ${
                      flipped ? 'text-grape-500' : 'text-slate-400'
                    }`}
                  >
                    {flipped ? backLang : frontLang}
                  </p>
                  <p className="font-display text-5xl font-extrabold leading-tight text-slate-800">
                    {flipped ? back : front}
                  </p>
                </motion.div>
              </AnimatePresence>

              <p className="absolute bottom-5 text-xs font-semibold text-slate-300">
                {flipped ? '↑ ↓ or Space to flip back' : '↑ ↓ or Space to flip'}
              </p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-8">
        <button
          onClick={() => commit('wrong')}
          className="grid h-16 w-16 place-items-center rounded-full bg-white text-coral-500
            shadow-[0_4px_0_rgba(0,0,0,0.10)] ring-1 ring-slate-100
            transition-all hover:bg-coral-500 hover:text-white hover:shadow-[0_4px_0_#b02b18]
            active:translate-y-1 active:shadow-none"
          aria-label="Missed (←)"
        >
          <X size={30} />
        </button>
        <button
          onClick={() => commit('right')}
          className="grid h-16 w-16 place-items-center rounded-full bg-white text-brand-500
            shadow-[0_4px_0_rgba(0,0,0,0.10)] ring-1 ring-slate-100
            transition-all hover:bg-brand-500 hover:text-white hover:shadow-[0_4px_0_#0b7540]
            active:translate-y-1 active:shadow-none"
          aria-label="Knew it (→)"
        >
          <Check size={30} />
        </button>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400">
        <Keyboard size={13} />
        ← miss &nbsp;·&nbsp; ↑↓ or Space flip &nbsp;·&nbsp; → knew it
      </p>
    </div>
  )
}
