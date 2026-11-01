import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Check, X, Trophy } from 'lucide-react'
import type { Card, Deck } from '../../types'
import { normalizeLenient } from '../../lib/matching'
import { useDeckStore } from '../../store/deckStore'

const MAX_COMBO = 5

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface Props {
  deck: Deck
  onExit: () => void
  onPlayAgain: () => void
}

export default function SpeedGame({ deck, onExit, onPlayAgain }: Props) {
  const settings = useDeckStore((s) => s.settings)
  const SECONDS = settings.speedDuration

  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [queue] = useState<Card[]>(() => shuffle([...deck.cards]))
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [wrongAnswer, setWrongAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(SECONDS)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(1)
  const [maxCombo, setMaxCombo] = useState(1)
  const [correct, setCorrect] = useState(0)
  const [attempted, setAttempted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Countdown
  useEffect(() => {
    if (phase !== 'playing') return
    if (timeLeft <= 0) { setPhase('done'); return }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, timeLeft])

  // Focus input when game starts or card changes
  useEffect(() => {
    if (phase === 'playing' && !feedback) {
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [phase, idx, feedback])

  const card = queue[idx % queue.length]

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!card || feedback || !answer.trim() || phase !== 'playing') return

    const isRight = normalizeLenient(answer) === normalizeLenient(card.translation)
    setAttempted((a) => a + 1)

    if (isRight) {
      const pts = 10 * Math.min(combo, MAX_COMBO)
      setScore((s) => s + pts)
      const newCombo = combo + 1
      setCombo(newCombo)
      setMaxCombo((m) => Math.max(m, newCombo))
      setCorrect((c) => c + 1)
      setFeedback('correct')
      setTimeout(() => {
        setFeedback(null)
        setAnswer('')
        setIdx((i) => i + 1)
      }, 280)
    } else {
      setWrongAnswer(card.translation)
      setCombo(1)
      setFeedback('wrong')
      setTimeout(() => {
        setFeedback(null)
        setAnswer('')
        setIdx((i) => i + 1)
      }, 1400)
    }
  }

  const timerColor =
    timeLeft > SECONDS * 0.5 ? 'text-brand-600' : timeLeft > SECONDS * 0.25 ? 'text-sun-500' : 'text-coral-500'
  const timerPct = (timeLeft / SECONDS) * 100

  // ── Ready screen ──────────────────────────────────────────
  if (phase === 'ready') {
    return (
      <div className="card grid place-items-center gap-5 py-14 text-center">
        <span className="grid h-24 w-24 place-items-center rounded-4xl bg-gradient-to-br from-coral-400 to-coral-500 text-white shadow-card">
          <Zap size={44} />
        </span>
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-800">Speed Round</h1>
          <p className="mt-2 text-slate-500">
            Type as many translations as you can in {SECONDS} seconds.
            <br />
            Correct answers build your combo for bonus points!
          </p>
        </div>
        <div className="flex items-center gap-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="text-center">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-coral-100 font-display text-sm font-extrabold text-coral-600">
                {n}×
              </div>
              <p className="mt-1 text-[10px] font-bold text-slate-400">{n * 10}pts</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setPhase('playing')}
            className="btn-danger px-8 py-4 text-lg"
          >
            <Zap size={20} /> Start!
          </button>
          <button onClick={onExit} className="btn-secondary">Back</button>
        </div>
      </div>
    )
  }

  // ── Done screen ───────────────────────────────────────────
  if (phase === 'done') {
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card grid place-items-center gap-5 py-14 text-center"
      >
        <span className="grid h-24 w-24 place-items-center rounded-4xl bg-gradient-to-br from-coral-400 to-coral-500 text-white shadow-card">
          <Trophy size={44} />
        </span>
        <div>
          <h1 className="font-display text-4xl font-extrabold text-slate-800">{score}</h1>
          <p className="font-display text-lg text-slate-500">points</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <span className="rounded-2xl bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700">
            ✓ {correct} correct
          </span>
          <span className="rounded-2xl bg-coral-50 px-4 py-2 text-sm font-bold text-coral-600">
            {accuracy}% accuracy
          </span>
          <span className="rounded-2xl bg-sun-50 px-4 py-2 text-sm font-bold text-sun-600">
            🔥 {maxCombo - 1}× best combo
          </span>
        </div>
        <div className="flex gap-3">
          <button onClick={onPlayAgain} className="btn-danger">Play again</button>
          <button onClick={onExit} className="btn-secondary">Back</button>
        </div>
      </motion.div>
    )
  }

  // ── Playing screen ────────────────────────────────────────
  const comboLevel = Math.min(combo - 1, MAX_COMBO)

  return (
    <div className="space-y-4">
      {/* Timer + score row */}
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="btn-secondary px-3 py-2 text-sm">Exit</button>
        <div className="flex items-center gap-4">
          {comboLevel > 0 && (
            <span className="flex items-center gap-1 font-display text-sm font-extrabold text-sun-600">
              🔥 {comboLevel}× combo
            </span>
          )}
          <span className="font-display text-2xl font-extrabold text-slate-800">{score}</span>
        </div>
      </div>

      {/* Circular timer */}
      <div className="flex justify-center">
        <div className="relative grid h-20 w-20 place-items-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="7" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke={timeLeft > SECONDS * 0.5 ? '#18b862' : timeLeft > SECONDS * 0.25 ? '#ffab00' : '#ff5436'}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - timerPct / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <span className={`font-display text-2xl font-extrabold ${timerColor}`}>{timeLeft}</span>
        </div>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className={`card transition-colors ${
            feedback === 'correct' ? 'ring-2 ring-brand-400' : feedback === 'wrong' ? 'ring-2 ring-coral-400 animate-shake' : ''
          }`}
        >
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
            {deck.frontLang} → {deck.backLang}
          </p>
          <p className="font-display text-5xl font-extrabold leading-tight text-slate-800">
            {card.term}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Input */}
      <form onSubmit={submit} className="space-y-2.5">
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
          className={`input text-xl ${feedback === 'wrong' ? 'input-error' : ''}`}
        />
        <button
          type="submit"
          disabled={!!feedback || !answer.trim()}
          className="btn-danger w-full py-4 text-lg"
        >
          Check
        </button>
      </form>

      {/* Feedback banner */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-bold ${
              feedback === 'correct' ? 'bg-brand-500 text-white' : 'bg-coral-500 text-white'
            }`}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/20">
              {feedback === 'correct' ? <Check size={18} /> : <X size={18} />}
            </span>
            {feedback === 'correct' ? (
              <span>
                +{10 * Math.min(combo - 1 || 1, MAX_COMBO)} pts{comboLevel > 1 ? ` · ${comboLevel}× combo!` : ''}
              </span>
            ) : (
              <span>
                Answer: <strong>{wrongAnswer}</strong>
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
