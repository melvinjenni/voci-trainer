import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Flame, Trophy } from 'lucide-react'
import type { Card, Deck } from '../../types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildChoices(current: Card, all: Card[]): string[] {
  const distractors = shuffle(all.filter((c) => c.id !== current.id))
    .slice(0, 3)
    .map((c) => c.translation)
  return shuffle([current.translation, ...distractors])
}

interface Stats {
  correct: number
  wrong: number
  streak: number
  maxStreak: number
}

interface Props {
  deck: Deck
  onExit: () => void
  onPlayAgain: () => void
}

export default function QuizGame({ deck, onExit, onPlayAgain }: Props) {
  const [queue] = useState<Card[]>(() => shuffle([...deck.cards]))
  const [idx, setIdx] = useState(0)
  const [choices, setChoices] = useState<string[]>(() => buildChoices(queue[0], queue))
  const [selected, setSelected] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [stats, setStats] = useState<Stats>({ correct: 0, wrong: 0, streak: 0, maxStreak: 0 })

  // Rebuild choices whenever the card changes.
  useEffect(() => {
    if (idx < queue.length) {
      setChoices(buildChoices(queue[idx], queue))
    }
  }, [idx, queue])

  const card = queue[idx]

  const pick = (choice: string) => {
    if (feedback || !card) return
    const correct = choice.trim() === card.translation.trim()
    setSelected(choice)
    setFeedback(correct ? 'correct' : 'wrong')
    setStats((s) => {
      const streak = correct ? s.streak + 1 : 0
      return {
        correct: s.correct + (correct ? 1 : 0),
        wrong: s.wrong + (!correct ? 1 : 0),
        streak,
        maxStreak: Math.max(s.maxStreak, streak),
      }
    })
    setTimeout(
      () => {
        setFeedback(null)
        setSelected(null)
        setIdx((i) => i + 1)
      },
      correct ? 700 : 1600,
    )
  }

  // ── Results ───────────────────────────────────────────────
  if (!card) {
    const total = stats.correct + stats.wrong
    const accuracy = total > 0 ? Math.round((stats.correct / total) * 100) : 0
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card grid place-items-center gap-5 py-14 text-center"
      >
        <span className="grid h-24 w-24 place-items-center rounded-4xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-card">
          <Trophy size={44} />
        </span>
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-extrabold text-slate-800">Quiz done!</h1>
          <p className="text-lg font-bold text-slate-600">{accuracy}% correct</p>
          <div className="flex justify-center gap-5 text-sm font-semibold">
            <span className="text-brand-600">✓ {stats.correct} right</span>
            <span className="text-coral-500">✕ {stats.wrong} wrong</span>
          </div>
          {stats.maxStreak > 1 && (
            <p className="flex items-center justify-center gap-1 text-sm font-bold text-sun-600">
              <Flame size={16} /> Best streak: {stats.maxStreak}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={onPlayAgain} className="btn-primary">Play again</button>
          <button onClick={onExit} className="btn-secondary">Back</button>
        </div>
      </motion.div>
    )
  }

  // ── Active question ───────────────────────────────────────
  const pct = Math.round((idx / queue.length) * 100)

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button onClick={onExit} className="btn-secondary shrink-0 px-3 py-2 text-sm">Exit</button>
        <div className="flex-1">
          <div className="h-3 overflow-hidden rounded-full bg-white shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <span className="shrink-0 font-display text-sm font-bold text-slate-500">
          {idx}/{queue.length}
        </span>
      </div>

      {/* Streak badge */}
      <AnimatePresence>
        {stats.streak >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex justify-center"
          >
            <span className="flex items-center gap-1.5 rounded-full bg-sun-100 px-4 py-1.5 font-display text-sm font-extrabold text-sun-600">
              <Flame size={16} /> {stats.streak} streak!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.18 }}
          className="card text-center"
        >
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
            {deck.frontLang} → {deck.backLang}
          </p>
          <p className="font-display text-5xl font-extrabold leading-tight text-slate-800">
            {card.term}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Choices */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {choices.map((choice) => {
          const isSelected = selected === choice
          const isCorrect = choice.trim() === card.translation.trim()
          let cls =
            'rounded-2xl px-4 py-4 text-left font-display text-lg font-bold transition-all duration-150 '

          if (!feedback) {
            cls += 'bg-white shadow-card hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-card-hover text-slate-700'
          } else if (isCorrect) {
            cls += 'bg-brand-500 text-white shadow-card'
          } else if (isSelected) {
            cls += 'bg-coral-500 text-white shadow-card animate-shake'
          } else {
            cls += 'bg-white opacity-40 text-slate-600'
          }

          return (
            <motion.button
              key={choice}
              layout
              disabled={!!feedback}
              onClick={() => pick(choice)}
              className={cls}
            >
              <span className="flex items-center gap-2">
                {feedback && isCorrect && <Check size={20} />}
                {feedback && isSelected && !isCorrect && <X size={20} />}
                {choice}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
