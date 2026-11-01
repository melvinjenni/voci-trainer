import type { NewCardInput } from '../store/deckStore'

export type SeparatorId = 'tab' | 'equals' | 'semicolon' | 'slash' | 'comma' | 'dash' | 'custom'

export interface SeparatorOption {
  id: SeparatorId
  label: string
  char: string
}

export const SEPARATORS: SeparatorOption[] = [
  { id: 'tab', label: 'Tab', char: '\t' },
  { id: 'equals', label: '= (equals)', char: '=' },
  { id: 'semicolon', label: '; (semicolon)', char: ';' },
  { id: 'slash', label: '/ (slash)', char: '/' },
  { id: 'comma', label: ', (comma)', char: ',' },
  { id: 'dash', label: '- (dash)', char: '-' },
]

export interface ParsedLine {
  /** 1-based line number in the original text (blank lines are skipped). */
  lineNo: number
  raw: string
  term: string
  translation: string
  /** True when the line did not split into exactly two non-empty parts. */
  malformed: boolean
}

export interface ParseResult {
  cards: NewCardInput[]
  lines: ParsedLine[]
  okCount: number
  malformedCount: number
}

/** Split a single line on the first occurrence of the separator only, so the
 *  translation side may itself contain the separator character. */
function splitOnFirst(line: string, sep: string): [string, string] {
  const idx = line.indexOf(sep)
  if (idx === -1) return [line, '']
  return [line.slice(0, idx), line.slice(idx + sep.length)]
}

export function parseText(text: string, sep: string): ParseResult {
  const lines: ParsedLine[] = []
  const cards: NewCardInput[] = []
  let okCount = 0
  let malformedCount = 0

  text.split(/\r?\n/).forEach((raw, i) => {
    if (raw.trim() === '') return // skip blank lines entirely
    const [aRaw, bRaw] = splitOnFirst(raw, sep)
    // Keep inner content exactly as typed; only trim the outer whitespace so
    // the 1:1 writing check compares clean strings.
    const term = aRaw.trim()
    const translation = bRaw.trim()
    const malformed = term === '' || translation === '' || !raw.includes(sep)

    lines.push({ lineNo: i + 1, raw, term, translation, malformed })
    if (malformed) {
      malformedCount++
    } else {
      okCount++
      cards.push({ term, translation })
    }
  })

  return { cards, lines, okCount, malformedCount }
}

/** Pick the separator that yields the most well-formed lines. Ties are broken
 *  by the SEPARATORS order (tab first — the Quizlet/Excel default). */
export function autoDetectSeparator(text: string): SeparatorOption {
  let best = SEPARATORS[0]
  let bestScore = -1
  for (const opt of SEPARATORS) {
    const { okCount } = parseText(text, opt.char)
    if (okCount > bestScore) {
      bestScore = okCount
      best = opt
    }
  }
  return best
}
