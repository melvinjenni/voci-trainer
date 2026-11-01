import { Link, Outlet, useLocation } from 'react-router-dom'
import { BookMarked, ChevronLeft, Settings2 } from 'lucide-react'
import { useDeckStore } from './store/deckStore'

export default function App() {
  const location = useLocation()
  const hydrated = useDeckStore((s) => s.hydrated)
  const isHome = location.pathname === '/'
  const isSettings = location.pathname === '/settings'

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col px-4 pb-16">
      <header className="flex items-center justify-between py-5">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-[0_4px_0_#0b7540]">
            <BookMarked size={22} />
          </span>
          <span className="font-display text-2xl font-extrabold tracking-tight text-slate-800">
            Voci Trainer
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {!isSettings && (
            <Link
              to="/settings"
              aria-label="Settings"
              className="grid h-10 w-10 place-items-center rounded-2xl text-slate-400 transition-colors hover:bg-white/70 hover:text-slate-700"
            >
              <Settings2 size={20} />
            </Link>
          )}
          {!isHome && !isSettings && (
            <Link to="/" className="btn-secondary gap-1 px-4 py-2 text-sm">
              <ChevronLeft size={16} /> Decks
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1">
        {hydrated ? (
          <Outlet />
        ) : (
          <div className="grid place-items-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
          </div>
        )}
      </main>
    </div>
  )
}
