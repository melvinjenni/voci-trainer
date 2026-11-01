import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Trophy, RotateCcw } from 'lucide-react'
import { useDeckStore } from '../store/deckStore'
import { isCorrect } from '../lib/matching'

type Feedback = { correct: boolean; expected: string; nextStage: number } | null

const STAGE_CONFIG = [
  { label: 'Level 1', pillClass: 'stage-pill-1', dotColor: 'bg-slate-300' },
  { label: 'Level 2', pillClass: 'stage-pill-2', dotColor: 'bg-brand-500' },
  { label: 'Level 3', pillClass: 'stage-pill-3', dotColor: 'bg-grape-500' },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export default function Write() {
  const { deckId = '' } = useParams()
  const navigate = useNavigate()
  const deck = useDeckStore((s) => s.decks.find((d) => d.id === deckId))
  const settings = useDeckStore((s) => s.settings)
  const updateWriteStage = useDeckStore((s) => s.updateWriteStage)

  const [queue, setQueue] = useState<string[]>([])
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<Feedback>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Seed queue once on mount.
  useEffect(() => {
    if (deck && queue.length === 0) {
      setQueue(shuffle(deck.cards.filter((c) => c.writeStage < 3).map((c) => c.id)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck?.id])

  // Auto-focus the input when a new card appears.
  useEffect(() => {
    if (!feedback) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [queue[0], feedback])

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

  const currentId = queue[0]
  const card = currentId ? deck.cards.find((c) => c.id === currentId) : undefined

  // ── Finished screen ────────────────────────────────────────
  if (!card) {
    const allDone = mastered === total && total > 0
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card grid place-items-center gap-5 py-16 text-center"
      >
        <span className="grid h-24 w-24 place-items-center rounded-4xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-card">
          {allDone ? <Trophy size={44} /> : <RotateCcw size={40} />}
        </span>
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-800">
            {allDone ? 'Deck mastered! 🎉' : 'Session done!'}
          </h1>
          <p className="mt-1 text-slate-500">
            {mastered} of {total} cards are at Level 3.
          </p>
        </div>
        <div className="flex gap-3">
          {!allDone && (
            <button
              onClick={() =>
                setQueue(shuffle(deck.cards.filter((c) => c.writeStage < 3).map((c) => c.id)))
              }
              className="btn-primary"
            >
              Keep going
            </button>
          )}
          <button onClick={() => navigate(`/deck/${deck.id}`)} className="btn-secondary">
            Back to deck
          </button>
        </div>
      </motion.div>
    )
  }

  const stage = card.writeStage // 0, 1, 2
  const stageInfo = STAGE_CONFIG[Math.min(stage, 2)]
  const remaining = queue.length

  const advance = (correct: boolean) => {
    const nextStage = clamp(stage + (correct ? 1 : -1), 0, 3)
    updateWriteStage(deck.id, card.id, correct)
    setFeedback({ correct, expected: card.translation, nextStage })

    setTimeout(
      () => {
        setFeedback(null)
        setAnswer('')
        setQueue((q) => {
          const [head, ...rest] = q
          // Drop from queue only when it just reached stage 3 (mastered).
          return nextStage >= 3 ? rest : [...rest, head]
        })
      },
      correct ? 800 : 2200,
    )
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (feedback || !answer.trim()) return
    advance(isCorrect(answer, card.translation, settings.lenient))
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/deck/${deck.id}`)}
          className="btn-secondary shrink-0 px-3 py-2 text-sm"
        >
          Exit
        </button>
        {/* Progress bar */}
        <div className="flex-1">
          <div className="h-3 overflow-hidden rounded-full bg-white shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500"
              style={{ width: `${total ? (mastered / total) * 100 : 0}%` }}
            />
          </div>
        </div>
        <span className="shrink-0 font-display text-sm font-bold text-slate-500">
          {mastered}/{total}
        </span>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={card.id + stage}
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`card space-y-5 transition-shadow ${
            feedback
              ? feedback.correct
                ? 'ring-2 ring-brand-400'
                : 'ring-2 ring-coral-400 animate-shake'
              : ''
          }`}
        >
          {/* Stage + remaining */}
          <div className="flex items-center justify-between">
            <span className={`rounded-xl px-3 py-1.5 text-sm font-extrabold ${stageInfo.pillClass}`}>
              {stageInfo.label}
            </span>
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`h-2.5 w-2.5 rounded-full transition-colors ${
                      i <= stage ? stageInfo.dotColor : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-slate-400">{remaining} left</span>
            </div>
          </div>

          {/* Prompt term */}
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
              {deck.frontLang} → {deck.backLang}
            </p>
            <p className="font-display text-5xl font-extrabold leading-tight text-slate-800">
              {card.term}
            </p>
          </div>

          {/* Input */}
          <form onSubmit={submit} className="space-y-3">
            <input
              ref={inputRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={!!feedback}
              placeholder="Type the translation…"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className={`input text-xl ${feedback && !feedback.correct ? 'input-error' : ''}`}
            />
            {settings.learnShowHint && stage === 0 && !feedback && card.translation.length > 0 && (
              <p className="text-center font-display text-xl font-bold tracking-[0.4em] text-slate-300">
                {card.translation[0]}{'_'.repeat(Math.max(0, card.translation.length - 1))}
              </p>
            )}
            <button
              type="submit"
              disabled={!!feedback || !answer.trim()}
              className="btn-primary w-full py-4 text-lg"
            >
              Check
            </button>
          </form>
        </motion.div>
      </AnimatePresence>

      {/* Feedback panel */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className={`rounded-3xl p-5 ${
              feedback.correct
                ? 'bg-brand-500 text-white'
                : 'bg-coral-500 text-white'
            }`}
          >
            {feedback.correct ? (
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/20">
                  <Check size={22} />
                </span>
                <div>
                  <p className="font-display text-lg font-extrabold">
                    {feedback.nextStage >= 3 ? 'Mastered! 🎉' : 'Correct!'}
                  </p>
                  <p className="text-sm opacity-80">
                    {feedback.nextStage >= 3
                      ? 'This card is done.'
                      : `Moving up to ${STAGE_CONFIG[Math.min(feedback.nextStage, 2)].label}.`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/20">
                    <X size={22} />
                  </span>
                  <div>
                    <p className="font-display text-lg font-extrabold">Wrong answer</p>
                    <p className="text-sm opacity-80">
                      Dropped to {STAGE_CONFIG[Math.max(feedback.nextStage, 0)].label}.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl bg-white/15 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-70">
                    Correct answer
                  </p>
                  <p className="mt-0.5 font-display text-2xl font-extrabold">
                    {feedback.expected}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
