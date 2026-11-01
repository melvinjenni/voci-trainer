import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Grid3x3, ListChecks, Zap, ChevronRight } from 'lucide-react'
import { useDeckStore } from '../store/deckStore'
import MatchGame from './games/MatchGame'
import QuizGame from './games/QuizGame'
import SpeedGame from './games/SpeedGame'

type GameId = 'match' | 'quiz' | 'speed'

const GAMES = [
  {
    id: 'match' as GameId,
    icon: <Grid3x3 size={26} />,
    title: 'Match pairs',
    desc: 'Tap matching words and translations before the clock runs out.',
    gradient: 'from-grape-400 to-grape-600',
    minCards: 2,
  },
  {
    id: 'quiz' as GameId,
    icon: <ListChecks size={26} />,
    title: 'Multiple choice',
    desc: 'Pick the right translation from four options. Build streaks!',
    gradient: 'from-brand-400 to-brand-600',
    minCards: 2,
  },
  {
    id: 'speed' as GameId,
    icon: <Zap size={26} />,
    title: 'Speed round',
    desc: 'Type as many translations as possible in 60 seconds.',
    gradient: 'from-coral-400 to-coral-500',
    minCards: 1,
  },
]

export default function Games() {
  const { deckId = '' } = useParams()
  const deck = useDeckStore((s) => s.decks.find((d) => d.id === deckId))
  const [activeGame, setActiveGame] = useState<GameId | null>(null)
  const [gameKey, setGameKey] = useState(0)

  if (!deck) {
    return (
      <div className="card text-center">
        <p className="text-slate-500">Deck not found.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">Back to decks</Link>
      </div>
    )
  }

  const startGame = (id: GameId) => {
    setGameKey(0)
    setActiveGame(id)
  }
  const exitGame = () => setActiveGame(null)
  const playAgain = () => setGameKey((k) => k + 1)

  // ── Active game ───────────────────────────────────────────
  if (activeGame === 'match')
    return <MatchGame key={gameKey} deck={deck} onExit={exitGame} onPlayAgain={playAgain} />
  if (activeGame === 'quiz')
    return <QuizGame key={gameKey} deck={deck} onExit={exitGame} onPlayAgain={playAgain} />
  if (activeGame === 'speed')
    return <SpeedGame key={gameKey} deck={deck} onExit={exitGame} onPlayAgain={playAgain} />

  // ── Hub ───────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-800">Games</h1>
          <p className="text-sm text-slate-500">{deck.name}</p>
        </div>
        <Link to={`/deck/${deckId}`} className="btn-secondary px-4 py-2 text-sm">
          Back to deck
        </Link>
      </div>

      <div className="space-y-3">
        {GAMES.map((g) => {
          const disabled = deck.cards.length < g.minCards

          return (
            <button
              key={g.id}
              onClick={() => !disabled && startGame(g.id)}
              disabled={disabled}
              className="group relative w-full overflow-hidden rounded-3xl bg-white text-left shadow-card transition-shadow duration-200 hover:shadow-card-hover active:shadow-card-active disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Sliding background */}
              <div
                className={`pointer-events-none absolute inset-y-0 left-0 w-[4.5rem] bg-gradient-to-br ${g.gradient} transition-[width] duration-500 ease-out group-hover:w-full group-disabled:group-hover:w-[4.5rem]`}
              />

              {/* Content */}
              <div className="relative z-10 flex items-center">
                <div className="flex w-[4.5rem] shrink-0 items-center justify-center self-stretch py-6 text-white">
                  {g.icon}
                </div>
                <div className="flex-1 px-5 py-4">
                  <h2 className="font-display text-xl font-extrabold text-slate-800 transition-colors duration-300 group-hover:text-white">
                    {g.title}
                  </h2>
                  <p className="text-sm text-slate-500 transition-colors duration-300 group-hover:text-white/75">
                    {disabled
                      ? `Needs at least ${g.minCards} card${g.minCards > 1 ? 's' : ''}.`
                      : g.desc}
                  </p>
                </div>
                <ChevronRight
                  size={18}
                  className="mr-4 shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white/60"
                />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
