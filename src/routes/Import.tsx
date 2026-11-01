import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wand2, Check, AlertTriangle } from 'lucide-react'
import { useDeckStore } from '../store/deckStore'
import { SEPARATORS, autoDetectSeparator, parseText, type SeparatorId } from '../lib/parseImport'

const SAMPLE = `bonjour\thello
merci\tthank you
le chien\tthe dog
la maison\tthe house`

const LANGS = ['fr', 'en', 'de', 'es', 'it']

export default function Import() {
  const navigate = useNavigate()
  const createDeck = useDeckStore((s) => s.createDeck)
  const decks = useDeckStore((s) => s.decks)
  const appendCards = useDeckStore((s) => s.appendCards)

  const [text, setText] = useState('')
  const [sepId, setSepId] = useState<SeparatorId>('tab')
  const [customSep, setCustomSep] = useState('')
  const [name, setName] = useState('')
  const [frontLang, setFrontLang] = useState('fr')
  const [backLang, setBackLang] = useState('en')
  const [target, setTarget] = useState<'new' | string>('new')

  const sepChar = useMemo(() => {
    if (sepId === 'custom') return customSep || '\t'
    return SEPARATORS.find((s) => s.id === sepId)!.char
  }, [sepId, customSep])

  const result = useMemo(() => parseText(text, sepChar), [text, sepChar])

  const handleAutoDetect = () => {
    if (!text.trim()) {
      setText(SAMPLE)
      setSepId('tab')
      return
    }
    const best = autoDetectSeparator(text)
    setSepId(best.id)
  }

  const canSave = result.okCount > 0 && (target !== 'new' || name.trim().length > 0)

  const handleSave = () => {
    if (!canSave) return
    if (target === 'new') {
      const id = createDeck(name, frontLang, backLang, result.cards)
      navigate(`/deck/${id}`)
    } else {
      appendCards(target, result.cards)
      navigate(`/deck/${target}`)
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-extrabold text-slate-800">Import vocabulary</h1>

      <div className="card space-y-4">
        <div>
          <label className="mb-1 block font-display font-bold text-slate-700">
            Paste your list — one card per line
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`bonjour\thello\nmerci\tthank you`}
            className="input h-44 resize-y font-mono text-base leading-relaxed"
            spellCheck={false}
          />
          <button onClick={handleAutoDetect} className="btn-secondary mt-2 px-4 py-2 text-sm">
            <Wand2 size={16} /> {text.trim() ? 'Auto-detect separator' : 'Load a sample'}
          </button>
        </div>

        <div>
          <label className="mb-1 block font-display font-bold text-slate-700">
            Separator between word &amp; translation
          </label>
          <div className="flex flex-wrap gap-2">
            {SEPARATORS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSepId(s.id)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold ring-1 transition ${
                  sepId === s.id
                    ? 'bg-brand-500 text-white ring-brand-500'
                    : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {s.label}
              </button>
            ))}
            <button
              onClick={() => setSepId('custom')}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ring-1 transition ${
                sepId === 'custom'
                  ? 'bg-brand-500 text-white ring-brand-500'
                  : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              Custom
            </button>
            {sepId === 'custom' && (
              <input
                value={customSep}
                onChange={(e) => setCustomSep(e.target.value)}
                placeholder="e.g. |"
                maxLength={3}
                className="w-24 rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            )}
          </div>
        </div>
      </div>

      {/* Live preview */}
      {text.trim() && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-slate-800">Preview</h2>
            <div className="flex items-center gap-3 text-sm font-semibold">
              <span className="flex items-center gap-1 text-brand-600">
                <Check size={16} /> {result.okCount} ok
              </span>
              {result.malformedCount > 0 && (
                <span className="flex items-center gap-1 text-coral-500">
                  <AlertTriangle size={16} /> {result.malformedCount} skipped
                </span>
              )}
            </div>
          </div>

          <div className="max-h-64 overflow-auto rounded-2xl ring-1 ring-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-slate-500">
                <tr>
                  <th className="w-10 px-3 py-2">#</th>
                  <th className="px-3 py-2">Word</th>
                  <th className="px-3 py-2">Translation</th>
                </tr>
              </thead>
              <tbody>
                {result.lines.map((line, i) => (
                  <tr
                    key={i}
                    className={`border-t border-slate-100 ${
                      line.malformed ? 'bg-coral-500/5' : ''
                    }`}
                  >
                    <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                    {line.malformed ? (
                      <td colSpan={2} className="px-3 py-2 text-coral-500">
                        Couldn’t split this line — “{line.raw}”
                      </td>
                    ) : (
                      <>
                        <td className="px-3 py-2 font-semibold text-slate-800">{line.term}</td>
                        <td className="px-3 py-2 text-slate-600">{line.translation}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Destination + save */}
      <div className="card space-y-4">
        <div>
          <label className="mb-1 block font-display font-bold text-slate-700">Save to</label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value as 'new' | string)}
            className="input"
          >
            <option value="new">➕ New deck</option>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                Append to “{d.name}”
              </option>
            ))}
          </select>
        </div>

        {target === 'new' && (
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
            <div>
              <label className="mb-1 block font-display font-bold text-slate-700">Deck name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="French — Unit 1"
                className="input"
              />
            </div>
            <div>
              <label className="mb-1 block font-display font-bold text-slate-700">Word</label>
              <select value={frontLang} onChange={(e) => setFrontLang(e.target.value)} className="input">
                {LANGS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-display font-bold text-slate-700">Answer</label>
              <select value={backLang} onChange={(e) => setBackLang(e.target.value)} className="input">
                {LANGS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button onClick={handleSave} disabled={!canSave} className="btn-primary w-full">
          Save {result.okCount > 0 ? `${result.okCount} cards` : 'cards'}
        </button>
      </div>
    </div>
  )
}
